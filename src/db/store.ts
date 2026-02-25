import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import type {
  Workflow,
  WorkflowDefinition,
  StepResult,
  AuditEntry,
  WorkflowStatus,
  ChainId,
} from "@/types";

function getSQL() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  return neon(url);
}

export async function initializeDatabase(): Promise<void> {
  const sql = getSQL();

  await sql`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CREATED',
      current_step INTEGER NOT NULL DEFAULT 0,
      total_steps INTEGER NOT NULL,
      definition TEXT NOT NULL,
      step_results TEXT NOT NULL DEFAULT '[]',
      error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL,
      step INTEGER NOT NULL,
      action TEXT NOT NULL,
      chain TEXT NOT NULL,
      status TEXT NOT NULL,
      tx_hash TEXT,
      amount TEXT,
      token TEXT,
      timestamp TEXT NOT NULL,
      duration_ms INTEGER,
      gas_used TEXT,
      metadata TEXT,
      message TEXT
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_audit_workflow ON audit_logs(workflow_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_chain ON audit_logs(chain)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status)`;
}

export async function createWorkflow(
  definition: WorkflowDefinition
): Promise<Workflow> {
  const sql = getSQL();
  const id = `wf_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  await sql`
    INSERT INTO workflows (id, name, description, status, current_step, total_steps, definition, step_results, created_at, updated_at)
    VALUES (${id}, ${definition.name}, ${definition.description}, 'CREATED', 0, ${definition.steps.length}, ${JSON.stringify(definition)}, '[]', ${now}, ${now})
  `;

  return (await getWorkflow(id))!;
}

export async function getWorkflow(id: string): Promise<Workflow | null> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM workflows WHERE id = ${id}`;

  if (rows.length === 0) return null;
  return rowToWorkflow(rows[0]);
}

export async function listWorkflows(
  status?: WorkflowStatus,
  limit = 50
): Promise<Workflow[]> {
  const sql = getSQL();
  let rows;

  if (status) {
    rows = await sql`
      SELECT * FROM workflows WHERE status = ${status}
      ORDER BY created_at DESC LIMIT ${limit}
    `;
  } else {
    rows = await sql`
      SELECT * FROM workflows
      ORDER BY created_at DESC LIMIT ${limit}
    `;
  }

  return rows.map(rowToWorkflow);
}

export async function updateWorkflowStatus(
  id: string,
  status: WorkflowStatus,
  error?: string
): Promise<void> {
  const sql = getSQL();
  const now = new Date().toISOString();
  const completedAt =
    status === "COMPLETED" || status === "WITHDRAWN" ? now : null;

  await sql`
    UPDATE workflows
    SET status = ${status},
        error = ${error || null},
        updated_at = ${now},
        completed_at = COALESCE(${completedAt}, completed_at)
    WHERE id = ${id}
  `;
}

export async function updateWorkflowStep(
  id: string,
  currentStep: number,
  stepResults: StepResult[]
): Promise<void> {
  const sql = getSQL();
  const now = new Date().toISOString();

  await sql`
    UPDATE workflows
    SET current_step = ${currentStep},
        step_results = ${JSON.stringify(stepResults)},
        updated_at = ${now}
    WHERE id = ${id}
  `;
}

export async function insertAuditLog(
  entry: Omit<AuditEntry, "id">
): Promise<AuditEntry> {
  const sql = getSQL();
  const id = `log_${crypto.randomUUID().slice(0, 8)}`;

  await sql`
    INSERT INTO audit_logs (id, workflow_id, step, action, chain, status, tx_hash, amount, token, timestamp, duration_ms, gas_used, metadata, message)
    VALUES (${id}, ${entry.workflowId}, ${entry.step}, ${entry.action}, ${entry.chain}, ${entry.status}, ${entry.txHash || null}, ${entry.amount || null}, ${entry.token || null}, ${entry.timestamp}, ${entry.durationMs || null}, ${entry.gasUsed || null}, ${entry.metadata ? JSON.stringify(entry.metadata) : null}, ${entry.message || null})
  `;

  return { ...entry, id };
}

