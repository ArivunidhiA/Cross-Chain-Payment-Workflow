"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { WorkflowCard } from "@/components/workflow-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import type { Workflow, WorkflowStatus } from "@/types";

const STATUS_OPTIONS: (WorkflowStatus | "ALL")[] = [
  "ALL",
  "CREATED",
  "PENDING",
  "EXECUTING",
  "COMPLETED",
  "FAILED",
  "RECOVERING",
  "WITHDRAWAL_PENDING",
  "WITHDRAWN",
];

const TEMPLATE_OPTIONS = [
  { id: "cross_chain_swap", name: "Cross-Chain Swap" },
  { id: "multi_hop", name: "Multi-Hop Transfer" },
  { id: "failure_scenario", name: "Failure Recovery Test" },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchWorkflows = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("status", filter);
    const res = await fetch(`/api/workflows?${params}`);
    const data = await res.json();
    setWorkflows(data.workflows || []);
  }, [filter]);

  useEffect(() => {
    fetchWorkflows();
    const interval = setInterval(fetchWorkflows, 3000);
    return () => clearInterval(interval);
  }, [fetchWorkflows]);

  async function createAndExecute(templateId: string) {
    setCreating(true);
    setMenuOpen(false);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const { workflow } = await res.json();
      await fetch(`/api/workflows/${workflow.id}/execute`, { method: "POST" });
      await fetchWorkflows();
    } finally {
      setCreating(false);
    }
  }

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-white/90">
              Workflows
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Manage and monitor payment workflow executions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-40"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-[#07070c]">
                  {s === "ALL" ? "All Statuses" : s}
                </option>
              ))}
            </Select>
            <div className="relative" ref={menuRef}>
              <Button
                onClick={() => setMenuOpen((v) => !v)}
                disabled={creating}
              >
                <Plus size={16} />
                New Workflow
              </Button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-white/[0.08] bg-[#0e0e14] p-1 shadow-xl">
                  {TEMPLATE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/[0.06]"
                      onClick={() => createAndExecute(t.id)}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {workflows.length === 0 ? (
          <Card className="p-12 text-center text-sm text-white/30">
            No workflows found. Create one to get started.
          </Card>
        ) : (
          <div className="space-y-3">
            {workflows.map((wf, i) => (
              <WorkflowCard key={wf.id} workflow={wf} index={i} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
