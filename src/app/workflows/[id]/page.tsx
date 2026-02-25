"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageWrapper } from "@/components/page-wrapper";
import { WorkflowTimeline } from "@/components/workflow-timeline";
import { AuditLogTable } from "@/components/audit-log-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, RefreshCw } from "lucide-react";
import type { Workflow, AuditEntry } from "@/types";

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
    const interval = setInterval(fetchDetail, 2000);
    return () => clearInterval(interval);
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
        <div className="flex h-64 items-center justify-center text-sm text-white/30">
          Loading workflow...
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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/workflows">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold text-white/90">
                {workflow.name}
              </h1>
              <Badge variant={statusVariant(workflow.status)}>
                {workflow.status}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-white/40">
              <span className="font-mono">{workflow.id}</span>
              {" · "}
              Created {new Date(workflow.createdAt).toLocaleString()}
            </p>
          </div>
          {!isTerminal && !isRunning && (
            <Button onClick={execute} disabled={executing}>
              <Play size={14} />
              Execute
            </Button>
          )}
          {isRunning && (
            <Button variant="ghost" disabled>
              <RefreshCw size={14} className="animate-spin" />
              Running...
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Step Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkflowTimeline
                  steps={workflow.definition.steps}
                  results={workflow.stepResults}
                  currentStep={workflow.currentStep}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
              </CardHeader>
              <CardContent>
                <AuditLogTable logs={logs} />
              </CardContent>
            </Card>
          </div>
        </div>

        {workflow.error && (
          <Card className="border-red-500/20 bg-red-500/[0.04]">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-red-400">Error</p>
              <p className="mt-1 text-sm text-red-400/70">{workflow.error}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
