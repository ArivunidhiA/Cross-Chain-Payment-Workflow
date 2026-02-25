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
  const workflow = await createWorkflow(definition);

  await logger.log({
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
  let workflow = await getWorkflow(workflowId);
  if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

  if (StateMachine.isTerminalWorkflowState(workflow.status)) {
    return workflow;
  }

  if (workflow.status === "CREATED") {
    StateMachine.transitionWorkflow(workflow.status, "PENDING");
    await updateWorkflowStatus(workflowId, "PENDING");
    workflow = (await getWorkflow(workflowId))!;
  }

  StateMachine.transitionWorkflow(workflow.status, "EXECUTING");
  await updateWorkflowStatus(workflowId, "EXECUTING");

  await logger.log({
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

    await logger.logStepStart(workflowId, i, stepDef.type, stepDef.chain);

    await updateWorkflowStep(workflowId, i, stepResults);

    let result = await executeStep(stepDef, {
      workflowId,
      stepIndex: i,
      sourceAddress: workflow.definition.sourceAddress,
      destinationAddress: workflow.definition.destinationAddress,
    });

    if (result.status === "FAILED") {
      await logger.logStepFailure(
        workflowId,
        i,
        stepDef.type,
        stepDef.chain,
        result.error || "Unknown error",
        result.durationMs || 0
      );

      await updateWorkflowStatus(workflowId, "RECOVERING");

      const recovery = await recoveryManager.attemptRecovery(
        (await getWorkflow(workflowId))!,
        result,
        stepDef
      );

      if (recovery.recovered && recovery.result) {
        result = recovery.result;
        await updateWorkflowStatus(workflowId, "EXECUTING");
      } else {
        await updateWorkflowStatus(
          workflowId,
          "WITHDRAWAL_PENDING",
          result.error
        );

        const completedSteps = stepResults.filter(
          (s) => s.status === "COMPLETED"
        );
        await recoveryManager.executeWithdrawal(
          (await getWorkflow(workflowId))!,
          completedSteps
        );

        stepResults[i] = result;
        await updateWorkflowStep(workflowId, i, stepResults);
        await updateWorkflowStatus(workflowId, "WITHDRAWN", result.error);

        return (await getWorkflow(workflowId))!;
      }
    }

    if (result.status === "COMPLETED") {
      await logger.logStepComplete(
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
    await updateWorkflowStep(workflowId, i + 1, stepResults);
  }

  await updateWorkflowStatus(workflowId, "COMPLETED");

  await logger.log({
    workflowId,
    step: -1,
    action: "workflow_completed",
    chain: steps[steps.length - 1]?.chain || "chain_a",
    status: "success",
    message: `Workflow completed successfully. All ${steps.length} steps executed.`,
  });

  return (await getWorkflow(workflowId))!;
}

export async function getWorkflowById(
  id: string
): Promise<Workflow | null> {
  return getWorkflow(id);
}
