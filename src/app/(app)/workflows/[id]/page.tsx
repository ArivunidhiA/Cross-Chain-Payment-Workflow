"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageWrapper } from "@/components/page-wrapper";
import { WorkflowTimeline } from "@/components/workflow-timeline";
import { AuditLogTable } from "@/components/audit-log-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion";
import { ArrowLeft, Play, Loader2 } from "lucide-react";
import type { Workflow, AuditEntry } from "@/types";

function statusVariant(status: string) {
  switch (status) {
    case "COMPLETED":
      return "default" as const;
    case "FAILED":
    case "WITHDRAWN":
      return "destructive" as const;
    case "EXECUTING":
    case "RECOVERING":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [executing, setExecuting] = useState(false);

  const fetchDetail = useCallback(async () => {
    const res = await fetch(`/api/workflows/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setWorkflow(data.workflow);
    setLogs(data.auditLogs || []);
  }, [id]);

  useEffect(() => {
    fetchDetail();
    let interval: ReturnType<typeof setInterval> | null = null;

    function start() { if (!interval) interval = setInterval(fetchDetail, 2000); }
    function stop() { if (interval) { clearInterval(interval); interval = null; } }
    function onVisibility() { document.hidden ? stop() : (fetchDetail(), start()); }

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [fetchDetail]);

  async function execute() {
    setExecuting(true);
    try {
      await fetch(`/api/workflows/${id}/execute`, { method: "POST" });
    } finally {
      setExecuting(false);
    }
  }

  if (!workflow) {
    return (
      <PageWrapper>
        <div className="flex h-64 items-center justify-center text-sm text-faint">
          Loading…
        </div>
      </PageWrapper>
    );
  }

  const isRunning =
    workflow.status === "EXECUTING" || workflow.status === "RECOVERING";
  const isTerminal =
    workflow.status === "COMPLETED" || workflow.status === "WITHDRAWN";

  return (
    <PageWrapper>
      <div className="space-y-8">
        <div className="flex items-start gap-4">
          <Link href="/workflows">
            <Button variant="ghost" size="icon" className="mt-1">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                {workflow.name}
              </h1>
              <Badge variant={statusVariant(workflow.status)}>
                {workflow.status}
              </Badge>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-sm text-faint">
              <span className="font-mono text-xs">{workflow.id}</span>
              <span>·</span>
              <span>
                {new Date(workflow.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
          {!isTerminal && !isRunning && (
            <Button onClick={execute} disabled={executing}>
              <Play size={14} />
              Execute
            </Button>
          )}
          {isRunning && (
            <Button variant="ghost" disabled>
              <Loader2 size={14} className="animate-spin" />
              Running
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <div className="rounded-xl border border-edge bg-surface p-6">
              <h2 className="font-heading text-base font-medium">
                Step Progress
              </h2>
              <div className="mt-5">
                <WorkflowTimeline
                  steps={workflow.definition.steps}
                  results={workflow.stepResults}
                  currentStep={workflow.currentStep}
                />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-3">
            <div className="rounded-xl border border-edge bg-surface p-6">
              <h2 className="font-heading text-base font-medium">
                Audit Trail
              </h2>
              <div className="mt-5">
                <AuditLogTable logs={logs} />
              </div>
            </div>
          </Reveal>
        </div>

        {workflow.error && (
          <Reveal>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
              <p className="text-sm font-medium text-red-400">Error</p>
              <p className="mt-1 text-sm text-red-400/70">{workflow.error}</p>
            </div>
          </Reveal>
        )}
      </div>
    </PageWrapper>
  );
}
