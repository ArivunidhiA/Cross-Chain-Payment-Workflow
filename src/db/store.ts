import Database from "better-sqlite3";
import path from "path";
import type {
  Workflow,
  WorkflowDefinition,
  StepResult,
  AuditEntry,
  WorkflowStatus,
  ChainId,
} from "@/types";
import crypto from "crypto";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const dbPath = path.join(process.cwd(), "workflow.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
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
    );

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
      message TEXT,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id)
    );

    CREATE INDEX IF NOT EXISTS idx_audit_workflow ON audit_logs(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_audit_chain ON audit_logs(chain);
    CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status);
    CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
  `);

  return db;
}

export function createWorkflow(definition: WorkflowDefinition): Workflow {
  const database = getDb();
  const id = `wf_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const stmt = database.prepare(`
    INSERT INTO workflows (id, name, description, status, current_step, total_steps, definition, step_results, created_at, updated_at)
    VALUES (?, ?, ?, 'CREATED', 0, ?, ?, '[]', ?, ?)
  `);

  stmt.run(
    id,
    definition.name,
    definition.description,
    definition.steps.length,
    JSON.stringify(definition),
    now,
    now
  );

  return getWorkflow(id)!;
}

export function getWorkflow(id: string): Workflow | null {
  const database = getDb();
  const row = database
    .prepare("SELECT * FROM workflows WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  if (!row) return null;
  return rowToWorkflow(row);
}

export function listWorkflows(
  status?: WorkflowStatus,
  limit = 50
): Workflow[] {
  const database = getDb();
  let query = "SELECT * FROM workflows";
  const params: unknown[] = [];

  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }

  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  const rows = database.prepare(query).all(...params) as Record<string, unknown>[];
  return rows.map(rowToWorkflow);
}

export function updateWorkflowStatus(
  id: string,
  status: WorkflowStatus,
  error?: string
): void {
  const database = getDb();
  const now = new Date().toISOString();

  const completedAt =
    status === "COMPLETED" || status === "WITHDRAWN" ? now : null;

  database
    .prepare(
      `UPDATE workflows SET status = ?, error = ?, updated_at = ?, completed_at = COALESCE(?, completed_at) WHERE id = ?`
    )
    .run(status, error || null, now, completedAt, id);
}

export function updateWorkflowStep(
  id: string,
  currentStep: number,
  stepResults: StepResult[]
): void {
  const database = getDb();
  const now = new Date().toISOString();

  database
    .prepare(
      `UPDATE workflows SET current_step = ?, step_results = ?, updated_at = ? WHERE id = ?`
    )
    .run(currentStep, JSON.stringify(stepResults), now, id);
}

export function insertAuditLog(entry: Omit<AuditEntry, "id">): AuditEntry {
  const database = getDb();
  const id = `log_${crypto.randomUUID().slice(0, 8)}`;

  database
    .prepare(
      `INSERT INTO audit_logs (id, workflow_id, step, action, chain, status, tx_hash, amount, token, timestamp, duration_ms, gas_used, metadata, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      entry.workflowId,
      entry.step,
      entry.action,
      entry.chain,
      entry.status,
      entry.txHash || null,
      entry.amount || null,
      entry.token || null,
      entry.timestamp,
      entry.durationMs || null,
      entry.gasUsed || null,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
      entry.message || null
    );

  return { ...entry, id };
}

export function getAuditLogs(filters?: {
  workflowId?: string;
  chain?: ChainId;
  status?: string;
  limit?: number;
}): AuditEntry[] {
  const database = getDb();
  let query = "SELECT * FROM audit_logs";
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.workflowId) {
    conditions.push("workflow_id = ?");
    params.push(filters.workflowId);
  }
  if (filters?.chain) {
    conditions.push("chain = ?");
    params.push(filters.chain);
  }
  if (filters?.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY timestamp DESC LIMIT ?";
  params.push(filters?.limit || 100);

  const rows = database.prepare(query).all(...params) as Record<string, unknown>[];
  return rows.map(rowToAuditEntry);
}

export function getWorkflowStats(): {
  total: number;
  completed: number;
  failed: number;
  active: number;
  avgDurationMs: number;
} {
  const database = getDb();

  const total =
    (database.prepare("SELECT COUNT(*) as c FROM workflows").get() as { c: number })
      ?.c || 0;
  const completed =
    (
      database
        .prepare("SELECT COUNT(*) as c FROM workflows WHERE status = 'COMPLETED'")
        .get() as { c: number }
    )?.c || 0;
  const failed =
    (
      database
        .prepare(
          "SELECT COUNT(*) as c FROM workflows WHERE status IN ('FAILED', 'WITHDRAWN')"
        )
        .get() as { c: number }
    )?.c || 0;
  const active =
    (
      database
        .prepare(
          "SELECT COUNT(*) as c FROM workflows WHERE status IN ('EXECUTING', 'PENDING', 'RECOVERING')"
        )
        .get() as { c: number }
    )?.c || 0;

  const avgRow = database
    .prepare(
      `SELECT AVG(
        CAST((julianday(completed_at) - julianday(created_at)) * 86400000 AS INTEGER)
      ) as avg_ms FROM workflows WHERE completed_at IS NOT NULL`
    )
    .get() as { avg_ms: number | null };

  return {
    total,
    completed,
    failed,
    active,
    avgDurationMs: Math.round(avgRow?.avg_ms || 0),
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
