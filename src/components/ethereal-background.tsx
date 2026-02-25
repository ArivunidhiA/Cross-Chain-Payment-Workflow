"use client";

import { Component } from "@/components/ui/etheral-shadow";

interface EtherealBackgroundProps {
  fixed?: boolean;
}

export function EtherealBackground({ fixed = false }: EtherealBackgroundProps) {
  return (
    <div
      style={{
        position: fixed ? "fixed" : "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        zIndex: fixed ? -10 : undefined,
        filter: "brightness(0.5)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "50vw",
          height: "50vh",
          transform: "scale(2)",
          transformOrigin: "top left",
        }}
      >
        <Component
          color="rgba(128, 128, 128, 1)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 1, scale: 1.2 }}
          sizing="fill"
        />
      </div>
    </div>
  );
}
