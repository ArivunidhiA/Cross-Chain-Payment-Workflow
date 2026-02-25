import type { AuditEntry, ChainId } from "@/types";
import { insertAuditLog } from "@/db/store";

interface LogInput {
  workflowId: string;
  step: number;
  action: string;
  chain: ChainId;
  status: "success" | "failure" | "pending" | "info";
  txHash?: string;
  amount?: string;
  token?: string;
  durationMs?: number;
  gasUsed?: string;
  metadata?: Record<string, string>;
  message?: string;
}

export class AuditLogger {
  log(input: LogInput): AuditEntry {
    const entry: Omit<AuditEntry, "id"> = {
      workflowId: input.workflowId,
      step: input.step,
      action: input.action,
      chain: input.chain,
      status: input.status,
      txHash: input.txHash,
      amount: input.amount,
      token: input.token,
      timestamp: new Date().toISOString(),
      durationMs: input.durationMs,
      gasUsed: input.gasUsed,
      metadata: input.metadata,
      message: input.message,
    };

    return insertAuditLog(entry);
  }

  logStepStart(
    workflowId: string,
    stepIndex: number,
    type: string,
    chain: ChainId
  ): AuditEntry {
    return this.log({
      workflowId,
      step: stepIndex,
      action: `${type}_started`,
      chain,
      status: "pending",
      message: `Executing ${type} on ${chain}`,
    });
  }

  logStepComplete(
    workflowId: string,
    stepIndex: number,
    type: string,
    chain: ChainId,
    txHash: string,
    amount: number,
    token: string,
    durationMs: number,
    gasUsed: string
  ): AuditEntry {
    return this.log({
      workflowId,
      step: stepIndex,
      action: `${type}_completed`,
      chain,
      status: "success",
      txHash,
      amount: String(amount),
      token,
      durationMs,
      gasUsed,
      message: `${type} completed: ${amount} ${token}`,
    });
  }

  logStepFailure(
    workflowId: string,
    stepIndex: number,
    type: string,
    chain: ChainId,
    error: string,
    durationMs: number
  ): AuditEntry {
    return this.log({
      workflowId,
      step: stepIndex,
      action: `${type}_failed`,
      chain,
      status: "failure",
      durationMs,
      message: error,
    });
  }
}
