# ⛓️ Cross-Chain Payment Workflow Orchestrator

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?logo=sqlite&logoColor=white)
![Jest](https://img.shields.io/badge/Tests-92%20passing-15c213)
![License](https://img.shields.io/badge/License-MIT-green)

A production-grade TypeScript orchestration engine for **multi-step cross-chain payment workflows** with automatic failure recovery — paired with a real-time dashboard for monitoring, auditing, and execution.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Design Decisions](#-design-decisions)

---

## 🔍 Overview

Cross-chain payments fail. Networks timeout, gas spikes, bridges stall, liquidity dries up — and real money is stuck mid-flight. This engine answers the core question: **"What happens when step 2 of a 4-step cross-chain payment fails?"**

**Key highlights:**
- Sequential step execution with **state machine–enforced transitions**
- **Transient vs permanent** failure classification with exponential backoff retry (max 3)
- **Withdrawal path** that reverses completed steps when recovery fails
- **Immutable audit trail** for every action, every state change, every retry
- **SQLite persistence** — crash at any point, resume from exactly where you left off
- **Live dashboard** with real-time polling, glassmorphism UI, and workflow visualization

---

## ✨ Features

| Category | Features |
|----------|----------|
| **Orchestration** | Sequential multi-step execution, idempotent operations, resume from any checkpoint |
| **Recovery** | Transient retry with exponential backoff, permanent failure detection, automated withdrawal |
| **Chains** | 3 simulated blockchains (L1, L2, Alt-L1) with realistic timing, fees, and failure modes |
| **Steps** | Onramp (fiat→token), Bridge (burn-and-mint), Swap (DEX sim), Transfer |
| **Persistence** | SQLite with WAL mode, structured audit logs, workflow state snapshots |
| **Dashboard** | Real-time monitoring, workflow timeline, audit log viewer, chain status, quick-launch |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│               Workflow Orchestrator               │
│                                                   │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ Workflow   │  │  State    │  │    Step      │ │
│  │ Engine     │──│  Machine  │──│  Executors   │ │
│  └───────────┘  └───────────┘  └──────────────┘ │
│       │               │              │           │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ Recovery   │  │  Audit    │  │   Chain      │ │
│  │ Manager    │  │  Logger   │  │   Adapters   │ │
│  └───────────┘  └───────────┘  └──────────────┘ │
└──────────────────────────────────────────────────┘
        │                              │
   ┌────┴─────┐                  ┌─────┴─────┐
   │  SQLite  │                  │ Simulated  │
   │  (State  │                  │  Chains    │
   │  Store)  │                  │  (A/B/C)   │
   └──────────┘                  └───────────┘
```

| Component | Path | Purpose |
|-----------|------|---------|
| Workflow Engine | `src/engine/workflow-engine.ts` | Orchestration loop — executes steps, manages state, delegates failures |
| State Machine | `src/engine/state-machine.ts` | Enforces valid transitions: `CREATED→PENDING→EXECUTING→COMPLETED` |
| Recovery Manager | `src/engine/recovery-manager.ts` | Classifies failures, retries with backoff, triggers withdrawal path |
| Chain Adapters | `src/chains/chain-adapters.ts` | 3 simulated chains with configurable timing, fees, and failure rates |
| Step Executors | `src/steps/step-executors.ts` | Onramp, Bridge, Swap, Transfer — validate → execute → verify |
| Audit Logger | `src/logging/audit-logger.ts` | Immutable structured log entry for every action |
| SQLite Store | `src/db/store.ts` | Persistent state — workflows, step results, audit trail |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js + TypeScript 5 |
| **Framework** | Next.js 16 (App Router) |
| **Database** | SQLite via `better-sqlite3` (WAL mode) |
| **Frontend** | React 19, Tailwind CSS v4, Framer Motion |
| **Design** | Glassmorphism ("Dark Glass"), `class-variance-authority` |
| **Testing** | Jest + ts-jest (92 tests across 7 suites) |
| **Icons** | Lucide React |

---

## 🚀 Quick Start

**Prerequisites:** Node.js 18+ and npm

```bash
# Clone
git clone https://github.com/ArivunidhiA/Cross-Chain-Payment-Workflow.git
cd Cross-Chain-Payment-Workflow

# Install
npm install

# Run
npm run dev
```

Open **http://localhost:3000** → hit a **Quick Launch** button → watch the workflow execute step-by-step in real time.

### 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm test` | Run all 92 tests |

---

## 📡 API Reference

### Workflows

```
GET  /api/workflows              List all workflows (+ available templates)
POST /api/workflows              Create workflow from template or definition
GET  /api/workflows/:id          Get workflow detail + audit logs
POST /api/workflows/:id/execute  Trigger async execution (fire-and-forget)
```

**Create from template:**
```json
POST /api/workflows
{ "templateId": "cross_chain_swap" }
```

**Templates:** `cross_chain_swap` | `multi_hop` | `failure_scenario`

### Logs & Status

```
GET /api/logs?chain=chain_a&status=failure   Filtered audit logs
GET /api/chains                               Chain configurations
GET /api/stats                                Aggregate workflow stats
```

---

## 🧪 Testing

```bash
npm test
```

| Suite | Tests | Coverage |
|-------|-------|----------|
| `state-machine.test.ts` | 25 | Transitions, terminal states, full lifecycles |
| `store.test.ts` | 18 | CRUD, filtering, stats, audit log operations |
| `chain-adapters.test.ts` | 14 | Configs, instantiation, transactions, gas estimates |
| `step-executors.test.ts` | 12 | All 4 executor types, defaults, error handling |
| `audit-logger.test.ts` | 12 | Logging, retrieval, filtering, limits |
| `workflow-engine.test.ts` | 6 | Creation, execution, idempotency, concurrency |
| `recovery-manager.test.ts` | 5 | Transient retry, permanent detection, withdrawal |

---

## 🌐 Deployment

**Vercel (recommended):**
```bash
npm run build   # verify locally
vercel deploy
```

**Docker / self-hosted:** Runs anywhere Node.js 18+ is available. SQLite is zero-config — no external database needed. The `workflow.db` file is created automatically in the project root on first request.

---

## 🧠 Design Decisions

**State machine over saga pattern.** Explicit, auditable transitions. Every state change is validated against an allow-list, making invalid states unreachable. For a payment system, correctness wins over flexibility.

**SQLite for persistence.** Zero infrastructure, single-file database. WAL mode provides concurrent read performance. Eliminates deployment complexity while demonstrating real persistence patterns — crash recovery, idempotent resume, structured audit trail.

**Simulated chains over testnets.** Testnets are flaky, rate-limited, and require faucet tokens. Simulated chains provide configurable failure rates for reliable testing of recovery paths. The adapter interface matches what real chain integrations would look like.

**State lifecycle:**
```
CREATED → PENDING → EXECUTING → COMPLETED
                       ↓
                   RECOVERING → EXECUTING (resume)
                       ↓
                WITHDRAWAL_PENDING → WITHDRAWN
```
