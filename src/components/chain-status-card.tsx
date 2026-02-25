"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ChainConfig } from "@/types";

interface ChainStatusCardProps {
  chain: ChainConfig;
}

export function ChainStatusCard({ chain }: ChainStatusCardProps) {
  const pct = Math.round(chain.reliability * 100);

  return (
    <motion.div
      className="spotlight flex h-full flex-col rounded-xl border border-edge bg-surface p-5 transition-colors duration-200 hover:border-edge-hover"
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
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
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-heading text-sm font-semibold text-foreground">
              {chain.name}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted">{chain.description}</p>
          </div>
          <span className="shrink-0 rounded-md bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-faint">
            {chain.type}
          </span>
        </div>

        <div className="mt-auto pt-4 grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
              Confirm
            </p>
            <p className="mt-0.5 font-mono text-sm text-foreground">
              ~{(chain.avgConfirmationMs / 1000).toFixed(0)}s
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
              Base Fee
            </p>
            <p className="mt-0.5 font-mono text-sm text-foreground">
              {chain.baseFee}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
              Uptime
            </p>
            <p
              className={cn(
                "mt-0.5 font-mono text-sm",
                pct >= 90
                  ? "text-accent"
                  : pct >= 80
                    ? "text-amber-400"
                    : "text-red-400"
              )}
            >
              {pct}%
            </p>
          </div>
        </div>

        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-edge">
          <motion.div
            className={cn(
              "h-full rounded-full",
              pct >= 90
                ? "bg-accent"
                : pct >= 80
                  ? "bg-amber-500"
                  : "bg-red-500"
            )}
            initial={{ width: 0 }}
            whileInView={{ width: `${pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.21, 0.47, 0.32, 0.98] }}
          />
        </div>
      </div>
    </motion.div>
  );
}
