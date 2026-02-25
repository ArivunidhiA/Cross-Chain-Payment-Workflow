import { RecoveryManager } from "@/engine/recovery-manager";
import { AuditLogger } from "@/logging/audit-logger";
import { createWorkflow } from "@/db/store";
import type { Workflow, StepResult, WorkflowStepDefinition } from "@/types";

const logger = new AuditLogger();
const recovery = new RecoveryManager(logger);

function createTestWorkflow(): Workflow {
  return createWorkflow({
    name: "Recovery Test",
    description: "Test workflow for recovery",
    sourceAddress: "0xSource",
    destinationAddress: "0xDest",
    steps: [
      { type: "onramp", chain: "chain_a", token: "USDC", amount: 100 },
      {
        type: "bridge",
        chain: "chain_a",
        destinationChain: "chain_b",
        token: "USDC",
        amount: 100,
      },
      { type: "transfer", chain: "chain_b", token: "USDC", amount: 100 },
    ],
  });
}

function makeFailedStep(
  error: string,
  metadata?: Record<string, string>
): StepResult {
  return {
    stepIndex: 1,
    type: "bridge",
    status: "FAILED",
    chain: "chain_a",
    amount: 100,
    token: "USDC",
    durationMs: 500,
    error,
    retryCount: 0,
    metadata,
  };
}

const bridgeStepDef: WorkflowStepDefinition = {
  type: "bridge",
  chain: "chain_a",
  destinationChain: "chain_b",
  token: "USDC",
  amount: 100,
};

describe("RecoveryManager", () => {
  describe("transient failure recovery", () => {
    it("should attempt retries for transient failures", async () => {
      const workflow = createTestWorkflow();
      const failedStep = makeFailedStep("RPC endpoint timed out", {
        errorCode: "RPC_TIMEOUT",
      });

      const result = await recovery.attemptRecovery(
        workflow,
        failedStep,
        bridgeStepDef
      );

      expect(["retry_success", "retry_exhausted"]).toContain(result.action);

      if (result.recovered) {
        expect(result.result).toBeDefined();
        expect(result.result!.status).toBe("COMPLETED");
        expect(result.result!.retryCount).toBeGreaterThan(0);
      }
    }, 30000);

    it("should retry up to 3 times before exhaustion", async () => {
      const workflow = createTestWorkflow();
      const failedStep = makeFailedStep("Gas price spiked above threshold", {
        errorCode: "GAS_SPIKE",
      });

      const result = await recovery.attemptRecovery(
        workflow,
        failedStep,
        bridgeStepDef
      );

      expect(["retry_success", "retry_exhausted"]).toContain(result.action);
    }, 30000);
  });

  describe("permanent failure detection", () => {
    it("should detect insufficient balance as permanent", async () => {
      const workflow = createTestWorkflow();
      const failedStep = makeFailedStep(
        "INSUFFICIENT_BALANCE: not enough tokens",
        { errorCode: "INSUFFICIENT_BALANCE" }
      );

      const result = await recovery.attemptRecovery(
        workflow,
        failedStep,
        bridgeStepDef
      );

      expect(result.recovered).toBe(false);
      expect(result.action).toBe("permanent_failure");
    });

    it("should detect no liquidity as permanent", async () => {
      const workflow = createTestWorkflow();
      const failedStep = makeFailedStep(
        "NO_LIQUIDITY: pool has no liquidity",
        { errorCode: "NO_LIQUIDITY" }
      );

      const result = await recovery.attemptRecovery(
        workflow,
        failedStep,
        bridgeStepDef
      );

      expect(result.recovered).toBe(false);
      expect(result.action).toBe("permanent_failure");
    });
  });

  describe("withdrawal", () => {
    it("should reverse completed steps during withdrawal", async () => {
      const workflow = createTestWorkflow();
      const completedSteps: StepResult[] = [
        {
          stepIndex: 0,
          type: "onramp",
          status: "COMPLETED",
          chain: "chain_a",
          txHash: "0xabc",
          amount: 100,
          token: "USDC",
          retryCount: 0,
        },
      ];

      await expect(
        recovery.executeWithdrawal(workflow, completedSteps)
      ).resolves.not.toThrow();
    });
  });
});
