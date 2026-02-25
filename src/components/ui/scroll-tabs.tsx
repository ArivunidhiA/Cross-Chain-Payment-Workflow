"use client";

import { motion } from "framer-motion";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ScrollTabsProps<T extends string> {
  id: string;
  items: { value: T; label: string }[];
  active: T;
  onChange: (value: T) => void;
  className?: string;
}

export function ScrollTabs<T extends string>({
  id,
  items,
  active,
  onChange,
  className,
}: ScrollTabsProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current.querySelector<HTMLElement>(
      '[data-active="true"]'
    );
    el?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [active]);

  return (
    <div
      ref={scrollRef}
      className={cn(
        "flex items-center gap-1 overflow-x-auto scrollbar-none",
        className
      )}
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <button
            key={item.value}
            data-active={isActive}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors duration-200",
              isActive ? "text-foreground" : "text-faint hover:text-muted"
            )}
          >
            {item.label}
            {isActive && (
              <motion.div
                layoutId={`tab-${id}`}
                className="absolute inset-0 -z-10 rounded-lg bg-surface"
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
