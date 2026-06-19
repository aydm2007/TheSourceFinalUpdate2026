# MCP Server Tools 100 Certification

This document is the project-agnostic operating reference for proving TheSource MCP Server Tools at 100/100. It applies to any connected model, IDE, or project context. It is not AgriAsset-specific.

## Current Evidence Anchor

- Command: `npm run mcp-tools:certify:strict -- --full`
- Latest certified run: `reports/mcp-tools-100/2026-06-03T19-41-21-571Z/summary.json`
- Status: `CERTIFIED_100`
- Score: `100`
- Artifacts: `22`
- Ledger proof: every artifact logged in `.nexus/var/telemetry/shadow_ledger.jsonl`
- Hash proof: `artifact_hashes.json` plus matching Shadow Ledger self-hash
- Tool/source proof: `npm run tool-source:verify` and `tool_source_alignment.json`
- Agent/swarm proof: `npm run agent-swarm:verify` and `agent_swarm_alignment.json`

Do not claim MCP Server Tools 100/100 from older reports, external folders, or memory. Re-run the strict command when fresh evidence is required.

## Certification Command

```powershell
.\launch_native_mcp.cmd
npm run tool-source:verify
npm run agent-swarm:verify
npm run mcp-tools:certify:strict -- --full
```

The second command writes all evidence to:

```text
reports/mcp-tools-100/<timestamp>/
```

## Score Matrix

| Lane | Points | Required proof |
| --- | ---: | --- |
| Tool inventory/schema | 10 | `bridge.json`, Native MCP discovery, schema/tool proofs, tool-source alignment |
| Auth/RBAC/skill filtering | 15 | Authenticated pass, unauthenticated denial, active skill filtering |
| Streamable HTTP/SSE/metrics/admin | 15 | HTTP transcript, SSE proof, `/metrics`, admin tools proof |
| MCP resources/read resources | 10 | Generic resource listing and `ReadMcpResource` payloads |
| SourceMap/GPS proof | 15 | `cli.js`, `cli.js.map`, 4,756 sources, map tool proofs |
| Forensic audit/reporting | 15 | `forensic_report.md/html`, findings, hashes, statuses |
| Swarm/agent proof | 10 | `ParallelSwarmCoordinator`, skill governance, required swarm tool anchors, and `agent_swarm_alignment.json` |
| Artifact + Shadow Ledger discipline | 10 | Hashes and matching Shadow Ledger entries |

## Generic MCP Resources

The certification lane is project-agnostic because it exposes these generic resources:

- `mcp://tool-registry`
- `mcp://latest-gates`
- `mcp://forensic-reports`
- `mcp://source-map`
- `mcp://shadow-ledger`

Legacy project-specific resources may remain for compatibility, but they are not the default certification source.

## Forensic Report Standard

Every high-confidence finding should include:

- Claim
- Evidence
- Artifact path
- SHA-256 hash
- Status
- `mapAnchor` when SourceMap context exists
- Tool/source anchor when a claim references a bridge tool

The report may be detailed, narrative, and visual, but it must remain traceable to command output and files in the evidence directory.

## Model Independence

TheSource should not depend on a single model being stronger than another model. The deterministic execution layer is the advantage:

- Discover the project through `AGENTS.md`, `master.md`, `bridge.json`, and MCP resources.
- Ground code and UI claims through `package/cli.js` and `package/cli.js.map`.
- Execute through MCP tools and skill filtering.
- Capture transcripts, hashes, screenshots, and reports.
- Log every artifact in Shadow Ledger.
- Certify only through repeatable gates.

This is the standard that makes any connected model behave closer to a deterministic execution system.

## Boundary For Strong Claims

Allowed:

- "MCP Server Tools are certified 100/100 for run `<timestamp>`."
- "TheSource has a deterministic MCP evidence lane that passed all required checks."
- "The latest certification includes live UI, Streamable HTTP, Vitest, SourceMap, swarm, and ledger proof."

Not allowed without fresh evidence:

- "The whole product roadmap is complete."
- "A live 40-agent swarm executed" unless a transcript proves it.
- "A model was beaten directly" unless a fresh benchmark baseline for that model exists.
- "External artifact reports are current truth" unless they are imported, hashed, and logged.
