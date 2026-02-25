import type {
  ChainId,
  ChainConfig,
  TransactionReceipt,
  ChainError,
} from "@/types";

const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  chain_a: {
    id: "chain_a",
    name: "Ethereum Mainnet (Sim)",
    type: "L1",
    avgConfirmationMs: 12000,
    baseFee: 0.003,
    reliability: 0.95,
    description: "Slow confirmations (~12s), higher fees, reliable",
  },
  chain_b: {
    id: "chain_b",
    name: "Optimism L2 (Sim)",
    type: "L2",
    avgConfirmationMs: 2000,
    baseFee: 0.0003,
    reliability: 0.9,
    description: "Fast confirmations (~2s), low fees, occasional reorgs",
  },
  chain_c: {
    id: "chain_c",
    name: "Avalanche (Sim)",
    type: "Alt-L1",
    avgConfirmationMs: 4000,
    baseFee: 0.001,
    reliability: 0.8,
    description: "Medium speed, intermittent RPC failures",
  },
};

function randomHex(bytes: number): string {
  const chars = "0123456789abcdef";
  let result = "0x";
  for (let i = 0; i < bytes * 2; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldFail(chain: ChainConfig): boolean {
  return Math.random() > chain.reliability;
}

function randomFailure(chainId: ChainId): ChainError {
  const errors: ChainError[] = [
    {
      type: "transient",
      code: "RPC_TIMEOUT",
      message: "RPC endpoint timed out",
      chain: chainId,
      retryable: true,
    },
    {
      type: "transient",
      code: "GAS_SPIKE",
      message: "Gas price spiked above threshold",
      chain: chainId,
      retryable: true,
    },
    {
      type: "transient",
      code: "NONCE_CONFLICT",
      message: "Nonce already used, needs refresh",
      chain: chainId,
      retryable: true,
    },
    {
      type: "permanent",
      code: "INSUFFICIENT_BALANCE",
      message: "Insufficient token balance for operation",
      chain: chainId,
      retryable: false,
    },
    {
      type: "permanent",
      code: "NO_LIQUIDITY",
      message: "No liquidity available for this token pair",
      chain: chainId,
      retryable: false,
    },
  ];

  const transientWeight = 0.75;
  const isTransient = Math.random() < transientWeight;
  const filtered = errors.filter((e) =>
    isTransient ? e.type === "transient" : e.type === "permanent"
  );
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export class ChainAdapter {
  private config: ChainConfig;

  constructor(chainId: ChainId) {
    this.config = CHAIN_CONFIGS[chainId];
    if (!this.config) throw new Error(`Unknown chain: ${chainId}`);
  }

  get chainConfig(): ChainConfig {
    return this.config;
  }

  async sendTransaction(
    _from: string,
    _to: string,
    _amount: number,
    _token: string
  ): Promise<TransactionReceipt> {
    const jitter = 0.5 + Math.random();
    const confirmMs = Math.round(this.config.avgConfirmationMs * jitter);

    await sleep(Math.min(confirmMs, 500));

    if (shouldFail(this.config)) {
      const error = randomFailure(this.config.id);
      throw error;
    }

    return {
      txHash: randomHex(32),
      chain: this.config.id,
      status: "confirmed",
      gasUsed: (this.config.baseFee * (0.8 + Math.random() * 0.4)).toFixed(6),
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      confirmationMs: confirmMs,
    };
  }

  async waitForConfirmation(txHash: string): Promise<TransactionReceipt> {
    const waitMs = Math.round(this.config.avgConfirmationMs * 0.3);
    await sleep(Math.min(waitMs, 300));

    return {
      txHash,
      chain: this.config.id,
      status: "confirmed",
      gasUsed: "0",
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
      confirmationMs: waitMs,
    };
  }

  async getBalance(_address: string, _token: string): Promise<number> {
    await sleep(50);
    return 1000 + Math.random() * 9000;
  }

  async estimateGas(): Promise<number> {
    await sleep(50);
    return this.config.baseFee * (0.9 + Math.random() * 0.2);
  }
}

export function getChainAdapter(chainId: ChainId): ChainAdapter {
  return new ChainAdapter(chainId);
}

export function getAllChainConfigs(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS);
}

export function getChainConfig(chainId: ChainId): ChainConfig {
  return CHAIN_CONFIGS[chainId];
}
