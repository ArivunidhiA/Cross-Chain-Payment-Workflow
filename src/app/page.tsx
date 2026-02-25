"use client";

import { useEffect, useState, useCallback } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { StatsCard } from "@/components/stats-card";
import { WorkflowCard } from "@/components/workflow-card";
import { ChainStatusCard } from "@/components/chain-status-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GitBranch,
  CheckCircle2,
  Activity,
  Timer,
  Rocket,
} from "lucide-react";
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
    desc: "Bridge A→C → Swap → Transfer",
  },
  {
    id: "failure_scenario",
    name: "Failure Test",
    desc: "High-failure route for recovery testing",
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
      fetch("/api/workflows?limit=10"),
      fetch("/api/chains"),
    ]);
    const statsData = await statsRes.json();
    const wfData = await wfRes.json();
    const chainsData = await chainsRes.json();
    setStats(statsData);
    setWorkflows(wfData.workflows || []);
    setChains(chainsData.chains || []);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function launchWorkflow(templateId: string) {
    setLaunching(templateId);
    try {
      const createRes = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const { workflow } = await createRes.json();

      await fetch(`/api/workflows/${workflow.id}/execute`, {
        method: "POST",
      });

      await fetchData();
    } finally {
      setLaunching(null);
    }
  }

  return (
    <PageWrapper>
      <div className="space-y-8">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-white/90">
            Workflow Orchestrator
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Cross-chain payment workflow engine with failure recovery
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Workflows"
            value={stats?.total ?? "—"}
            icon={GitBranch}
          />
          <StatsCard
            title="Success Rate"
            value={stats ? `${stats.successRate}%` : "—"}
            icon={CheckCircle2}
            trend={
              stats
                ? stats.successRate >= 70
                  ? "up"
                  : "down"
                : undefined
            }
          />
          <StatsCard
            title="Active"
            value={stats?.active ?? "—"}
            icon={Activity}
          />
          <StatsCard
            title="Avg Duration"
            value={
              stats?.avgDurationMs
                ? `${(stats.avgDurationMs / 1000).toFixed(1)}s`
                : "—"
            }
            icon={Timer}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Launch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {TEMPLATES.map((t) => (
                <Button
                  key={t.id}
                  variant="ghost"
                  className="h-auto flex-col items-start gap-1 p-4 text-left"
                  onClick={() => launchWorkflow(t.id)}
                  disabled={launching !== null}
                >
                  <div className="flex w-full items-center gap-2">
                    <Rocket size={14} className="text-green-500" />
                    <span className="text-sm font-medium text-white/80">
                      {t.name}
                    </span>
                  </div>
                  <span className="text-xs text-white/30">{t.desc}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="mb-4 font-[family-name:var(--font-heading)] text-lg font-semibold text-white/80">
              Recent Workflows
            </h2>
            {workflows.length === 0 ? (
              <Card className="p-8 text-center text-sm text-white/30">
                No workflows yet. Launch one above to get started.
              </Card>
            ) : (
              <div className="space-y-3">
                {workflows.map((wf, i) => (
                  <WorkflowCard key={wf.id} workflow={wf} index={i} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-4 font-[family-name:var(--font-heading)] text-lg font-semibold text-white/80">
              Chain Status
            </h2>
            <div className="space-y-3">
              {chains.map((chain) => (
                <ChainStatusCard key={chain.id} chain={chain} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
