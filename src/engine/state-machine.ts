import type { WorkflowStatus, StepStatus } from "@/types";

const WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  CREATED: ["PENDING"],
  PENDING: ["EXECUTING"],
  EXECUTING: ["COMPLETED", "FAILED", "RECOVERING"],
  COMPLETED: [],
  FAILED: ["RECOVERING", "WITHDRAWAL_PENDING"],
  RECOVERING: ["EXECUTING", "RECOVERED", "WITHDRAWAL_PENDING"],
  RECOVERED: ["EXECUTING"],
  WITHDRAWAL_PENDING: ["WITHDRAWN", "FAILED"],
  WITHDRAWN: [],
};

const STEP_TRANSITIONS: Record<StepStatus, StepStatus[]> = {
  PENDING: ["EXECUTING"],
  EXECUTING: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: ["RECOVERING", "SKIPPED"],
  RECOVERING: ["EXECUTING", "SKIPPED"],
  RECOVERED: ["EXECUTING"],
  SKIPPED: [],
};

export class StateMachine {
  static canTransitionWorkflow(
    from: WorkflowStatus,
    to: WorkflowStatus
  ): boolean {
    return WORKFLOW_TRANSITIONS[from]?.includes(to) ?? false;
  }

  static canTransitionStep(from: StepStatus, to: StepStatus): boolean {
    return STEP_TRANSITIONS[from]?.includes(to) ?? false;
  }

  static transitionWorkflow(
    current: WorkflowStatus,
    target: WorkflowStatus
  ): WorkflowStatus {
    if (!this.canTransitionWorkflow(current, target)) {
      throw new Error(
        `Invalid workflow transition: ${current} -> ${target}. Allowed: [${WORKFLOW_TRANSITIONS[current]?.join(", ")}]`
      );
    }
    return target;
  }

  static transitionStep(
    current: StepStatus,
    target: StepStatus
  ): StepStatus {
    if (!this.canTransitionStep(current, target)) {
      throw new Error(
        `Invalid step transition: ${current} -> ${target}. Allowed: [${STEP_TRANSITIONS[current]?.join(", ")}]`
      );
    }
    return target;
  }

  static isTerminalWorkflowState(status: WorkflowStatus): boolean {
    return WORKFLOW_TRANSITIONS[status]?.length === 0;
  }

  static isTerminalStepState(status: StepStatus): boolean {
    return STEP_TRANSITIONS[status]?.length === 0;
  }

  static getWorkflowTransitions(
    status: WorkflowStatus
  ): WorkflowStatus[] {
    return WORKFLOW_TRANSITIONS[status] ?? [];
  }

  static getStepTransitions(status: StepStatus): StepStatus[] {
    return STEP_TRANSITIONS[status] ?? [];
  }
}
