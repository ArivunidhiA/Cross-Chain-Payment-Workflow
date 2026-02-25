"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, X, Loader2, RotateCw, Circle } from "lucide-react";
import type { StepResult, WorkflowStepDefinition } from "@/types";

const ease: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

function stepIcon(status: string) {
  const base = "size-4";
  switch (status) {
    case "COMPLETED":
      return <Check className={cn(base, "text-accent")} />;
    case "FAILED":
      return <X className={cn(base, "text-red-400")} />;
    case "EXECUTING":
      return <Loader2 className={cn(base, "animate-spin text-amber-400")} />;
    case "RECOVERING":
      return <RotateCw className={cn(base, "animate-spin text-amber-400")} />;
    default:
      return <Circle className={cn(base, "text-edge-hover")} />;
  }
}

function stepLabel(type: string) {
  return (
    { onramp: "Onramp", bridge: "Bridge", swap: "Swap", transfer: "Transfer" }[
      type
    ] || type
  );
}

function chainName(chain: string) {
  return (
    { chain_a: "Ethereum", chain_b: "Optimism", chain_c: "Avalanche" }[
      chain
    ] || chain
  );
}

interface WorkflowTimelineProps {
  steps: WorkflowStepDefinition[];
  results: StepResult[];
  currentStep: number;
}

export function WorkflowTimeline({
  steps,
  results,
  currentStep,
}: WorkflowTimelineProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const result = results[i];
        const isActive = i === currentStep;
        const status = result?.status || (isActive ? "EXECUTING" : "PENDING");
        const isPending = status === "PENDING";

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease }}
            className="flex gap-3"
          >
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-hover">
                {stepIcon(status)}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-px min-h-6 flex-1",
                    result?.status === "COMPLETED"
                      ? "bg-accent/30"
                      : "bg-edge"
                  )}
                />
              )}
            </div>

            <div
              className={cn("flex-1 pb-6 pt-0.5", isPending && "opacity-40")}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {stepLabel(step.type)}
                </span>
                <span className="text-xs text-faint">
                  {chainName(step.chain)}
                  {step.destinationChain &&
                    ` → ${chainName(step.destinationChain)}`}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-faint">
                {step.amount} {step.token}
                {step.destinationToken && ` → ${step.destinationToken}`}
              </p>

              {result && (
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-faint">
                  {result.txHash && (
                    <span className="font-mono">
                      tx:{result.txHash.slice(0, 12)}…
                    </span>
                  )}
                  {result.durationMs != null && (
                    <span>{result.durationMs}ms</span>
                  )}
                  {result.gasUsed && <span>gas:{result.gasUsed}</span>}
                  {result.retryCount > 0 && (
                    <span className="text-amber-400">
                      {result.retryCount} retries
                    </span>
                  )}
                  {result.error && (
                    <span className="text-red-400">{result.error}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
