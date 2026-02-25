"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import type { Workflow } from "@/types";

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "warning" {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "FAILED":
    case "WITHDRAWN":
      return "destructive";
    case "EXECUTING":
    case "RECOVERING":
      return "warning";
    default:
      return "secondary";
  }
}

interface WorkflowCardProps {
  workflow: Workflow;
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const progress =
    workflow.totalSteps > 0
      ? (workflow.currentStep / workflow.totalSteps) * 100
      : 0;

  return (
    <Link href={`/workflows/${workflow.id}`}>
      <motion.div
        className="spotlight group rounded-xl border border-edge bg-surface p-5 transition-colors duration-200 hover:border-edge-hover"
        whileHover={{ y: -4, scale: 1.015 }}
        transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          e.currentTarget.style.setProperty(
            "--spotlight-x",
            `${e.clientX - rect.left}px`
          );
          e.currentTarget.style.setProperty(
            "--spotlight-y",
            `${e.clientY - rect.top}px`
          );
        }}
      >
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <h3 className="font-heading text-sm font-semibold text-foreground">
                {workflow.name}
              </h3>
              <Badge variant={statusVariant(workflow.status)}>
                {workflow.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{workflow.description}</p>
            <div className="mt-2 flex items-center gap-3 text-xs text-faint">
              <span className="font-mono">{workflow.id.slice(0, 8)}</span>
              <span>·</span>
              <span>
                Step {Math.min(workflow.currentStep, workflow.totalSteps)}/
                {workflow.totalSteps}
              </span>
              <span>·</span>
              <span>
                {new Date(workflow.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <ArrowUpRight
            size={16}
            className="mt-0.5 shrink-0 text-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-muted"
          />
        </div>

        <div className="relative z-10 mt-4">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-edge">
            <motion.div
              className={cn(
                "h-full rounded-full",
                workflow.status === "COMPLETED"
                  ? "bg-accent"
                  : workflow.status === "FAILED" ||
                      workflow.status === "WITHDRAWN"
                    ? "bg-red-500"
                    : "bg-accent/50"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
            />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
