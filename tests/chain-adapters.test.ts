import {
  ChainAdapter,
  getChainAdapter,
  getAllChainConfigs,
  getChainConfig,
} from "@/chains/chain-adapters";

describe("ChainAdapters", () => {
  describe("chain configuration", () => {
    it("should return all 3 chain configs", () => {
      const configs = getAllChainConfigs();
      expect(configs).toHaveLength(3);

      const ids = configs.map((c) => c.id);
      expect(ids).toContain("chain_a");
      expect(ids).toContain("chain_b");
      expect(ids).toContain("chain_c");
    });

    it("should return correct config for chain_a (Ethereum-like)", () => {
      const config = getChainConfig("chain_a");
      expect(config.name).toContain("Ethereum");
      expect(config.type).toBe("L1");
      expect(config.avgConfirmationMs).toBe(12000);
      expect(config.reliability).toBe(0.95);
    });

    it("should return correct config for chain_b (L2-like)", () => {
      const config = getChainConfig("chain_b");
      expect(config.type).toBe("L2");
      expect(config.avgConfirmationMs).toBe(2000);
      expect(config.baseFee).toBeLessThan(getChainConfig("chain_a").baseFee);
    });

    it("should return correct config for chain_c (Alt-chain)", () => {
      const config = getChainConfig("chain_c");
      expect(config.type).toBe("Alt-L1");
      expect(config.reliability).toBe(0.8);
      expect(config.reliability).toBeLessThan(
        getChainConfig("chain_a").reliability
      );
    });

    it("should have reliability values between 0 and 1 for all chains", () => {
      const configs = getAllChainConfigs();
      configs.forEach((c) => {
        expect(c.reliability).toBeGreaterThan(0);
        expect(c.reliability).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("adapter instantiation", () => {
    it("should create an adapter for each valid chain", () => {
      expect(() => getChainAdapter("chain_a")).not.toThrow();
      expect(() => getChainAdapter("chain_b")).not.toThrow();
      expect(() => getChainAdapter("chain_c")).not.toThrow();
    });

    it("should throw for an unknown chain ID", () => {
      expect(() => new ChainAdapter("chain_z" as never)).toThrow(
        "Unknown chain"
      );
    });

    it("should expose the chain config via getter", () => {
      const adapter = getChainAdapter("chain_a");
      expect(adapter.chainConfig.id).toBe("chain_a");
      expect(adapter.chainConfig.name).toBeDefined();
    });
  });

  describe("sendTransaction", () => {
    it("should return a transaction receipt with valid fields on success", async () => {
      const adapter = getChainAdapter("chain_a");
      try {
        const receipt = await adapter.sendTransaction(
          "0xFrom",
          "0xTo",
          100,
          "USDC"
        );
        expect(receipt.txHash).toMatch(/^0x[0-9a-f]+$/);
        expect(receipt.chain).toBe("chain_a");
        expect(receipt.status).toBe("confirmed");
        expect(parseFloat(receipt.gasUsed)).toBeGreaterThan(0);
        expect(receipt.blockNumber).toBeGreaterThan(0);
        expect(receipt.confirmationMs).toBeGreaterThan(0);
      } catch (err) {
        const chainErr = err as { type: string; code: string; chain: string };
        expect(chainErr.type).toBeDefined();
        expect(chainErr.code).toBeDefined();
        expect(chainErr.chain).toBe("chain_a");
      }
    }, 15000);

    it("should resolve or throw a structured ChainError", async () => {
      const adapter = getChainAdapter("chain_c");
      const attempts = 5;
      let sawSuccess = false;
      let sawError = false;

      for (let i = 0; i < attempts; i++) {
        try {
          await adapter.sendTransaction("0xA", "0xB", 50, "USDC");
          sawSuccess = true;
        } catch (err) {
          sawError = true;
          const chainErr = err as {
            type: string;
            code: string;
            message: string;
            chain: string;
            retryable: boolean;
          };
          expect(["transient", "permanent"]).toContain(chainErr.type);
          expect(chainErr.message).toBeDefined();
          expect(chainErr.chain).toBe("chain_c");
          expect(typeof chainErr.retryable).toBe("boolean");
        }
      }

      expect(sawSuccess || sawError).toBe(true);
    }, 30000);
  });

  describe("waitForConfirmation", () => {
    it("should confirm a given tx hash", async () => {
      const adapter = getChainAdapter("chain_b");
      const receipt = await adapter.waitForConfirmation("0xfake123");
      expect(receipt.txHash).toBe("0xfake123");
      expect(receipt.chain).toBe("chain_b");
      expect(receipt.status).toBe("confirmed");
    }, 10000);
  });

  describe("getBalance", () => {
    it("should return a positive numeric balance", async () => {
      const adapter = getChainAdapter("chain_a");
      const balance = await adapter.getBalance("0xAddr", "USDC");
      expect(balance).toBeGreaterThan(0);
      expect(typeof balance).toBe("number");
    }, 5000);
  });

  describe("estimateGas", () => {
    it("should return a positive gas estimate", async () => {
      const adapter = getChainAdapter("chain_a");
      const gas = await adapter.estimateGas();
      expect(gas).toBeGreaterThan(0);
      expect(typeof gas).toBe("number");
    }, 5000);

    it("should return fees proportional to chain base fee", async () => {
      const adapterA = getChainAdapter("chain_a");
      const adapterB = getChainAdapter("chain_b");
      const gasA = await adapterA.estimateGas();
      const gasB = await adapterB.estimateGas();
      expect(gasA).toBeGreaterThan(gasB);
    }, 5000);
  });
});
