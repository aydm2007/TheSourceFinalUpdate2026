# TheSource Skill And Documentation Governance

Last updated: 2026-05-24

## Current Atomic Score

Current project score after reviewing the MCP bridge, `master.md`, SQLite persistence, admin dashboard, tests, TypeScript, lint, and documentation state: **72/100**.

This score recognizes that the system has real runtime assets: `config/database.db`, `public/admin.html`, `public/client.html`, `bridge.json` with 105 declared tools, and a passing custom test path. It does not grant 100 because the documentation layer has encoding drift, several skills have malformed frontmatter, TypeScript and lint gates are not green, and some production-security claims are stronger than the current implementation evidence.

## Score Breakdown

| Area | Score | Evidence | Primary Gap |
| --- | ---: | --- | --- |
| MCP bridge inventory | 90 | `bridge.json` declares 105 tools and actual count matches | Tool safety varies by handler |
| Database and admin operations | 82 | `config/database.db` has users, wallets, projects, usage logs, vouchers, and admin audit logs | Secrets must stay redacted and admin auth policy needs tighter production wording |
| Test path | 78 | `npm test` passed 117 tests in the latest local run | Coverage gate is not persisted as a required score |
| Skills | 58 | `.agents/skills/*/SKILL.md` exists for core domains | Broken UTF-8 and malformed frontmatter in multiple skills |
| Documentation | 52 | Architecture and sovereign guides exist | Mojibake, stale versions, and unverifiable 100 percent claims |
| Build and static quality | 35 | `tsconfig.json`, `.eslintrc.js`, `package.json` | `tsc --noEmit` and `npm run lint` currently fail |
| Security posture | 62 | RBAC, HMAC checks, ledger logging, rate limiting are present | Default-key references and bypass switches need production gates |

## Documentation Architecture

The project documentation should be split into four tiers:

| Tier | File or Location | Purpose |
| --- | --- | --- |
| Constitution | `.agents/skills/nexus-core/master.md` | High-level governance and invariants |
| Operator guides | `docs/SOVEREIGN_GUIDE.md`, `docs/ARCHITECTURE.md` | Deployment, runtime, operations, and troubleshooting |
| Skill contracts | `.agents/skills/*/SKILL.md` | Agent-specific behavior, tools, inputs, outputs, and constraints |
| Evidence | `docs/evidence/*`, `tests/test-results/*`, `var/audit_reports/*` | Dated proof from tests, audits, screenshots, and validation |

`master.md` should not carry all operational detail. It should cite smaller focused documents and keep only stable invariants.

## Required Skill Contract

Every `SKILL.md` should have this minimum shape:

```yaml
---
name: skill-name
description: "One sentence describing the skill."
user-invocable: true
when_to_use: "Concrete trigger conditions."
version: "45.0-Omega"
dependencies:
  nexus-core: v45.0
allowed-tools:
  - FileRead
  - Grep
---
```

Each skill body must include:

| Section | Requirement |
| --- | --- |
| Mission | What the skill owns and what it does not own |
| Operating Protocol | Ordered execution steps |
| Inputs | Expected files, commands, schemas, or runtime state |
| Outputs | Reports, patches, ledger events, tests, or dashboards |
| Safety Rules | Redaction, rollback, path limits, and production constraints |
| Validation | Commands or checks proving the skill worked |

## Documentation Workflow

1. Read the source of truth first: `bridge.json`, `mcp_remote_server.js`, `core/db/db_manager.js`, `public/admin.html`, and the relevant skill files.
2. Update the focused document or skill file.
3. Avoid changing `master.md` unless a stable constitutional rule changed.
4. Run the governance audit:

```bash
node scripts/audit_skills_docs.js
```

5. If changing runtime behavior, also run:

```bash
npm test
```

6. Record the score delta and residual risk in the final report.

## Path To 100

| Step | Work | Target Score Impact |
| --- | --- | ---: |
| 1 | Repair UTF-8 mojibake in active docs and skill files | +8 |
| 2 | Normalize all skill frontmatter and remove duplicate keys | +6 |
| 3 | Add evidence links for every `100%` maturity claim | +5 |
| 4 | Make `node scripts/audit_skills_docs.js` a CI gate | +4 |
| 5 | Fix `npm run lint` plugin/config failures | +5 |
| 6 | Split TypeScript configs and make at least the maintained runtime subset pass `tsc --noEmit` | +8 |
| 7 | Replace default-key production wording with secret-managed deployment guidance | +4 |
| 8 | Add admin dashboard and database operational runbook with redacted examples | +3 |
| 9 | Require coverage summary artifacts for critical MCP handlers | +3 |
| 10 | Create a release checklist that blocks release below 95 | +2 |

When all gates pass, the project can honestly claim **95-100/100**. Until then, `72/100` is the defensible current rating.

## New Governance Tool

Use this command to score the skill and documentation layer:

```bash
node scripts/audit_skills_docs.js --json
```

The score is intentionally strict. It penalizes broken encoding, malformed frontmatter, missing execution protocols, and missing maturity criteria.

