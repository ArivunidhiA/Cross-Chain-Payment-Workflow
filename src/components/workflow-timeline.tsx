"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  RotateCw,
} from "lucide-react";
import type { StepResult, WorkflowStepDefinition } from "@/types";

function stepIcon(status: string) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 size={18} className="text-green-400" />;
    case "FAILED":
      return <XCircle size={18} className="text-red-400" />;
    case "EXECUTING":
      return <Loader2 size={18} className="animate-spin text-yellow-400" />;
    case "RECOVERING":
      return <RotateCw size={18} className="animate-spin text-yellow-400" />;
    default:
      return <Circle size={18} className="text-white/20" />;
  }
}

function stepTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    onramp: "Onramp",
    bridge: "Bridge",
    swap: "Swap",
    transfer: "Transfer",
  };
  return labels[type] || type;
}

function chainLabel(chain: string): string {
  const labels: Record<string, string> = {
    chain_a: "Ethereum",
    chain_b: "Optimism",
    chain_c: "Avalanche",
  };
  return labels[chain] || chain;
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

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: i * 0.08,
            }}
            className="flex gap-4"
          >
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                {stepIcon(status)}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-px flex-1",
                    result?.status === "COMPLETED"
                      ? "bg-green-500/40"
                      : "bg-white/[0.08]"
                  )}
                  style={{ minHeight: "2rem" }}
                />
              )}
            </div>

            <div
              className={cn(
                "flex-1 rounded-xl pb-6 pt-1",
                isActive && "opacity-100",
                !isActive && status === "PENDING" && "opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white/90">
                  {stepTypeLabel(step.type)}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {chainLabel(step.chain)}
                </Badge>
                {step.destinationChain && (
                  <>
                    <span className="text-white/20">→</span>
                    <Badge variant="outline" className="text-[10px]">
                      {chainLabel(step.destinationChain)}
                    </Badge>
                  </>
                )}
              </div>

              <p className="mt-1 text-xs text-white/40">
                {step.amount} {step.token}
                {step.destinationToken && ` → ${step.destinationToken}`}
              </p>

              {result && (
                <div className="mt-2 space-y-1">
                  {result.txHash && (
                    <p className="font-mono text-[10px] text-white/25">
                      tx: {result.txHash.slice(0, 18)}...
                    </p>
                  )}
                  <div className="flex gap-3 text-[10px] text-white/30">
                    {result.durationMs != null && (
                      <span>{result.durationMs}ms</span>
                    )}
                    {result.gasUsed && <span>gas: {result.gasUsed}</span>}
                    {result.retryCount > 0 && (
                      <span className="text-yellow-400/70">
                        {result.retryCount} retries
                      </span>
                    )}
                  </div>
                  {result.error && (
                    <p className="text-[10px] text-red-400/70">
                      {result.error}
                    </p>
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
