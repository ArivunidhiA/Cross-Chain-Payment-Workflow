import type {
  Workflow,
  StepResult,
  WorkflowStepDefinition,
  ChainError,
  FailureType,
} from "@/types";
import { executeStep } from "@/steps/step-executors";
import { AuditLogger } from "@/logging/audit-logger";

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 1000;

function classifyError(error: string | undefined): FailureType {
  if (!error) return "transient";

  const permanentPatterns = [
    "INSUFFICIENT_BALANCE",
    "NO_LIQUIDITY",
    "INVALID_ROUTE",
    "CONTRACT_REVERTED",
  ];

  for (const pattern of permanentPatterns) {
    if (error.toUpperCase().includes(pattern)) return "permanent";
  }

  return "transient";
}

function getBackoffMs(attempt: number): number {
  return BASE_BACKOFF_MS * Math.pow(2, attempt) * (0.8 + Math.random() * 0.4);
}

export class RecoveryManager {
  private logger: AuditLogger;

  constructor(logger: AuditLogger) {
    this.logger = logger;
  }

  async attemptRecovery(
    workflow: Workflow,
    failedStep: StepResult,
    stepDef: WorkflowStepDefinition
  ): Promise<{
    recovered: boolean;
    result?: StepResult;
    action: "retry_success" | "retry_exhausted" | "permanent_failure";
  }> {
    const failureType = classifyError(failedStep.error);
    const errorCode =
      failedStep.metadata?.errorCode || "UNKNOWN";

    this.logger.log({
      workflowId: workflow.id,
      step: failedStep.stepIndex,
      action: "recovery_started",
      chain: failedStep.chain,
      status: "info",
      message: `Failure type: ${failureType}, error: ${errorCode}`,
      metadata: { failureType, errorCode },
    });

    if (failureType === "permanent") {
      this.logger.log({
        workflowId: workflow.id,
        step: failedStep.stepIndex,
        action: "permanent_failure_detected",
        chain: failedStep.chain,
        status: "failure",
        message: `Permanent failure: ${failedStep.error}. Triggering withdrawal.`,
        metadata: { errorCode },
      });

      return { recovered: false, action: "permanent_failure" };
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const backoff = getBackoffMs(attempt - 1);

      this.logger.log({
        workflowId: workflow.id,
        step: failedStep.stepIndex,
        action: `retry_attempt_${attempt}`,
        chain: failedStep.chain,
        status: "info",
        message: `Retry ${attempt}/${MAX_RETRIES} after ${Math.round(backoff)}ms backoff`,
        metadata: { attempt: String(attempt), backoffMs: String(Math.round(backoff)) },
      });

      await new Promise((resolve) => setTimeout(resolve, Math.min(backoff, 400)));

      const result = await executeStep(stepDef, {
        workflowId: workflow.id,
        stepIndex: failedStep.stepIndex,
        sourceAddress: workflow.definition.sourceAddress,
        destinationAddress: workflow.definition.destinationAddress,
      });

      result.retryCount = attempt;

      if (result.status === "COMPLETED") {
        this.logger.log({
          workflowId: workflow.id,
          step: failedStep.stepIndex,
          action: "retry_success",
          chain: result.chain,
          status: "success",
          txHash: result.txHash,
          amount: String(result.amount),
          token: result.token,
          durationMs: result.durationMs,
          gasUsed: result.gasUsed,
          message: `Recovered on attempt ${attempt}`,
        });

        return { recovered: true, result, action: "retry_success" };
      }
    }

    this.logger.log({
      workflowId: workflow.id,
      step: failedStep.stepIndex,
      action: "retries_exhausted",
      chain: failedStep.chain,
      status: "failure",
      message: `All ${MAX_RETRIES} retries exhausted. Triggering withdrawal.`,
    });

    return { recovered: false, action: "retry_exhausted" };
  }

  async executeWithdrawal(
    workflow: Workflow,
    completedSteps: StepResult[]
  ): Promise<void> {
    this.logger.log({
      workflowId: workflow.id,
      step: -1,
      action: "withdrawal_started",
      chain: workflow.definition.steps[0].chain,
      status: "info",
      message: `Reversing ${completedSteps.length} completed steps`,
    });

    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const step = completedSteps[i];

      this.logger.log({
        workflowId: workflow.id,
        step: step.stepIndex,
        action: `reversal_step_${step.type}`,
        chain: step.chain,
        status: "info",
        message: `Reversing ${step.type} on ${step.chain}: ${step.amount} ${step.token}`,
        metadata: { originalTxHash: step.txHash || "none" },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.logger.log({
      workflowId: workflow.id,
      step: -1,
      action: "withdrawal_completed",
      chain: workflow.definition.steps[0].chain,
      status: "success",
      message: "All steps reversed. Funds returned to origin.",
    });
  }
}
