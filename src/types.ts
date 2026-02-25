export type ChainId = "chain_a" | "chain_b" | "chain_c";

export type StepType = "onramp" | "bridge" | "swap" | "transfer";

export type WorkflowStatus =
  | "CREATED"
  | "PENDING"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "RECOVERING"
  | "RECOVERED"
  | "WITHDRAWAL_PENDING"
  | "WITHDRAWN";

export type StepStatus =
  | "PENDING"
  | "EXECUTING"
  | "COMPLETED"
  | "FAILED"
  | "RECOVERING"
  | "RECOVERED"
  | "SKIPPED";

export type FailureType = "transient" | "permanent";

export interface ChainConfig {
  id: ChainId;
  name: string;
  type: string;
  avgConfirmationMs: number;
  baseFee: number;
  reliability: number; // 0-1
  description: string;
}

export interface WorkflowStepDefinition {
  type: StepType;
  chain: ChainId;
  destinationChain?: ChainId;
  token: string;
  destinationToken?: string;
  amount: number;
  toAddress?: string;
  metadata?: Record<string, string>;
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  steps: WorkflowStepDefinition[];
  sourceAddress: string;
  destinationAddress: string;
}

export interface StepResult {
  stepIndex: number;
  type: StepType;
  status: StepStatus;
  chain: ChainId;
  txHash?: string;
  amount: number;
  token: string;
  gasUsed?: string;
  durationMs?: number;
  error?: string;
  retryCount: number;
  metadata?: Record<string, string>;
  startedAt?: string;
  completedAt?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  definition: WorkflowDefinition;
  stepResults: StepResult[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

export interface AuditEntry {
  id: string;
  workflowId: string;
  step: number;
  action: string;
  chain: ChainId;
  status: "success" | "failure" | "pending" | "info";
  txHash?: string;
  amount?: string;
  token?: string;
  timestamp: string;
  durationMs?: number;
  gasUsed?: string;
  metadata?: Record<string, string>;
  message?: string;
}

export interface TransactionReceipt {
  txHash: string;
  chain: ChainId;
  status: "confirmed" | "failed" | "reverted";
  gasUsed: string;
  blockNumber: number;
  confirmationMs: number;
}

export interface ChainError {
  type: FailureType;
  code: string;
  message: string;
  chain: ChainId;
  retryable: boolean;
}

export type WorkflowTemplate = "cross_chain_swap" | "multi_hop" | "failure_scenario";

export interface WorkflowTemplateDefinition {
  id: WorkflowTemplate;
  name: string;
  description: string;
  definition: WorkflowDefinition;
}
