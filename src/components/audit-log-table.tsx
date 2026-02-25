"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { AuditEntry } from "@/types";

function statusVariant(status: string) {
  switch (status) {
    case "success":
      return "default" as const;
    case "failure":
      return "destructive" as const;
    case "pending":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

function chainName(chain: string) {
  return (
    { chain_a: "ETH", chain_b: "OP", chain_c: "AVAX" }[chain] || chain
  );
}

interface AuditLogTableProps {
  logs: AuditEntry[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-faint">
        No audit logs yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-edge text-xs font-medium uppercase tracking-wider text-faint">
            <th className="pb-3 pr-4">Time</th>
            <th className="pb-3 pr-4">Workflow</th>
            <th className="pb-3 pr-4">Step</th>
            <th className="pb-3 pr-4">Action</th>
            <th className="pb-3 pr-4">Chain</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3">Message</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, i) => (
            <motion.tr
              key={log.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: Math.min(i * 0.02, 0.5),
              }}
              className="border-b border-edge/50 text-muted transition-colors duration-150 hover:bg-surface"
            >
              <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-xs text-faint">
                {new Date(log.timestamp).toLocaleTimeString()}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-xs">
                {log.workflowId.slice(0, 8)}
              </td>
              <td className="py-2.5 pr-4 font-mono text-xs">
                {log.step >= 0 ? log.step : "—"}
              </td>
              <td className="whitespace-nowrap py-2.5 pr-4 text-xs">
                {log.action}
              </td>
              <td className="py-2.5 pr-4 font-mono text-xs text-faint">
                {chainName(log.chain)}
              </td>
              <td className="py-2.5 pr-4">
                <Badge
                  variant={statusVariant(log.status)}
                  className="text-[10px]"
                >
                  {log.status}
                </Badge>
              </td>
              <td className="max-w-[200px] truncate py-2.5 text-xs text-faint">
                {log.message || "—"}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
