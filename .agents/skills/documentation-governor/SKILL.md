---
name: documentation-governor
description: "Governs TheSource documentation and skill maturity through repeatable evidence, score gates, and drift control."
user-invocable: true
when_to_use: "Use when creating, updating, auditing, or reconciling project documentation, skill files, onboarding guides, or maturity reports."
version: "51.1-Singularity"
dependencies:
  nexus-core: v51.0
  nexus-memory: v51.0
allowed-tools:
  - FileRead
  - FileReadLines
  - FileEdit
  - FileWrite
  - Grep
  - Glob
  - Bash
  - TodoWrite
  - ShadowLedgerAudit
  - SemanticReference
  - TokenEstimation
---

# Documentation Governor

## Mission

Keep documentation and skills aligned with the running system, not with aspirational claims. Every maturity score must be backed by reproducible checks, current file references, and an explicit remediation path.

## Master-First Rule

`.agents/skills/nexus-core/master.md` is the single canonical entry point for connected local and remote models. All documentation, skill behavior, and MCP onboarding must be discoverable from `master.md`; secondary docs may hold detail, but they must not become competing roots.

## Operating Protocol

1. Read `.agents/skills/nexus-core/master.md`, `bridge.json`, `package.json`, and the relevant `SKILL.md` files before changing documentation.
2. Verify runtime facts from source or local checks before writing claims about MCP tools, database tables, admin dashboard behavior, or security controls.
3. Never print API keys, tokens, user secrets, voucher codes, or raw `.env` values in documentation.
4. Use `scripts/audit_skills_docs.js` after skill or documentation updates.
5. Store strategic documentation decisions in `.agents/memory/decisions.md` only after redacting secrets.

### HTML & Mermaid Generation Constraints

When generating or updating `.html` reports containing Mermaid diagrams, you **MUST** adhere to the following rules to prevent rendering crashes (especially in Mermaid v10.4.0+):

- **erDiagram Syntax Separation:** You must NEVER define aliases inline with relationships. Aliases must be on separate lines using hyphens instead of HTML tags (e.g., `EntityA ["Entity A - الكيان أ"]`). Do not use `<br/>` in `erDiagram` aliases or relationships.
- **Dual Naming:** Use English/Arabic dual naming for nodes.
- **Double Quotes:** Always wrap entity labels in double quotes `" "` to protect Arabic strings and spaces from crashing the parser.
- **Subgraph IDs:** Must contain no spaces, parentheses, or special characters.

## Remote MCP Model Onboarding

Remote models must be given only the `master.md` pointer first. From there, they must discover:

- `bridge.json` for the complete authorized tool inventory.
- `mcp_remote_server.js` for HTTP/SSE, RBAC, HMAC, billing, rate limits, and admin APIs.
- `config/database.db` only through redacted schema inspection, never raw secret dumps.
- `public/admin.html` and `public/client.html` as dashboard/client surfaces.
- `docs/SKILL_AND_DOCUMENTATION_GOVERNANCE.md` for maturity scoring and documentation rules.

The expected remote-model loop is: read `master.md`, list MCP tools, select the relevant skill, verify evidence, execute via MCP, log to Shadow Ledger, then run the applicable audit.

## Score Gates

| Gate                | Requirement                                                                                  | Minimum |
| ------------------- | -------------------------------------------------------------------------------------------- | ------- |
| Skill metadata      | Valid frontmatter with `name`, `description`, `version`, `dependencies`, and `allowed-tools` | 95      |
| Execution protocol  | Each skill has concrete steps and expected outputs                                           | 90      |
| Documentation truth | Claims cite source files or runnable commands                                                | 95      |
| Encoding health     | No mojibake in active docs or skills                                                         | 100     |
| Security hygiene    | No secrets, default production keys, or raw credentials                                      | 100     |

## Documentation Update Checklist

- Identify the owner: architecture, operations, admin, security, database, or skill governance.
- Link the document to source files or commands that prove the claim.
- Add a dated change note only when the change affects operators or future agents.
- Run `node scripts/audit_skills_docs.js` and address new regressions.
- If a score is stated as `100`, include the exact gates that passed.
- If MCP Server Tools are stated as `100/100`, cite `npm run mcp-tools:certify:strict -- --full`, the latest `summary.json`, `scores.json`, `artifact_hashes.json`, and the matching Shadow Ledger proof.
- Treat external folders such as Antigravity artifacts as historical source material until they are copied into a fresh TheSource evidence pack, hashed, and logged.

## MCP Server Tools 100 Documentation Rule

The canonical MCP Server Tools certification command is:

```powershell
.\launch_native_mcp.cmd
npm run mcp-tools:certify:strict -- --full
```

A documentation page may claim MCP Server Tools 100/100 only when it names:

- `reports/mcp-tools-100/<timestamp>/summary.json` with `CERTIFIED_100`.
- `scores.json` showing all eight matrix lanes at full points.
- `artifact_hashes.json` and Shadow Ledger entries for every artifact.
- Native MCP auth/denial/skill-filter proof.
- Tool-source alignment proof from `tool_source_alignment.json`.
- Agent/swarm alignment proof from `agent_swarm_alignment.json`.
- Streamable HTTP/SSE/metrics/admin proof.
- SourceMap/GPS, live UI, Vitest, and swarm proof.

If any item is missing, the wording must be `provisional`, `partial`, or `pending`, never `100/100`.

## Output Template

```markdown
## Decision

- Scope:
- Evidence:
- Changed docs:
- Changed skills:
- Validation:
- Residual risk:
```

## 👑 التبعية المركزية الإلزامية (Central Nerve Dependency)

> **تحذير سيادي**: هذه المهارة تابعة بشكل هيكلي ومطلق للمهارة الأم `nexus-core/master.md`. يُمنع على أي نموذج ذكاء اصطناعي (LLM) أو وكيل تنفيذ أو استخدام هذه المهارة بمعزل عن توجيهات المهارة المركزية العليا. يجب العودة دائماً لدستور `master` قبل اتخاذ أي قرار مصيري.

## 🗺️ التوجيه الجغرافي (GPS Map Protocol)

> **قاعدة أوميغا الصارمة**: عند التعامل مع الأخطاء أو استرجاع السياق، يُمنع استنزاف نافذة التوكنز في قراءة الملفات الضخمة. يجب الاعتماد على `cli.js.map` كمرجع جغرافي (GPS) لفك تشفير الأخطاء وإرشاد أدوات الـ (AST Editing) نحو السطر البرمجي المادي بدقة (Zero-Token Overhead).
