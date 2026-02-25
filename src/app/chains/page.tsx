"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/page-wrapper";
import { ChainStatusCard } from "@/components/chain-status-card";
import type { ChainConfig } from "@/types";

export default function ChainsPage() {
  const [chains, setChains] = useState<ChainConfig[]>([]);

  useEffect(() => {
    async function fetchChains() {
      const res = await fetch("/api/chains");
      const data = await res.json();
      setChains(data.chains || []);
    }
    fetchChains();
  }, []);

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-white/90">
            Chain Status
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Simulated blockchain network configurations and health
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {chains.map((chain) => (
            <ChainStatusCard key={chain.id} chain={chain} />
          ))}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-white/80">
            About Simulated Chains
          </h2>
          <div className="mt-4 space-y-4 text-sm text-white/50">
            <div>
              <h3 className="font-medium text-white/70">
                Chain A — Ethereum Mainnet (Sim)
              </h3>
              <p className="mt-1">
                Slow confirmations (~12s) with higher gas fees. High reliability
                (95%). Serves as the primary onramp chain and source of truth.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white/70">
                Chain B — Optimism L2 (Sim)
              </h3>
              <p className="mt-1">
                Fast confirmations (~2s) with very low fees. Good reliability
                (90%) but occasional reorgs. Primary target for swaps.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white/70">
                Chain C — Avalanche (Sim)
              </h3>
              <p className="mt-1">
                Medium speed with intermittent RPC failures. Lower reliability
                (80%). Used to test recovery and withdrawal paths.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
