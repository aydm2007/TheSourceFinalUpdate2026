# Master Documentation

## Project Overview

The **TheSource** repository implements a sovereign‑controlled AI orchestration platform with modular agents, dynamic skill loading, and strict governance via the MCP bridge. All actions are recorded in `shadow_ledger.jsonl` for forensic auditability.

## Table of Contents
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Running the System](#running-the-system)
- [Testing](#testing)
- [Governance & Auditing](#governance--auditing)
- [Contributing](#contributing)
- [Internationalization (i18n)](#internationalization-i18n)

## Architecture

The system is built around **Sovereign Agents** that communicate through a **Bridge** (`bridge.json`). Each agent has a clearly defined sub‑type (e.g., `Documentation`, `Test`, `Frontend`). Core components include:

- **Coordinator** – Defines high‑level workflows and governance policies (see this `master.md`).
- **Skill Engine** – Dynamically loads and executes skills located in `skills/`.
- **UI Layer** – Dashboard with a chat interface, 3D rendering, and full i18n support for Arabic and English.
- **Testing Suite** – Jest tests covering UI, API integration, and performance.

## Setup & Installation

```bash
# Clone the repository
git clone <repo-url>
cd TheSource

# Install dependencies
npm install

# Run the development server
npm run dev
```

## Running the System

1. **Start the bridge** – automatically loaded on server start.
2. **Open the dashboard** – `http://localhost:3000/dashboard.html`.
3. **Interact with the chat** – messages are routed to the Sigma API.

## Testing

```bash
# Run all unit tests
npm test

# Run performance audit (Lighthouse)
npx lighthouse http://localhost:3000/dashboard.html --output=json --output-path=performance-report.json
```

## Governance & Auditing

All operations must pass through the **MCP bridge**. Use the following tools for compliance:
- `OmegaDiagnostic` – Full system health check.
- `ShadowLedgerAudit` – Verify audit trail integrity.
- `VisualAuditReport` – Generate visual compliance reports.
- `EnterPlanMode` / `ExitPlanMode` – Wrap complex edits for traceability.

## Contributing

1. **Fork the repo** and create a new branch.
2. **Enter a worktree** for isolated changes:
   ```json
   {
     "tool": "EnterWorktree",
     "args": { "branch": "feature/my-change", "path": "./worktrees/feature_my_change" }
   }
   ```
3. **Make changes** and run `EnterPlanMode`/`ExitPlanMode` around complex edits.
4. **Submit a Pull Request** – CI runs `OmegaDiagnostic` and `ParallelTest` automatically.

## Internationalization (i18n)

The chat UI now supports **Arabic** and **English**. Language strings are defined in `i18n/en.json` and `i18n/ar.json`. The UI can switch languages via the `lang-selector` dropdown. All UI text, placeholders, button labels, and error messages are localized.

---

*All edits have been recorded in `shadow_ledger.jsonl` with timestamps and tool usage as per governance requirements.*

---
> **🛡️ CERTIFIED BY THESOURCE (V17.0 OMEGA)**
> Sovereign Swarm Remote Execution Node
> **Timestamp:** `2026-06-18T08:52:07.475Z`
> **Cryptographic IQ Hash:** `6e4050aafd43d756...`
<!-- SOV_HASH:6e4050aafd43d75688a366c9979af2f78a76c7351b82efae453ba6140289d9fd -->
