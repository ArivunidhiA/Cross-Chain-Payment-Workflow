"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitBranch,
  ScrollText,
  Link as LinkIcon,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workflows", label: "Workflows", icon: GitBranch },
  { href: "/logs", label: "Audit Logs", icon: ScrollText },
  { href: "/chains", label: "Chains", icon: LinkIcon },
];

export function Navigation() {
  const pathname = usePathname();

  const getActiveIndex = () => {
    if (pathname === "/") return 0;
    return navItems.findIndex(
      (item) => item.href !== "/" && pathname.startsWith(item.href)
    );
  };

  const activeIndex = getActiveIndex();

  return (
    <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1.5 backdrop-blur-xl">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === activeIndex;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                isActive ? "text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl bg-white/[0.08]"
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10">
                <Icon size={16} />
              </span>
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
