# Agents Documentation

This document provides an overview of all specialized agents used in the project, their responsibilities, and how they interact with the sovereign tooling framework.

## Table of Contents
1. [Overview](#overview)
2. [Agent Types](#agent-types)
   - Lint‑Fixer
   - Internationalization
   - Performance Tester
   - Skill Enhancer
   - Hook Updater
   - Documentation Enhancer
   - Fixing Agent
   - Architect Agent
   - MCP Engineer
   - Code Engineer
   - Testing Agent
   - Security Agent
   - Performance Agent
   - Observability Agent
   - Scalability Agent
   - Deployment Agent
   - Cleanup Agent
   - Agents Documentation Agent
3. [Interaction Protocols](#interaction-protocols)
4. [Governance & Shadow Ledger](#governance--shadow-ledger)
5. [Best Practices](#best-practices)

---

## Overview
The project follows a **Sovereign Agent Architecture** where each functional area is encapsulated in a dedicated sub‑agent. Agents communicate via the MCP bridge, ensuring every operation is recorded in `shadow_ledger.jsonl` for auditability and compliance.

---

## Agent Types

### Lint‑Fixer
* **Purpose**: Apply automatic linting fixes (e.g., disable `process.exit`, adjust ESLint rules).
* **Key Tools**: `FileEdit`, `FileWrite`, `FullRepairLoop`.

### Internationalization
* **Purpose**: Add i18n support for English and Arabic UI strings.
* **Key Tools**: `FileEdit`, `FileWrite`.

### Performance Tester
* **Purpose**: Measure load time, message latency, and attachment/audio performance using Lighthouse and Web‑Vitals.
* **Key Tools**: `Bash`, `FileWrite`, `FileRead`.

### Skill Enhancer
* **Purpose**: Enrich `skill.md` and `master.md` with documentation, examples, and integration guidelines.
* **Key Tools**: `FileEdit`.

### Hook Updater
* **Purpose**: Ensure generated ESLint and pre‑commit hooks are committed and tracked.
* **Key Tools**: `Git`‑related commands via `Bash` (commit, push).

### Documentation Enhancer
* **Purpose**: Refine project documentation, add sections for troubleshooting, testing, and security.
* **Key Tools**: `FileEdit`, `FileWrite`.

### Fixing Agent
* **Purpose**: Apply automatic fixes based on lint/test analysis.
* **Key Tools**: `FullRepairLoop`.

### Architect Agent
* **Purpose**: Produce high‑level architecture overviews and migration plans.
* **Key Tools**: `FileWrite`.

### MCP Engineer Agent
* **Purpose**: Manage bridge entries, add or remove allowed tools, and maintain `bridge.json`.
* **Key Tools**: `FileEdit`.

### Code Engineer Agent
* **Purpose**: Perform targeted code modifications (e.g., comment out unsafe calls).
* **Key Tools**: `FileEdit`.

### Testing Agent
* **Purpose**: Write and maintain Jest unit/integration tests for UI components.
* **Key Tools**: `FileWrite`.

### Security Agent
* **Purpose**: Run static security scans and remediate findings.
* **Key Tools**: `RealtimeScan`.

### Performance Agent
* **Purpose**: Execute performance measurement scripts (Puppeteer, Lighthouse).
* **Key Tools**: `Bash`, `FileWrite`.

### Observability Agent
* **Purpose**: Set up logging, metrics, and error‑tracking hooks.
* **Key Tools**: `FileWrite`, `FileEdit`.

### Scalability Agent
* **Purpose**: Draft scalability guidelines and architecture patterns.
* **Key Tools**: `FileWrite`.

### Deployment Agent
* **Purpose**: Create CI/CD scripts and deployment pipelines.
* **Key Tools**: `FileWrite`, `Bash`.

### Cleanup Agent
* **Purpose**: Remove temporary files, reset worktrees, and prune shadow‑ledger entries.
* **Key Tools**: `Bash`, `FileEdit`.

### Agents Documentation Agent
* **Purpose**: Consolidate and maintain this very documentation, ensuring it stays up‑to‑date with any new agents or workflow changes.
* **Key Tools**: `FileWrite`.

---

## Interaction Protocols
Agents invoke each other through the **MCP bridge** using the allowed tool set. Every action is logged in `shadow_ledger.jsonl` with timestamps, tool name, and arguments.

---

## Governance & Shadow Ledger
All modifications must:
1. Use only bridge‑approved tools listed in `bridge.json`.
2. Record the operation in `shadow_ledger.jsonl`.
3. Follow the **Hybrid Exception Protocol** for any out‑of‑scope file access.

---

## Best Practices
* Keep each agent focused on a single responsibility.
* Write idempotent scripts to allow safe re‑execution.
* Review `shadow_ledger.jsonl` after major changes with `ShadowLedgerAudit`.
* Run `OmegaDiagnostic` periodically to ensure compliance.

---

*Document last updated: 2026‑06‑18*

---
> **🛡️ CERTIFIED BY THESOURCE (V17.0 OMEGA)**
> Sovereign Swarm Remote Execution Node
> **Timestamp:** `2026-06-18T10:19:23.167Z`
> **Cryptographic IQ Hash:** `ad08d2fb6dcd85ca...`
<!-- SOV_HASH:ad08d2fb6dcd85ca4fb02cf78fc9eb2517209b87c5ec783fc9150ec8fac3b63b -->
