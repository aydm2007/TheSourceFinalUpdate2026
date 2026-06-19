# Skill Documentation

## Overview

This document provides a comprehensive guide to the **Skill** system used throughout the project. It explains the purpose, structure, and usage patterns for skills, including how to create, read, and manage them.

## Table of Contents
- [Introduction](#introduction)
- [Skill Definition Format](#skill-definition-format)
- [Creating a New Skill](#creating-a-new-skill)
- [Reading and Listing Skills](#reading-and-listing-skills)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Integration Guidelines](#integration-guidelines)
- [Troubleshooting](#troubleshooting)

## Introduction

Skills are modular, reusable pieces of functionality that can be loaded dynamically at runtime. They enable the system to extend its capabilities without modifying the core codebase.

## Skill Definition Format

Each skill resides in its own folder under `skills/` and must contain a `SKILL.md` file with the following front‑matter:

```yaml
name: <skill-name>
version: <semantic-version>
description: <short description>
author: <author name>
```

Followed by detailed sections:

- **Purpose** – what the skill does.
- **API** – exported functions, expected inputs/outputs.
- **Dependencies** – external libraries required.
- **Configuration** – environment variables or config flags.

## Creating a New Skill

1. **Create the directory**: `mkdir -p skills/<skill-name>`
2. **Add `SKILL.md`** with the template above.
3. **Implement the functionality** in a JavaScript/TypeScript file inside the folder.
4. **Register the skill** in `bridge.json` under `allowed-tools` if it requires new tool access.
5. **Run tests** to ensure compliance.

## Reading and Listing Skills

Use the built‑in `Skill` tool:

```json
{
  "tool": "Skill",
  "args": { "action": "list" }
}
```

Or to read a specific skill:

```json
{
  "tool": "Skill",
  "args": { "action": "read", "skill": "<skill-name>" }
}
```

## Best Practices

- **Keep skills atomic**: one responsibility per skill.
- **Document public APIs** clearly.
- **Version semantically** and update `bridge.json` when permissions change.
- **Write unit tests** for each exported function.
- **Avoid side effects** that affect global state.

## Examples

### Example 1: `react-surgeon`

```yaml
name: react-surgeon
version: 1.2.0
description: Advanced React component refactoring utilities.
```

Provides:
- `refactorComponent(name, changes)`
- `extractHooks(componentPath)`

### Example 2: `security-audit`

```yaml
name: security-audit
version: 2.0.1
description: Scans source files for common vulnerabilities.
```

Exports `runAudit(targetPath)` which returns a JSON report.

## Integration Guidelines

When integrating a skill into existing workflows:
1. **Import the skill** via `LoadSkill` at runtime.
2. **Validate permissions** using the bridge audit (`OmegaDiagnostic`).
3. **Wrap calls** in `EnterPlanMode`/`ExitPlanMode` for complex operations.
4. **Log actions** automatically to `shadow_ledger.jsonl`.

## Troubleshooting

- **Skill not found** – ensure the folder name matches the `name` field in `SKILL.md`.
- **Permission errors** – update `bridge.json` and re‑run `OmegaDiagnostic`.
- **Version conflicts** – bump the version and clear caches with `MemoryCompactor`.

---

# Master Documentation

## Project Overview

The repository implements a modular, sovereign‑controlled AI orchestration platform. It includes:
- Core coordination (`master.md`)
- Skill management (`skill.md`)
- UI components, rendering pipeline, and extensive test coverage.

## Table of Contents
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Running the System](#running-the-system)
- [Testing](#testing)
- [Governance & Auditing](#governance--auditing)
- [Contributing](#contributing)

## Architecture

The system is built around **Sovereign Agents** that communicate via the **Bridge** (`bridge.json`). Each agent has a clearly defined sub‑type (e.g., `Documentation`, `Test`, `Frontend`). All actions are recorded in `shadow_ledger.jsonl` for forensic auditability.

### Core Components
- **Coordinator** – `master.md` defines the high‑level workflow and governance policies.
- **Skill Engine** – Dynamically loads and executes skills defined in `skills/`.
- **UI Layer** – Dashboard with chat interface, 3D rendering, and i18n support.
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

All operations must go through the **MCP bridge**. Use the following tools for compliance:
- `OmegaDiagnostic` – full system health check.
- `ShadowLedgerAudit` – verify audit trail.
- `VisualAuditReport` – generate visual compliance reports.

## Contributing

1. **Fork the repo** and create a new branch.
2. **Enter a worktree** for isolated changes:
   ```json
   {
     "tool": "EnterWorktree",
     "args": { "branch": "feature/my‑change", "path": "./worktrees/feature_my_change" }
   }
   ```
3. **Make changes** and run `EnterPlanMode`/`ExitPlanMode` around complex edits.
4. **Submit a Pull Request** – the CI pipeline runs `OmegaDiagnostic` and `ParallelTest` automatically.

---

*All edits have been recorded in `shadow_ledger.jsonl` with timestamps and tool usage as per governance policy.*

---
> **🛡️ CERTIFIED BY THESOURCE (V17.0 OMEGA)**
> Sovereign Swarm Remote Execution Node
> **Timestamp:** `2026-06-18T08:51:40.255Z`
> **Cryptographic IQ Hash:** `9d5234d10c315476...`
<!-- SOV_HASH:9d5234d10c31547619e8499716e7237e261487e9e219a0340031b4fcd2ff3f93 -->
