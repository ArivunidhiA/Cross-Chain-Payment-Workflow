"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, ArrowRight } from "lucide-react";
import type { Workflow } from "@/types";

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" | "warning" {
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
  index?: number;
}

export function WorkflowCard({ workflow, index = 0 }: WorkflowCardProps) {
  const progress =
    workflow.totalSteps > 0
      ? (workflow.currentStep / workflow.totalSteps) * 100
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: index * 0.05,
      }}
    >
      <Link href={`/workflows/${workflow.id}`}>
        <Card className="group cursor-pointer p-5 transition-colors hover:bg-white/[0.06]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-white/30">
                  {workflow.id}
                </span>
                <Badge variant={statusVariant(workflow.status)}>
                  {workflow.status}
                </Badge>
              </div>
              <h3 className="truncate font-[family-name:var(--font-heading)] text-sm font-semibold text-white/90">
                {workflow.name}
              </h3>
              <p className="text-xs text-white/40">{workflow.description}</p>
            </div>
            <ArrowRight
              size={16}
              className="mt-1 shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/40"
            />
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>
                Step {Math.min(workflow.currentStep, workflow.totalSteps)} of{" "}
                {workflow.totalSteps}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {new Date(workflow.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  workflow.status === "COMPLETED"
                    ? "bg-green-500"
                    : workflow.status === "FAILED" ||
                        workflow.status === "WITHDRAWN"
                      ? "bg-red-500"
                      : "bg-green-500/60"
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
