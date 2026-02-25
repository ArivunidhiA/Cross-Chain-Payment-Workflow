import type { Workflow, WorkflowDefinition, StepResult } from "@/types";
import {
  createWorkflow,
  getWorkflow,
  updateWorkflowStatus,
  updateWorkflowStep,
} from "@/db/store";
import { StateMachine } from "./state-machine";
import { RecoveryManager } from "./recovery-manager";
import { AuditLogger } from "@/logging/audit-logger";
import { executeStep } from "@/steps/step-executors";

const logger = new AuditLogger();
const recoveryManager = new RecoveryManager(logger);

export async function createNewWorkflow(
  definition: WorkflowDefinition
): Promise<Workflow> {
  const workflow = createWorkflow(definition);

  logger.log({
    workflowId: workflow.id,
    step: -1,
    action: "workflow_created",
    chain: definition.steps[0]?.chain || "chain_a",
    status: "info",
    message: `Workflow "${definition.name}" created with ${definition.steps.length} steps`,
  });

  return workflow;
}

export async function executeWorkflow(workflowId: string): Promise<Workflow> {
  let workflow = getWorkflow(workflowId);
  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

  if (StateMachine.isTerminalWorkflowState(workflow.status)) {
    return workflow;
  }

  if (workflow.status === "CREATED") {
    StateMachine.transitionWorkflow(workflow.status, "PENDING");
    updateWorkflowStatus(workflowId, "PENDING");
    workflow = getWorkflow(workflowId)!;
  }

  StateMachine.transitionWorkflow(workflow.status, "EXECUTING");
  updateWorkflowStatus(workflowId, "EXECUTING");

  logger.log({
    workflowId,
    step: -1,
    action: "workflow_execution_started",
    chain: workflow.definition.steps[0]?.chain || "chain_a",
    status: "info",
    message: `Starting execution from step ${workflow.currentStep}`,
  });

  const stepResults: StepResult[] = [...workflow.stepResults];
  const steps = workflow.definition.steps;

  for (let i = workflow.currentStep; i < steps.length; i++) {
    const stepDef = steps[i];

    logger.logStepStart(workflowId, i, stepDef.type, stepDef.chain);

    updateWorkflowStep(workflowId, i, stepResults);

    let result = await executeStep(stepDef, {
      workflowId,
      stepIndex: i,
      sourceAddress: workflow.definition.sourceAddress,
      destinationAddress: workflow.definition.destinationAddress,
    });

    if (result.status === "FAILED") {
      logger.logStepFailure(
        workflowId,
        i,
        stepDef.type,
        stepDef.chain,
        result.error || "Unknown error",
        result.durationMs || 0
      );

      updateWorkflowStatus(workflowId, "RECOVERING");

      const recovery = await recoveryManager.attemptRecovery(
        getWorkflow(workflowId)!,
        result,
        stepDef
      );

      if (recovery.recovered && recovery.result) {
        result = recovery.result;
        updateWorkflowStatus(workflowId, "EXECUTING");
      } else {
        updateWorkflowStatus(
          workflowId,
          "WITHDRAWAL_PENDING",
          result.error
        );

        const completedSteps = stepResults.filter(
          (s) => s.status === "COMPLETED"
        );
        await recoveryManager.executeWithdrawal(
          getWorkflow(workflowId)!,
          completedSteps
        );

        stepResults[i] = result;
        updateWorkflowStep(workflowId, i, stepResults);
        updateWorkflowStatus(workflowId, "WITHDRAWN", result.error);

        return getWorkflow(workflowId)!;
      }
    }

    if (result.status === "COMPLETED") {
      logger.logStepComplete(
        workflowId,
        i,
        stepDef.type,
        stepDef.chain,
        result.txHash || "",
        result.amount,
        result.token,
        result.durationMs || 0,
        result.gasUsed || "0"
      );
    }

    stepResults[i] = result;
    updateWorkflowStep(workflowId, i + 1, stepResults);
  }

  updateWorkflowStatus(workflowId, "COMPLETED");

  logger.log({
    workflowId,
    step: -1,
    action: "workflow_completed",
    chain: steps[steps.length - 1]?.chain || "chain_a",
    status: "success",
    message: `Workflow completed successfully. All ${steps.length} steps executed.`,
  });

  return getWorkflow(workflowId)!;
}

export function getWorkflowById(id: string): Workflow | null {
  return getWorkflow(id);
}
