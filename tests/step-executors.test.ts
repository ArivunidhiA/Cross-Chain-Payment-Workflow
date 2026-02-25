import { executeStep } from "@/steps/step-executors";
import type { WorkflowStepDefinition } from "@/types";

const ctx = {
  workflowId: "wf_test_exec",
  stepIndex: 0,
  sourceAddress: "0xSource",
  destinationAddress: "0xDest",
};

describe("StepExecutors", () => {
  describe("onramp executor", () => {
    const step: WorkflowStepDefinition = {
      type: "onramp",
      chain: "chain_a",
      token: "USDC",
      amount: 100,
    };

    it("should return a result with correct type and token", async () => {
      const result = await executeStep(step, ctx);
      expect(result.type).toBe("onramp");
      expect(result.token).toBe("USDC");
      expect(result.stepIndex).toBe(0);
      expect(result.chain).toBe("chain_a");
      expect(["COMPLETED", "FAILED"]).toContain(result.status);
      expect(result.durationMs).toBeGreaterThan(0);
      expect(result.startedAt).toBeDefined();
    }, 15000);

    it("should include provider metadata on success", async () => {
      const result = await executeStep(step, ctx);
      if (result.status === "COMPLETED") {
        expect(result.txHash).toMatch(/^0x/);
        expect(result.metadata?.provider).toBe("fiat_onramp_sim");
        expect(result.completedAt).toBeDefined();
        expect(result.gasUsed).toBeDefined();
      }
    }, 15000);
  });

  describe("bridge executor", () => {
    const step: WorkflowStepDefinition = {
      type: "bridge",
      chain: "chain_a",
      destinationChain: "chain_b",
      token: "USDC",
      amount: 200,
    };

    it("should return bridge result with source and dest chain metadata", async () => {
      const result = await executeStep(step, { ...ctx, stepIndex: 1 });
      expect(result.type).toBe("bridge");
      expect(result.amount).toBe(200);
      expect(["COMPLETED", "FAILED"]).toContain(result.status);

      if (result.status === "COMPLETED") {
        expect(result.metadata?.bridgeProvider).toBe("cctp_sim");
        expect(result.metadata?.sourceChain).toBe("chain_a");
        expect(result.metadata?.destChain).toBe("chain_b");
        expect(result.metadata?.burnTx).toMatch(/^0x/);
        expect(result.metadata?.mintTx).toMatch(/^0x/);
      }
    }, 15000);

    it("should default destination chain to chain_b when not specified", async () => {
      const stepNoDest: WorkflowStepDefinition = {
        type: "bridge",
        chain: "chain_a",
        token: "USDC",
        amount: 50,
      };
      const result = await executeStep(stepNoDest, ctx);
      if (result.status === "COMPLETED") {
        expect(result.metadata?.destChain).toBe("chain_b");
      }
    }, 15000);
  });

  describe("swap executor", () => {
    const step: WorkflowStepDefinition = {
      type: "swap",
      chain: "chain_b",
      token: "USDC",
      destinationToken: "WETH",
      amount: 100,
    };

    it("should return swap result with DEX metadata", async () => {
      const result = await executeStep(step, ctx);
      expect(result.type).toBe("swap");
      expect(["COMPLETED", "FAILED"]).toContain(result.status);

      if (result.status === "COMPLETED") {
        expect(result.token).toBe("WETH");
        expect(result.metadata?.dex).toBe("uniswap_sim");
        expect(result.metadata?.inputToken).toBe("USDC");
        expect(result.metadata?.outputToken).toBe("WETH");
        expect(result.amount).toBeGreaterThan(0);
        expect(result.amount).toBeLessThanOrEqual(step.amount);
      }
    }, 15000);

    it("should default destination token to WETH when not specified", async () => {
      const stepNoToken: WorkflowStepDefinition = {
        type: "swap",
        chain: "chain_b",
        token: "USDC",
        amount: 75,
      };
      const result = await executeStep(stepNoToken, ctx);
      if (result.status === "COMPLETED") {
        expect(result.token).toBe("WETH");
      }
    }, 15000);
  });

  describe("transfer executor", () => {
    const step: WorkflowStepDefinition = {
      type: "transfer",
      chain: "chain_a",
      token: "USDC",
      amount: 50,
      toAddress: "0xRecipient",
    };

    it("should return transfer result with recipient metadata", async () => {
      const result = await executeStep(step, ctx);
      expect(result.type).toBe("transfer");
      expect(["COMPLETED", "FAILED"]).toContain(result.status);

      if (result.status === "COMPLETED") {
        expect(result.metadata?.to).toBe("0xRecipient");
        expect(result.txHash).toMatch(/^0x/);
      }
    }, 15000);

    it("should use destinationAddress when toAddress is not set", async () => {
      const stepNoTo: WorkflowStepDefinition = {
        type: "transfer",
        chain: "chain_a",
        token: "USDC",
        amount: 25,
      };
      const result = await executeStep(stepNoTo, ctx);
      if (result.status === "COMPLETED") {
        expect(result.metadata?.to).toBe("0xDest");
      }
    }, 15000);
  });

  describe("error handling", () => {
    it("should throw for an unknown step type", async () => {
      const badStep = {
        type: "teleport" as never,
        chain: "chain_a" as const,
        token: "USDC",
        amount: 100,
      };
      await expect(executeStep(badStep, ctx)).rejects.toThrow(
        "Unknown step type"
      );
    });

    it("should include error details on failure", async () => {
      const step: WorkflowStepDefinition = {
        type: "transfer",
        chain: "chain_c",
        token: "USDC",
        amount: 10,
      };

      const attempts = 10;
      for (let i = 0; i < attempts; i++) {
        const result = await executeStep(step, ctx);
        if (result.status === "FAILED") {
          expect(result.error).toBeDefined();
          expect(result.metadata?.errorCode).toBeDefined();
          expect(result.retryCount).toBe(0);
          return;
        }
      }
      // chain_c has 20% failure rate, so 10 attempts should hit at least one
    }, 60000);
  });
});
