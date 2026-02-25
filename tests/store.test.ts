import {
  createWorkflow,
  getWorkflow,
  listWorkflows,
  updateWorkflowStatus,
  updateWorkflowStep,
  insertAuditLog,
  getAuditLogs,
  getWorkflowStats,
} from "@/db/store";
import type { WorkflowDefinition, StepResult } from "@/types";

const testDef: WorkflowDefinition = {
  name: "Store Test Workflow",
  description: "For SQLite store testing",
  sourceAddress: "0xStoreSource",
  destinationAddress: "0xStoreDest",
  steps: [
    { type: "onramp", chain: "chain_a", token: "USDC", amount: 100 },
    {
      type: "bridge",
      chain: "chain_a",
      destinationChain: "chain_b",
      token: "USDC",
      amount: 100,
    },
  ],
};

describe("SQLite Store", () => {
  describe("createWorkflow()", () => {
    it("should create a workflow with a wf_ prefixed ID", () => {
      const wf = createWorkflow(testDef);
      expect(wf.id).toMatch(/^wf_/);
      expect(wf.id.length).toBeGreaterThan(3);
    });

    it("should initialize workflow with CREATED status", () => {
      const wf = createWorkflow(testDef);
      expect(wf.status).toBe("CREATED");
      expect(wf.currentStep).toBe(0);
    });

    it("should store the correct total steps count", () => {
      const wf = createWorkflow(testDef);
      expect(wf.totalSteps).toBe(2);
    });

    it("should store and parse the definition JSON correctly", () => {
      const wf = createWorkflow(testDef);
      expect(wf.definition.name).toBe("Store Test Workflow");
      expect(wf.definition.steps).toHaveLength(2);
      expect(wf.definition.steps[0].type).toBe("onramp");
      expect(wf.definition.sourceAddress).toBe("0xStoreSource");
    });

    it("should set createdAt and updatedAt timestamps", () => {
      const wf = createWorkflow(testDef);
      expect(wf.createdAt).toBeDefined();
      expect(wf.updatedAt).toBeDefined();
      expect(new Date(wf.createdAt).getTime()).toBeGreaterThan(0);
    });

    it("should initialize with empty step results", () => {
      const wf = createWorkflow(testDef);
      expect(wf.stepResults).toEqual([]);
    });

    it("should generate unique IDs for each workflow", () => {
      const wf1 = createWorkflow(testDef);
      const wf2 = createWorkflow(testDef);
      expect(wf1.id).not.toBe(wf2.id);
    });
  });

  describe("getWorkflow()", () => {
    it("should return a workflow by ID", () => {
      const wf = createWorkflow(testDef);
      const retrieved = getWorkflow(wf.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(wf.id);
      expect(retrieved!.name).toBe(wf.name);
    });

    it("should return null for a non-existent ID", () => {
      const result = getWorkflow("wf_nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("listWorkflows()", () => {
    it("should return workflows ordered by creation date descending", () => {
      createWorkflow({ ...testDef, name: "List Test A" });
      createWorkflow({ ...testDef, name: "List Test B" });
      const all = listWorkflows();
      expect(all.length).toBeGreaterThanOrEqual(2);

      const createdDates = all.map((w) => new Date(w.createdAt).getTime());
      for (let i = 1; i < createdDates.length; i++) {
        expect(createdDates[i - 1]).toBeGreaterThanOrEqual(createdDates[i]);
      }
    });

    it("should filter by status", () => {
      const wf = createWorkflow(testDef);
      updateWorkflowStatus(wf.id, "COMPLETED");

      const completed = listWorkflows("COMPLETED");
      expect(completed.some((w) => w.id === wf.id)).toBe(true);

      const created = listWorkflows("CREATED");
      expect(created.every((w) => w.status === "CREATED")).toBe(true);
    });

    it("should respect the limit parameter", () => {
      for (let i = 0; i < 5; i++) {
        createWorkflow({ ...testDef, name: `Limit Test ${i}` });
      }
      const limited = listWorkflows(undefined, 3);
      expect(limited.length).toBeLessThanOrEqual(3);
    });
  });

  describe("updateWorkflowStatus()", () => {
    it("should update the workflow status", () => {
      const wf = createWorkflow(testDef);
      updateWorkflowStatus(wf.id, "PENDING");

      const updated = getWorkflow(wf.id);
      expect(updated!.status).toBe("PENDING");
    });

    it("should set completedAt when transitioning to COMPLETED", () => {
      const wf = createWorkflow(testDef);
      updateWorkflowStatus(wf.id, "COMPLETED");

      const updated = getWorkflow(wf.id);
      expect(updated!.completedAt).toBeDefined();
    });

    it("should set completedAt when transitioning to WITHDRAWN", () => {
      const wf = createWorkflow(testDef);
      updateWorkflowStatus(wf.id, "WITHDRAWN", "Permanent failure");

      const updated = getWorkflow(wf.id);
      expect(updated!.completedAt).toBeDefined();
      expect(updated!.error).toBe("Permanent failure");
    });

    it("should store error message when provided", () => {
      const wf = createWorkflow(testDef);
      updateWorkflowStatus(wf.id, "FAILED", "Something went wrong");

      const updated = getWorkflow(wf.id);
      expect(updated!.error).toBe("Something went wrong");
    });

    it("should update the updatedAt timestamp", async () => {
      const wf = createWorkflow(testDef);
      const originalUpdatedAt = wf.updatedAt;

      await new Promise((r) => setTimeout(r, 50));

      updateWorkflowStatus(wf.id, "PENDING");
      const updated = getWorkflow(wf.id);
      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(originalUpdatedAt).getTime()
      );
    });
  });

  describe("updateWorkflowStep()", () => {
    it("should update current step and store step results", () => {
      const wf = createWorkflow(testDef);
      const results: StepResult[] = [
        {
          stepIndex: 0,
          type: "onramp",
          status: "COMPLETED",
          chain: "chain_a",
          txHash: "0xresult1",
          amount: 100,
          token: "USDC",
          retryCount: 0,
        },
      ];

      updateWorkflowStep(wf.id, 1, results);
      const updated = getWorkflow(wf.id);

      expect(updated!.currentStep).toBe(1);
      expect(updated!.stepResults).toHaveLength(1);
      expect(updated!.stepResults[0].txHash).toBe("0xresult1");
      expect(updated!.stepResults[0].status).toBe("COMPLETED");
    });
  });

  describe("audit log operations", () => {
    it("should insert and retrieve an audit log entry", () => {
      const wf = createWorkflow(testDef);
      const entry = insertAuditLog({
        workflowId: wf.id,
        step: 0,
        action: "store_test_action",
        chain: "chain_a",
        status: "success",
        txHash: "0xlogtest",
        amount: "100",
        token: "USDC",
        timestamp: new Date().toISOString(),
        durationMs: 500,
        gasUsed: "0.003",
        metadata: { test: "true" },
        message: "Store test log",
      });

      expect(entry.id).toMatch(/^log_/);

      const logs = getAuditLogs({ workflowId: wf.id });
      const found = logs.find((l) => l.id === entry.id);
      expect(found).toBeDefined();
      expect(found!.action).toBe("store_test_action");
      expect(found!.metadata?.test).toBe("true");
    });

    it("should support combined filters", () => {
      const wf = createWorkflow(testDef);
      insertAuditLog({
        workflowId: wf.id,
        step: 0,
        action: "combo_filter",
        chain: "chain_b",
        status: "failure",
        timestamp: new Date().toISOString(),
      });

      const logs = getAuditLogs({
        workflowId: wf.id,
        chain: "chain_b",
        status: "failure",
      });

      logs.forEach((log) => {
        expect(log.workflowId).toBe(wf.id);
        expect(log.chain).toBe("chain_b");
        expect(log.status).toBe("failure");
      });
    });
  });

  describe("getWorkflowStats()", () => {
    it("should return aggregate stats", () => {
      const stats = getWorkflowStats();
      expect(typeof stats.total).toBe("number");
      expect(typeof stats.completed).toBe("number");
      expect(typeof stats.failed).toBe("number");
      expect(typeof stats.active).toBe("number");
      expect(typeof stats.avgDurationMs).toBe("number");
      expect(stats.total).toBeGreaterThanOrEqual(0);
    });

    it("should count completed workflows", () => {
      const wf = createWorkflow({ ...testDef, name: "Stats Completed" });
      updateWorkflowStatus(wf.id, "COMPLETED");

      const stats = getWorkflowStats();
      expect(stats.completed).toBeGreaterThan(0);
    });

    it("should count failed/withdrawn workflows", () => {
      const wf = createWorkflow({ ...testDef, name: "Stats Failed" });
      updateWorkflowStatus(wf.id, "WITHDRAWN", "test error");

      const stats = getWorkflowStats();
      expect(stats.failed).toBeGreaterThan(0);
    });
  });
});
