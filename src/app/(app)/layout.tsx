"use client";

import { AppNavigation } from "@/components/app-navigation";
import { EtherealBackground } from "@/components/ethereal-background";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <EtherealBackground fixed />
      <main className="relative mx-auto min-h-screen max-w-6xl px-6 pb-28 pt-8">
        {children}
      </main>
      <AppNavigation />
    </>
  );
}
