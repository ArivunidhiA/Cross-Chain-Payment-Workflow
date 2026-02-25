"use client";

import { useEffect, useState } from "react";
import { Component } from "@/components/ui/etheral-shadow";

interface EtherealBackgroundProps {
  fixed?: boolean;
}

const BASE_W = 800;
const BASE_H = 450;

export function EtherealBackground({ fixed = false }: EtherealBackgroundProps) {
  const [scale, setScale] = useState(4);

  useEffect(() => {
    function calc() {
      const sx = window.innerWidth / BASE_W;
      const sy = window.innerHeight / BASE_H;
      setScale(Math.max(sx, sy) * 1.1);
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return (
    <div
      style={{
        position: fixed ? "fixed" : "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: fixed ? -10 : 0,
        filter: "brightness(0.5)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: BASE_W,
          height: BASE_H,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
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
