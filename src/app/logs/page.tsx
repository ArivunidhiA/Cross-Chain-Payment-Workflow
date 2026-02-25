"use client";

import { useEffect, useState, useCallback } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { AuditLogTable } from "@/components/audit-log-table";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditEntry } from "@/types";

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [chainFilter, setChainFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [workflowFilter, setWorkflowFilter] = useState<string>("");

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
      <div className="space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-white/90">
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Complete transaction trail for all workflow executions
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Filter by workflow ID..."
            value={workflowFilter}
            onChange={(e) => setWorkflowFilter(e.target.value)}
            className="w-56"
          />
          <Select
            value={chainFilter}
            onChange={(e) => setChainFilter(e.target.value)}
            className="w-36"
          >
            <option value="ALL" className="bg-[#07070c]">All Chains</option>
            <option value="chain_a" className="bg-[#07070c]">Ethereum</option>
            <option value="chain_b" className="bg-[#07070c]">Optimism</option>
            <option value="chain_c" className="bg-[#07070c]">Avalanche</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-36"
          >
            <option value="ALL" className="bg-[#07070c]">All Statuses</option>
            <option value="success" className="bg-[#07070c]">Success</option>
            <option value="failure" className="bg-[#07070c]">Failure</option>
            <option value="pending" className="bg-[#07070c]">Pending</option>
            <option value="info" className="bg-[#07070c]">Info</option>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Logs{" "}
              <span className="text-sm font-normal text-white/30">
                ({logs.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AuditLogTable logs={logs} />
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
