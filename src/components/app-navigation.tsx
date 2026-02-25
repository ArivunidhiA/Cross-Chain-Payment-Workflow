"use client";

import { useRouter } from "next/navigation";
import { ExpandableTabs } from "@/components/ui/expandable-tabs";
import {
  LayoutDashboard,
  GitBranch,
  ScrollText,
  Link as LinkIcon,
} from "lucide-react";

const tabs = [
  { title: "Dashboard", icon: LayoutDashboard },
  { title: "Workflows", icon: GitBranch },
  { type: "separator" as const },
  { title: "Audit Logs", icon: ScrollText },
  { title: "Chains", icon: LinkIcon },
];

const routes = ["/dashboard", "/workflows", null, "/logs", "/chains"];

export function AppNavigation() {
  const router = useRouter();

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <ExpandableTabs
        tabs={tabs}
        activeColor="text-accent"
        onChange={(index) => {
          if (index !== null && routes[index]) {
            router.push(routes[index]!);
          }
        }}
      />
    </div>
  );
}
