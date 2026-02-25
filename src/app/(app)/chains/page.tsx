"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageWrapper } from "@/components/page-wrapper";
import { ChainStatusCard } from "@/components/chain-status-card";
import { Reveal } from "@/components/motion";
import type { ChainConfig } from "@/types";

const ease: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

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
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Chain Status
          </h1>
          <p className="mt-2 text-muted">
            Simulated blockchain network configurations and health
          </p>
        </div>

        {chains.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
        )}

        <Reveal>
          <div className="rounded-xl border border-edge bg-surface p-6">
            <h2 className="font-heading text-base font-medium">
              About Simulated Chains
            </h2>
            <div className="mt-5 space-y-5 text-sm text-muted">
              <div>
                <h3 className="font-medium text-foreground">
                  Chain A — Ethereum Mainnet
                </h3>
                <p className="mt-1 leading-relaxed">
                  Slow confirmations (~12s) with higher gas fees. High
                  reliability (95%). Serves as the primary onramp chain and
                  source of truth.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  Chain B — Optimism L2
                </h3>
                <p className="mt-1 leading-relaxed">
                  Fast confirmations (~2s) with very low fees. Good reliability
                  (90%) but occasional reorgs. Primary target for swaps.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-foreground">
                  Chain C — Avalanche
                </h3>
                <p className="mt-1 leading-relaxed">
                  Medium speed with intermittent RPC failures. Lower reliability
                  (80%). Used to test recovery and withdrawal paths.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </PageWrapper>
  );
}