export async function getAuditLogs(filters?: {
  workflowId?: string;
  chain?: ChainId;
  status?: string;
  limit?: number;
}): Promise<AuditEntry[]> {
  const sql = getSQL();
  const lim = filters?.limit || 100;
  let rows;

  if (filters?.workflowId && filters?.chain && filters?.status) {
    rows = await sql`
      SELECT * FROM audit_logs
      WHERE workflow_id = ${filters.workflowId} AND chain = ${filters.chain} AND status = ${filters.status}
      ORDER BY timestamp DESC LIMIT ${lim}
    `;
  } else if (filters?.workflowId && filters?.chain) {
    rows = await sql`
      SELECT * FROM audit_logs
      WHERE workflow_id = ${filters.workflowId} AND chain = ${filters.chain}
      ORDER BY timestamp DESC LIMIT ${lim}
    `;
  } else if (filters?.workflowId && filters?.status) {
    rows = await sql`
      SELECT * FROM audit_logs
      WHERE workflow_id = ${filters.workflowId} AND status = ${filters.status}
      ORDER BY timestamp DESC LIMIT ${lim}
    `;
  } else if (filters?.chain && filters?.status) {
    rows = await sql`
      SELECT * FROM audit_logs
      WHERE chain = ${filters.chain} AND status = ${filters.status}
      ORDER BY timestamp DESC LIMIT ${lim}
    `;
  } else if (filters?.workflowId) {
    rows = await sql`
      SELECT * FROM audit_logs
      WHERE workflow_id = ${filters.workflowId}
      ORDER BY timestamp DESC LIMIT ${lim}
    `;
  } else if (filters?.chain) {
    rows = await sql`
      SELECT * FROM audit_logs
      WHERE chain = ${filters.chain}
      ORDER BY timestamp DESC LIMIT ${lim}
    `;
  } else if (filters?.status) {
    rows = await sql`
      SELECT * FROM audit_logs
      WHERE status = ${filters.status}
      ORDER BY timestamp DESC LIMIT ${lim}
    `;
  } else {
    rows = await sql`
      SELECT * FROM audit_logs
      ORDER BY timestamp DESC LIMIT ${lim}
    `;
  }

  return rows.map(rowToAuditEntry);
}

export async function getWorkflowStats(): Promise<{
  total: number;
  completed: number;
  failed: number;
  active: number;
  avgDurationMs: number;
}> {
  const sql = getSQL();

  const [totalRow] = await sql`SELECT COUNT(*) as c FROM workflows`;
  const [completedRow] = await sql`SELECT COUNT(*) as c FROM workflows WHERE status = 'COMPLETED'`;
  const [failedRow] = await sql`SELECT COUNT(*) as c FROM workflows WHERE status IN ('FAILED', 'WITHDRAWN')`;
  const [activeRow] = await sql`SELECT COUNT(*) as c FROM workflows WHERE status IN ('EXECUTING', 'PENDING', 'RECOVERING')`;
  const [avgRow] = await sql`
    SELECT AVG(
      EXTRACT(EPOCH FROM (completed_at::timestamp - created_at::timestamp)) * 1000
    ) as avg_ms FROM workflows WHERE completed_at IS NOT NULL
  `;

  return {
    total: Number(totalRow?.c || 0),
    completed: Number(completedRow?.c || 0),
    failed: Number(failedRow?.c || 0),
    active: Number(activeRow?.c || 0),
    avgDurationMs: Math.round(Number(avgRow?.avg_ms || 0)),
  };
}

function rowToWorkflow(row: Record<string, unknown>): Workflow {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    status: row.status as WorkflowStatus,
    currentStep: row.current_step as number,
    totalSteps: row.total_steps as number,
    definition: JSON.parse(row.definition as string),
    stepResults: JSON.parse(row.step_results as string),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    completedAt: orUndefined<string>(row.completed_at),
    error: orUndefined<string>(row.error),
  };
}

function orUndefined<T>(val: unknown): T | undefined {
  return val != null ? (val as T) : undefined;
}

function rowToAuditEntry(row: Record<string, unknown>): AuditEntry {
  return {
    id: row.id as string,
    workflowId: row.workflow_id as string,
    step: row.step as number,
    action: row.action as string,
    chain: row.chain as ChainId,
    status: row.status as AuditEntry["status"],
    txHash: orUndefined<string>(row.tx_hash),
    amount: orUndefined<string>(row.amount),
    token: orUndefined<string>(row.token),
    timestamp: row.timestamp as string,
    durationMs: orUndefined<number>(row.duration_ms),
    gasUsed: orUndefined<string>(row.gas_used),
    metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
    message: orUndefined<string>(row.message),
  };
}
