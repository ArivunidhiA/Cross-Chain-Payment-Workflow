"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChainConfig } from "@/types";

interface ChainStatusCardProps {
  chain: ChainConfig;
}

export function ChainStatusCard({ chain }: ChainStatusCardProps) {
  const reliabilityPct = Math.round(chain.reliability * 100);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-sm font-semibold text-white/90">
            {chain.name}
          </h3>
          <p className="mt-0.5 text-xs text-white/40">{chain.description}</p>
        </div>
        <Badge variant="outline">{chain.type}</Badge>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30">
            Confirm
          </p>
          <p className="mt-0.5 text-sm font-medium text-white/80">
            ~{(chain.avgConfirmationMs / 1000).toFixed(0)}s
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30">
            Base Fee
          </p>
          <p className="mt-0.5 text-sm font-medium text-white/80">
            {chain.baseFee} ETH
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30">
            Reliability
          </p>
          <p
            className={cn(
              "mt-0.5 text-sm font-medium",
              reliabilityPct >= 90
                ? "text-green-400"
                : reliabilityPct >= 80
                  ? "text-yellow-400"
                  : "text-red-400"
            )}
          >
            {reliabilityPct}%
          </p>
        </div>
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn(
            "h-full rounded-full",
            reliabilityPct >= 90
              ? "bg-green-500"
              : reliabilityPct >= 80
                ? "bg-yellow-500"
                : "bg-red-500"
          )}
          style={{ width: `${reliabilityPct}%` }}
        />
      </div>
    </Card>
  );
}
