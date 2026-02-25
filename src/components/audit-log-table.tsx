"use client";

import { Badge } from "@/components/ui/badge";
import type { AuditEntry } from "@/types";

function statusBadgeVariant(
  status: string
): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "success":
      return "default";
    case "failure":
      return "destructive";
    case "pending":
      return "secondary";
    default:
      return "outline";
  }
}

function chainLabel(chain: string): string {
  const labels: Record<string, string> = {
    chain_a: "Ethereum",
    chain_b: "Optimism",
    chain_c: "Avalanche",
  };
  return labels[chain] || chain;
}

interface AuditLogTableProps {
  logs: AuditEntry[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-white/30">
        No audit logs yet. Execute a workflow to generate logs.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] text-xs uppercase tracking-wider text-white/30">
            <th className="pb-3 pr-4 font-medium">Time</th>
            <th className="pb-3 pr-4 font-medium">Workflow</th>
            <th className="pb-3 pr-4 font-medium">Step</th>
            <th className="pb-3 pr-4 font-medium">Action</th>
            <th className="pb-3 pr-4 font-medium">Chain</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 font-medium">Message</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {logs.map((log) => (
            <tr key={log.id} className="text-white/60 hover:bg-white/[0.02]">
              <td className="whitespace-nowrap py-3 pr-4 font-mono text-xs text-white/30">
                {new Date(log.timestamp).toLocaleTimeString()}
              </td>
              <td className="whitespace-nowrap py-3 pr-4 font-mono text-xs">
                {log.workflowId}
              </td>
              <td className="py-3 pr-4 text-xs">
                {log.step >= 0 ? log.step : "—"}
              </td>
              <td className="whitespace-nowrap py-3 pr-4 text-xs">
                {log.action}
              </td>
              <td className="py-3 pr-4">
                <Badge variant="outline" className="text-[10px]">
                  {chainLabel(log.chain)}
                </Badge>
              </td>
              <td className="py-3 pr-4">
                <Badge variant={statusBadgeVariant(log.status)} className="text-[10px]">
                  {log.status}
                </Badge>
              </td>
              <td className="max-w-xs truncate py-3 text-xs text-white/40">
                {log.message || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
