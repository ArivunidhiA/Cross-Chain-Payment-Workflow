"use client";

import { AppNavigation } from "@/components/app-navigation";
import { Component } from "@/components/ui/etheral-shadow";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Component
        color="rgba(128, 128, 128, 1)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 1, scale: 1.2 }}
        sizing="fill"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: -10,
          filter: "brightness(0.5)",
        }}
      />
      <main className="relative mx-auto min-h-screen max-w-6xl px-6 pb-28 pt-8">
        {children}
      </main>
      <AppNavigation />
    </>
  );
}
