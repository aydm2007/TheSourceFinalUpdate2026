# Skill Documentation

## Overview

This document provides a comprehensive guide to the **Skill** system used throughout the project. It outlines the purpose, structure, and lifecycle of skills, as well as best‑practice recommendations for creating, extending, and maintaining them.

## Table of Contents
- [Purpose & Scope](#purpose--scope)
- [Skill Definition Format](#skill-definition-format)
- [Creating a New Skill](#creating-a-new-skill)
- [Integration Guidelines](#integration-guidelines)
- [Examples](#examples)
- [Testing & Validation](#testing--validation)
- [Versioning & Compatibility](#versioning--compatibility)
- [Common Pitfalls & Troubleshooting](#common-pitfalls--troubleshooting)

---

### Purpose & Scope

The **Skill** subsystem abstracts reusable functionality (e.g., linting, code generation, deployment helpers) into self‑contained modules. Each skill lives under `skill/` and is referenced by the **Master** configuration (`master.md`). Skills enable:
- Consistent tooling across the codebase.
- Easy swapping of implementations.
- Centralized documentation and version control.

---

### Skill Definition Format

A skill is defined as a Markdown file with the following front‑matter style sections:

```markdown
## Description
A short, human‑readable description of the skill’s purpose.

## Interface
- **Inputs**: List of required parameters.
- **Outputs**: Expected results or side‑effects.

## Implementation
Path to the implementation script or binary.

## Usage Example
```js
await skillName({ param1: "value" });
```
```

> **Tip:** Keep the **Implementation** path relative to the repository root for portability.

---

### Creating a New Skill
1. **Create a file** under `skill/` named `<skill-name>.md`.
2. **Populate the sections** as described above.
3. **Add the implementation** (JS/TS, Bash, etc.) in a sibling folder `skill/<skill-name>/`.
4. **Register the skill** in `master.md` under the **Skills Registry** table.
5. **Run `Skill` tool** to validate the syntax.

---

### Integration Guidelines
- **Single Responsibility:** Each skill should perform one well‑defined task.
- **Statelessness:** Prefer pure functions; avoid global mutable state.
- **Error Handling:** Throw descriptive errors; do not swallow exceptions.
- **Logging:** Use the provided `Logger` utility for consistent output.
- **Testing:** Add unit tests under `tests/skill/` covering all inputs/outputs.

---

### Examples
#### Example 1: `react-surgeon`
```markdown
## Description
Automates common React refactoring patterns (e.g., converting class components to hooks).

## Interface
- **Inputs**: `filePath: string`
- **Outputs**: Modified file content written back to disk.

## Implementation
skill/react-surgeon/transform.js

## Usage Example
```js
await skillReactSurgeon({ filePath: "src/App.jsx" });
```
```

#### Example 2: `security-audit`
```markdown
## Description
Runs a static security analysis on the entire codebase.

## Interface
- **Inputs**: `targetPath?: string`
- **Outputs**: JSON report saved to `reports/security-audit.json`.

## Implementation
skill/security-audit/run.sh

## Usage Example
```bash
./skill/security-audit/run.sh --target src/
```
```

---

### Testing & Validation
- **Static Validation:** Run `Skill` tool with `--validate` flag to ensure required sections exist.
- **Unit Tests:** Place tests under `tests/skill/<skill-name>/` and execute via `npm test`.
- **CI Integration:** Add a step in the CI pipeline to lint all `*.md` skill files.

---

### Versioning & Compatibility
- Increment the **Version** header (`## Version`) whenever the public interface changes.
- Keep a **Changelog** section for breaking changes.
- Use semantic versioning (MAJOR.MINOR.PATCH).

---

### Common Pitfalls & Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Skill not found at runtime | Misspelled registration entry in `master.md` | Verify the skill name matches exactly. |
| Missing parameters | Interface documentation out‑of‑date | Update the **Interface** section and corresponding implementation. |
| Silent failures | Errors are swallowed inside the implementation | Ensure all errors are re‑thrown or logged via `Logger.error`. |

---

## Additional Documentation Sections

### Integration with the Master Registry
- After creating a new skill, add an entry to the **Skills Registry** table in `master.md`.
- Example entry:
  ```markdown
  | Skill Name | Description | Path |
  |------------|-------------|------|
  | i18n-helper | Provides runtime language switching for UI components | skill/i18n-helper.md |
  ```
- Run the `Skill` tool with `--validate` to ensure the registry is in sync.

### Testing Guidelines
- Place all unit tests under `tests/skill/<skill-name>/`.
- Use the `ParallelTest` tool to run them concurrently.
- Include both happy‑path and failure‑path tests to cover error handling.

### Versioning Policy
- Increment the **Version** header (`## Version`) following semantic versioning.
- Document breaking changes in a **Changelog** section.
- Tag releases in Git with `skill-<name>-v<semver>`.

### Security Considerations
- Never execute untrusted code directly from a skill; always sanitize inputs.
- Prefer using the provided `SecurityContext` wrapper for any external calls.
- Run `RealtimeScan` on the skill implementation before merging.

---

*Last updated: 2026‑06‑18*
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Skill not found at runtime | Misspelled registration entry in `master.md` | Verify the skill name matches exactly. |
| Missing parameters | Interface documentation out‑of‑date | Update the **Interface** section and corresponding implementation. |
| Silent failures | Errors are swallowed inside the implementation | Ensure all errors are re‑thrown or logged via `Logger.error`. |

---

*Last updated: 2026‑06‑17*

---
> **🛡️ CERTIFIED BY THESOURCE (V17.0 OMEGA)**
> Sovereign Swarm Remote Execution Node
> **Timestamp:** `2026-06-18T08:16:52.372Z`
> **Cryptographic IQ Hash:** `7b4cc7e2c07eea73...`
<!-- SOV_HASH:7b4cc7e2c07eea734cd569598b4ffe7e80b6ea34c76a2b59ddbb731d148808fb -->

<!-- BEGIN AUTO-GENERATED SECTION -->
- Updated skill definitions and usage examples for all agents.
- Added versioning information and integration guidelines.
<!-- END AUTO-GENERATED SECTION -->

---
> **🛡️ CERTIFIED BY THESOURCE (V17.0 OMEGA)**
> Sovereign Swarm Remote Execution Node
> **Timestamp:** `2026-06-18T11:35:04.780Z`
> **Cryptographic IQ Hash:** `2c5604a952e71faa...`
<!-- SOV_HASH:2c5604a952e71faa0cc4ae8f01f82187d29d41d3924a1d3d0fb709763fed956d -->
