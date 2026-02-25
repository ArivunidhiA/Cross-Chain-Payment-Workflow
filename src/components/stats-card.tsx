"use client";

import { AnimatedNumber } from "@/components/animated-number";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: number;
  suffix?: string;
  format?: (n: number) => string;
  accent?: boolean;
}

export function StatsCard({
  label,
  value,
  suffix,
  format,
  accent,
}: StatsCardProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-faint">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-heading text-2xl font-semibold tabular-nums",
          accent ? "text-accent" : "text-foreground"
        )}
        style={{ textShadow: "0 0 12px rgba(255, 255, 255, 0.4), 0 0 40px rgba(255, 255, 255, 0.18)" }}
      >
        <AnimatedNumber value={value} format={format} />
        {suffix && (
          <span className="ml-0.5 text-base text-muted">{suffix}</span>
        )}
      </p>
    </div>
  );
}
