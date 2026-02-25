"use client";

import { useEffect, useState, useCallback } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { AuditLogTable } from "@/components/audit-log-table";
import { ScrollTabs } from "@/components/ui/scroll-tabs";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/motion";
import type { AuditEntry } from "@/types";

const CHAIN_TABS = [
  { value: "ALL", label: "All Chains" },
  { value: "chain_a", label: "Ethereum" },
  { value: "chain_b", label: "Optimism" },
  { value: "chain_c", label: "Avalanche" },
];

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "success", label: "Success" },
  { value: "failure", label: "Failure" },
  { value: "pending", label: "Pending" },
  { value: "info", label: "Info" },
];

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [chainFilter, setChainFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [workflowFilter, setWorkflowFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    const params = new URLSearchParams();
    if (chainFilter !== "ALL") params.set("chain", chainFilter);
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (workflowFilter) params.set("workflowId", workflowFilter);
    params.set("limit", "200");

    const res = await fetch(`/api/logs?${params}`);
    const data = await res.json();
    setLogs(data.logs || []);
  }, [chainFilter, statusFilter, workflowFilter]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  return (
    <PageWrapper>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Audit Logs
          </h1>
          <p className="mt-2 text-muted">
            Complete transaction trail across all workflow executions
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
            <ScrollTabs
              id="log-chain"
              items={CHAIN_TABS}
              active={chainFilter}
              onChange={setChainFilter}
            />
            <div className="h-4 w-px shrink-0 bg-edge" />
            <ScrollTabs
              id="log-status"
              items={STATUS_TABS}
              active={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
          <Input
            placeholder="Filter by workflow ID…"
            value={workflowFilter}
            onChange={(e) => setWorkflowFilter(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>

        <Reveal>
          <div className="rounded-xl border border-edge bg-surface p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-heading text-base font-medium">Logs</h2>
              <span className="text-xs text-faint">{logs.length} entries</span>
            </div>
            <div className="mt-5">
              <AuditLogTable logs={logs} />
            </div>
          </div>
        </Reveal>
      </div>
    </PageWrapper>
  );
}
