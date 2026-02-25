"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { PageWrapper } from "@/components/page-wrapper";
import { StatsCard } from "@/components/stats-card";
import { WorkflowCard } from "@/components/workflow-card";
import { ChainStatusCard } from "@/components/chain-status-card";
import { Reveal } from "@/components/motion";
import { Rocket } from "lucide-react";

const ease: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];
import type { Workflow, ChainConfig } from "@/types";

interface Stats {
  total: number;
  completed: number;
  failed: number;
  active: number;
  successRate: number;
  avgDurationMs: number;
}

const TEMPLATES = [
  {
    id: "cross_chain_swap",
    name: "Cross-Chain Swap",
    desc: "Onramp → Bridge → Swap → Transfer",
  },
  {
    id: "multi_hop",
    name: "Multi-Hop",
    desc: "Bridge → Swap → Transfer",
  },
  {
    id: "failure_scenario",
    name: "Failure Test",
    desc: "High-failure recovery route",
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [chains, setChains] = useState<ChainConfig[]>([]);
  const [launching, setLaunching] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [statsRes, wfRes, chainsRes] = await Promise.all([
      fetch("/api/stats"),
      fetch("/api/workflows?limit=6"),
      fetch("/api/chains"),
    ]);
    setStats(await statsRes.json());
    const wfData = await wfRes.json();
    setWorkflows(wfData.workflows || []);
    const chainsData = await chainsRes.json();
    setChains(chainsData.chains || []);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function launch(templateId: string) {
    setLaunching(templateId);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const { workflow } = await res.json();
      await fetch(`/api/workflows/${workflow.id}/execute`, { method: "POST" });
      await fetchData();
    } finally {
      setLaunching(null);
    }
  }

  return (
    <PageWrapper>
      <div className="space-y-12">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Workflow Orchestrator
          </h1>
          <p className="mt-2 text-muted">
            Cross-chain payment orchestration with failure recovery
          </p>
        </div>

        <Reveal>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <StatsCard label="Workflows" value={stats?.total ?? 0} />
            <StatsCard
              label="Success Rate"
              value={stats?.successRate ?? 0}
              suffix="%"
              accent={stats != null && stats.successRate >= 70}
            />
            <StatsCard label="Active" value={stats?.active ?? 0} />
            <StatsCard
              label="Avg Duration"
              value={stats?.avgDurationMs ? stats.avgDurationMs / 1000 : 0}
              suffix="s"
              format={(n) => n.toFixed(1)}
            />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div>
            <h2 className="font-heading text-lg font-medium">Quick Launch</h2>
            <div className="-mx-2 mt-4 flex gap-3 overflow-x-auto px-2 py-2 scrollbar-none">
              {TEMPLATES.map((t) => (
                <motion.button
                  key={t.id}
                  onClick={() => launch(t.id)}
                  disabled={launching !== null}
                  whileHover={{ y: -4, scale: 1.015 }}
                  transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
                  className="spotlight group shrink-0 rounded-xl border border-edge bg-surface p-4 text-left transition-colors duration-200 hover:border-edge-hover disabled:opacity-40"
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
                  <div className="relative z-10">
                    <div className="flex items-center gap-2">
                      <Rocket size={14} className="text-accent" />
                      <span className="text-sm font-medium text-foreground">
                        {t.name}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-faint">{t.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="font-heading text-lg font-medium">
              Recent Workflows
            </h2>
            {workflows.length === 0 ? (
              <p className="mt-6 text-sm text-faint">
                No workflows yet. Launch one above.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
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

          <div>
            <h2 className="font-heading text-lg font-medium">Chain Status</h2>
            <div className="mt-4 space-y-3">
              {chains.map((chain, i) => (
                <motion.div
                  key={chain.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04, ease }}
                >
                  <ChainStatusCard chain={chain} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
