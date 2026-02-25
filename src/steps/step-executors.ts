import type {
  WorkflowStepDefinition,
  StepResult,
  ChainId,
  ChainError,
} from "@/types";
import { getChainAdapter } from "@/chains/chain-adapters";

interface ExecutionContext {
  workflowId: string;
  stepIndex: number;
  sourceAddress: string;
  destinationAddress: string;
}

async function executeOnramp(
  step: WorkflowStepDefinition,
  ctx: ExecutionContext
): Promise<StepResult> {
  const start = Date.now();
  const adapter = getChainAdapter(step.chain);

  try {
    const receipt = await adapter.sendTransaction(
      "fiat_provider",
      ctx.sourceAddress,
      step.amount,
      step.token
    );

    return {
      stepIndex: ctx.stepIndex,
      type: "onramp",
      status: "COMPLETED",
      chain: step.chain,
      txHash: receipt.txHash,
      amount: step.amount,
      token: step.token,
      gasUsed: receipt.gasUsed,
      durationMs: Date.now() - start,
      retryCount: 0,
      metadata: { provider: "fiat_onramp_sim", blockNumber: String(receipt.blockNumber) },
      startedAt: new Date(start).toISOString(),
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    const chainErr = err as ChainError;
    return {
      stepIndex: ctx.stepIndex,
      type: "onramp",
      status: "FAILED",
      chain: step.chain,
      amount: step.amount,
      token: step.token,
      durationMs: Date.now() - start,
      error: chainErr.message || "Onramp failed",
      retryCount: 0,
      metadata: { errorCode: chainErr.code || "UNKNOWN" },
      startedAt: new Date(start).toISOString(),
    };
  }
}

async function executeBridge(
  step: WorkflowStepDefinition,
  ctx: ExecutionContext
): Promise<StepResult> {
  const start = Date.now();
  const sourceAdapter = getChainAdapter(step.chain);
  const destChain = step.destinationChain || ("chain_b" as ChainId);

  try {
    const burnReceipt = await sourceAdapter.sendTransaction(
      ctx.sourceAddress,
      "bridge_contract",
      step.amount,
      step.token
    );

    const destAdapter = getChainAdapter(destChain);
    const mintReceipt = await destAdapter.sendTransaction(
      "bridge_contract",
      ctx.destinationAddress,
      step.amount,
      step.token
    );

    return {
      stepIndex: ctx.stepIndex,
      type: "bridge",
      status: "COMPLETED",
      chain: step.chain,
      txHash: burnReceipt.txHash,
      amount: step.amount,
      token: step.token,
      gasUsed: (
        parseFloat(burnReceipt.gasUsed) + parseFloat(mintReceipt.gasUsed)
      ).toFixed(6),
      durationMs: Date.now() - start,
      retryCount: 0,
      metadata: {
        bridgeProvider: "cctp_sim",
        sourceChain: step.chain,
        destChain,
        burnTx: burnReceipt.txHash,
        mintTx: mintReceipt.txHash,
      },
      startedAt: new Date(start).toISOString(),
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    const chainErr = err as ChainError;
    return {
      stepIndex: ctx.stepIndex,
      type: "bridge",
      status: "FAILED",
      chain: step.chain,
      amount: step.amount,
      token: step.token,
      durationMs: Date.now() - start,
      error: chainErr.message || "Bridge failed",
      retryCount: 0,
      metadata: {
        errorCode: chainErr.code || "UNKNOWN",
        destChain,
      },
      startedAt: new Date(start).toISOString(),
    };
  }
}

async function executeSwap(
  step: WorkflowStepDefinition,
  ctx: ExecutionContext
): Promise<StepResult> {
  const start = Date.now();
  const adapter = getChainAdapter(step.chain);
  const destToken = step.destinationToken || "WETH";

  try {
    const receipt = await adapter.sendTransaction(
      ctx.sourceAddress,
      "dex_router",
      step.amount,
      step.token
    );

    const outputAmount = step.amount * (0.995 + Math.random() * 0.004);

    return {
      stepIndex: ctx.stepIndex,
      type: "swap",
      status: "COMPLETED",
      chain: step.chain,
      txHash: receipt.txHash,
      amount: parseFloat(outputAmount.toFixed(2)),
      token: destToken,
      gasUsed: receipt.gasUsed,
      durationMs: Date.now() - start,
      retryCount: 0,
      metadata: {
        dex: "uniswap_sim",
        inputToken: step.token,
        outputToken: destToken,
        inputAmount: String(step.amount),
        slippage: "0.5%",
      },
      startedAt: new Date(start).toISOString(),
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    const chainErr = err as ChainError;
    return {
      stepIndex: ctx.stepIndex,
      type: "swap",
      status: "FAILED",
      chain: step.chain,
      amount: step.amount,
      token: step.token,
      durationMs: Date.now() - start,
      error: chainErr.message || "Swap failed",
      retryCount: 0,
      metadata: { errorCode: chainErr.code || "UNKNOWN", destToken },
      startedAt: new Date(start).toISOString(),
    };
  }
}

async function executeTransfer(
  step: WorkflowStepDefinition,
  ctx: ExecutionContext
): Promise<StepResult> {
  const start = Date.now();
  const adapter = getChainAdapter(step.chain);
  const toAddr = step.toAddress || ctx.destinationAddress;

  try {
    const receipt = await adapter.sendTransaction(
      ctx.sourceAddress,
      toAddr,
      step.amount,
      step.token
    );

    return {
      stepIndex: ctx.stepIndex,
      type: "transfer",
      status: "COMPLETED",
      chain: step.chain,
      txHash: receipt.txHash,
      amount: step.amount,
      token: step.token,
      gasUsed: receipt.gasUsed,
      durationMs: Date.now() - start,
      retryCount: 0,
      metadata: { to: toAddr },
      startedAt: new Date(start).toISOString(),
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    const chainErr = err as ChainError;
    return {
      stepIndex: ctx.stepIndex,
      type: "transfer",
      status: "FAILED",
      chain: step.chain,
      amount: step.amount,
      token: step.token,
      durationMs: Date.now() - start,
      error: chainErr.message || "Transfer failed",
      retryCount: 0,
      metadata: { errorCode: chainErr.code || "UNKNOWN", to: toAddr },
      startedAt: new Date(start).toISOString(),
    };
  }
}

const EXECUTORS: Record<
  string,
  (step: WorkflowStepDefinition, ctx: ExecutionContext) => Promise<StepResult>
> = {
  onramp: executeOnramp,
  bridge: executeBridge,
  swap: executeSwap,
  transfer: executeTransfer,
};

export async function executeStep(
  step: WorkflowStepDefinition,
  ctx: ExecutionContext
): Promise<StepResult> {
  const executor = EXECUTORS[step.type];
  if (!executor) {
    throw new Error(`Unknown step type: ${step.type}`);
  }
  return executor(step, ctx);
}
