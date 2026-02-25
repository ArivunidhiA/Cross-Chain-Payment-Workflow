import { AuditLogger } from "@/logging/audit-logger";
import {
  createWorkflow,
  getAuditLogs,
  insertAuditLog,
} from "@/db/store";
import type { WorkflowDefinition } from "@/types";

const logger = new AuditLogger();

function setupWorkflow(): string {
  const def: WorkflowDefinition = {
    name: "Audit Test Workflow",
    description: "For audit logger testing",
    sourceAddress: "0xAuditSource",
    destinationAddress: "0xAuditDest",
    steps: [
      { type: "transfer", chain: "chain_a", token: "USDC", amount: 100 },
    ],
  };
  const wf = createWorkflow(def);
  return wf.id;
}

describe("AuditLogger", () => {
  describe("log()", () => {
    it("should create an audit entry with all provided fields", () => {
      const wfId = setupWorkflow();
      const entry = logger.log({
        workflowId: wfId,
        step: 0,
        action: "test_action",
        chain: "chain_a",
        status: "success",
        txHash: "0xabc123",
        amount: "100",
        token: "USDC",
        durationMs: 1500,
        gasUsed: "0.003",
        metadata: { key: "value" },
        message: "Test log entry",
      });

      expect(entry.id).toMatch(/^log_/);
      expect(entry.workflowId).toBe(wfId);
      expect(entry.step).toBe(0);
      expect(entry.action).toBe("test_action");
      expect(entry.chain).toBe("chain_a");
      expect(entry.status).toBe("success");
      expect(entry.txHash).toBe("0xabc123");
      expect(entry.amount).toBe("100");
      expect(entry.token).toBe("USDC");
      expect(entry.durationMs).toBe(1500);
      expect(entry.gasUsed).toBe("0.003");
      expect(entry.metadata?.key).toBe("value");
      expect(entry.message).toBe("Test log entry");
      expect(entry.timestamp).toBeDefined();
    });

    it("should create an entry with only required fields", () => {
      const wfId = setupWorkflow();
      const entry = logger.log({
        workflowId: wfId,
        step: -1,
        action: "minimal",
        chain: "chain_b",
        status: "info",
      });

      expect(entry.id).toBeDefined();
      expect(entry.txHash).toBeUndefined();
      expect(entry.amount).toBeUndefined();
      expect(entry.metadata).toBeUndefined();
    });
  });

  describe("logStepStart()", () => {
    it("should log a step start with pending status", () => {
      const wfId = setupWorkflow();
      const entry = logger.logStepStart(wfId, 0, "bridge", "chain_a");

      expect(entry.action).toBe("bridge_started");
      expect(entry.status).toBe("pending");
      expect(entry.message).toContain("bridge");
      expect(entry.message).toContain("chain_a");
    });
  });

  describe("logStepComplete()", () => {
    it("should log a step completion with success status and tx details", () => {
      const wfId = setupWorkflow();
      const entry = logger.logStepComplete(
        wfId,
        1,
        "swap",
        "chain_b",
        "0xtx456",
        99.5,
        "WETH",
        2300,
        "0.0003"
      );

      expect(entry.action).toBe("swap_completed");
      expect(entry.status).toBe("success");
      expect(entry.txHash).toBe("0xtx456");
      expect(entry.amount).toBe("99.5");
      expect(entry.token).toBe("WETH");
      expect(entry.durationMs).toBe(2300);
      expect(entry.gasUsed).toBe("0.0003");
    });
  });

  describe("logStepFailure()", () => {
    it("should log a step failure with error message", () => {
      const wfId = setupWorkflow();
      const entry = logger.logStepFailure(
        wfId,
        2,
        "transfer",
        "chain_c",
        "RPC endpoint timed out",
        800
      );

      expect(entry.action).toBe("transfer_failed");
      expect(entry.status).toBe("failure");
      expect(entry.message).toBe("RPC endpoint timed out");
      expect(entry.durationMs).toBe(800);
    });
  });

  describe("log retrieval and filtering", () => {
    it("should retrieve logs filtered by workflow ID", () => {
      const wfId = setupWorkflow();
      logger.log({
        workflowId: wfId,
        step: 0,
        action: "filter_test",
        chain: "chain_a",
        status: "info",
      });

      const logs = getAuditLogs({ workflowId: wfId });
      expect(logs.length).toBeGreaterThan(0);
      logs.forEach((log) => {
        expect(log.workflowId).toBe(wfId);
      });
    });

    it("should retrieve logs filtered by chain", () => {
      const wfId = setupWorkflow();
      logger.log({
        workflowId: wfId,
        step: 0,
        action: "chain_filter",
        chain: "chain_c",
        status: "success",
      });

      const logs = getAuditLogs({ chain: "chain_c" });
      logs.forEach((log) => {
        expect(log.chain).toBe("chain_c");
      });
    });

    it("should retrieve logs filtered by status", () => {
      const wfId = setupWorkflow();
      logger.log({
        workflowId: wfId,
        step: 0,
        action: "status_filter",
        chain: "chain_a",
        status: "failure",
        message: "test failure",
      });

      const logs = getAuditLogs({ status: "failure" });
      logs.forEach((log) => {
        expect(log.status).toBe("failure");
      });
    });

    it("should respect the limit parameter", () => {
      const wfId = setupWorkflow();
      for (let i = 0; i < 5; i++) {
        logger.log({
          workflowId: wfId,
          step: i,
          action: `limit_test_${i}`,
          chain: "chain_a",
          status: "info",
        });
      }

      const logs = getAuditLogs({ workflowId: wfId, limit: 3 });
      expect(logs.length).toBeLessThanOrEqual(3);
    });
  });
});
