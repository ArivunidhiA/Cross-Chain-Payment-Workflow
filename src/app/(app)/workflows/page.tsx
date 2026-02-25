"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { PageWrapper } from "@/components/page-wrapper";
import { WorkflowCard } from "@/components/workflow-card";
import { ScrollTabs } from "@/components/ui/scroll-tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const ease: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];
import type { Workflow } from "@/types";

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "CREATED", label: "Created" },
  { value: "EXECUTING", label: "Executing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "RECOVERING", label: "Recovering" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

const TEMPLATE_OPTIONS = [
  { id: "cross_chain_swap", name: "Cross-Chain Swap" },
  { id: "multi_hop", name: "Multi-Hop Transfer" },
  { id: "failure_scenario", name: "Failure Recovery Test" },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [filter, setFilter] = useState("ALL");
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
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Workflows
            </h1>
            <p className="mt-2 text-muted">
              Manage and monitor payment workflow executions
            </p>
          </div>
          <div className="relative" ref={menuRef}>
            <Button onClick={() => setMenuOpen((v) => !v)} disabled={creating}>
              <Plus size={14} />
              New
            </Button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-edge bg-surface p-1 shadow-2xl">
                {TEMPLATE_OPTIONS.map((t) => (
                  <button
                    key={t.id}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-muted transition-colors duration-150 hover:bg-surface-hover hover:text-foreground"
                    onClick={() => createAndExecute(t.id)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <ScrollTabs
          id="wf-status"
          items={STATUS_TABS}
          active={filter}
          onChange={setFilter}
        />

        {workflows.length === 0 ? (
          <p className="py-16 text-center text-sm text-faint">
            No workflows found.
          </p>
        ) : (
          <div className="space-y-3">
            {workflows.map((wf, i) => (
              <motion.div
                key={wf.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04, ease }}
              >
                <WorkflowCard workflow={wf} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
