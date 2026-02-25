"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: StatsCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-white/40">{title}</p>
          <p
            className={cn(
              "text-2xl font-semibold font-[family-name:var(--font-heading)]",
              trend === "up" && "text-green-400",
              trend === "down" && "text-red-400",
              !trend && "text-white/90"
            )}
          >
            {value}
          </p>
          {subtitle && <p className="text-xs text-white/30">{subtitle}</p>}
        </div>
        <div className="rounded-xl bg-white/[0.04] p-2.5">
          <Icon size={18} className="text-white/30" />
        </div>
      </div>
    </Card>
  );
}
