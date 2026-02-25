"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Component } from "@/components/ui/etheral-shadow";
import { Github, Linkedin, Globe, Twitter, ArrowRight } from "lucide-react";

const ease: [number, number, number, number] = [0.21, 0.47, 0.32, 0.98];

const socials = [
  {
    icon: Github,
    href: "https://github.com/ArivunidhiA",
    label: "GitHub",
  },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/in/arivunidhi-anna-arivan/",
    label: "LinkedIn",
  },
  {
    icon: Globe,
    href: "https://arivfolio.tech/",
    label: "Portfolio",
  },
  {
    icon: Twitter,
    href: "https://x.com/Ariv_2012",
    label: "X",
  },
];

export default function LandingPage() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ filter: "brightness(0.5)" }}
      >
        <Component
          className="ethereal-shadow-bg"
          color="rgba(128, 128, 128, 1)"
          animation={{ scale: 100, speed: 90 }}
          noise={{ opacity: 1, scale: 1.2 }}
          sizing="fill"
        />
      </div>

      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-8 text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="font-heading text-5xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
          >
            Orchestrator
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease }}
            className="max-w-md text-base text-muted sm:text-lg"
          >
            Cross-chain payment workflows with failure recovery across
            blockchain networks
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease }}
            className="flex items-center gap-5"
          >
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-faint transition-colors duration-200 hover:text-foreground"
              >
                <s.icon size={20} />
              </a>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.36, ease }}
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg border border-edge px-5 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:border-edge-hover hover:bg-surface active:scale-[0.98]"
            >
              Enter Dashboard
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6, ease }}
        className="absolute bottom-6 left-0 right-0 z-10 text-center text-[11px] text-faint"
      >
        Note: this is a demo to illustrate what happens under the hood
      </motion.p>
    </div>
  );
}
