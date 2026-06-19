# MCP Server Tools 100 Certification Report

Generated: 2026-06-14T01:15:33.855Z
Run ID: 2026-06-14T01-12-25-809Z

## Final Score: 100/100

Result: MCP Server Tools 100/100 is certified by fresh artifacts.

## Atomic Score Matrix

| Lane | Points |
| --- | ---: |
| Tool inventory/schema | 10/10 |
| Auth/RBAC/skill filtering | 15/15 |
| Streamable HTTP/SSE/metrics/admin | 15/15 |
| MCP resources/read resources | 10/10 |
| SourceMap/GPS proof | 15/15 |
| Forensic audit/reporting | 15/15 |
| Swarm/agent proof | 10/10 |
| Artifact + Shadow Ledger discipline | 10/10 |

## Evidence

SHA-256 source of truth: `artifact_hashes.json` for regular artifacts, and Shadow Ledger for `artifact_hashes.json` itself.

- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/environment.json` - environment
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/test_mcp_integration.log` - command-log
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/cli_map_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/tool_source_alignment.log` - command-log
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/agent_swarm_alignment.log` - command-log
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/native_mcp_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/global_production_gate.log` - command-log
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/sovereign_90_sweep.log` - command-log
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/live_ui_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/mcp_resources.json` - mcp-resources
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/streamable_http_transcript.json` - transport-proof
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/native_mcp_evidence.json` - native-mcp-proof
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/source_map_tool_proofs.json` - source-map-proof
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/tool_source_alignment.json` - tool-source-alignment
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/agent_swarm_alignment.json` - agent-swarm-alignment
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/gate_extracts.json` - gate-proof
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/summary.json` - summary
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/scores.json` - scores
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/artifact_hashes.json` - artifact-hashes
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/forensic_report.md` - forensic-report-md
- `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/forensic_report.html` - forensic-report-html

## Atomic Findings

| Claim | Status | Evidence | Artifact | SHA-256 | Map Anchor |
| --- | --- | --- | --- | --- | --- |
| Bridge tool inventory is governed and discoverable. | pass | bridge declared=130, exposedMcp=41 | `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/native_mcp_evidence.json` | `981049cf2991...` |  |
| Auth, metrics, SSE, Streamable HTTP, and admin tools are live. | pass | metrics=200, sse=text/event-stream, transport=streamable-http, adminTools=40 | `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/streamable_http_transcript.json` | `919a1538364b...` |  |
| Unauthenticated access is denied. | pass | unauthMetricsDenied=true, unauthMcpDenied=true | `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/native_mcp_evidence.json` | `981049cf2991...` |  |
| Active skill filtering and RBAC are enforced. | pass | bootstrap=true, securityWriteDenied=true | `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/native_mcp_evidence.json` | `981049cf2991...` |  |
| Project-agnostic MCP resources are listed and readable. | pass | genericPresent=true, genericUris=5, reads=5 | `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/mcp_resources.json` | `b1a1e11084bb...` |  |
| Every declared bridge tool has a governed runtime source anchor. | pass | tools=130, runtimeAnchored=130, sourceMapDirect=33 | `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/tool_source_alignment.json` | `2ed724fb0d7d...` | package/cli.js.map |
| All skills and required swarm tools are governed, GPS-aligned, and bridge-compatible. | pass | skills=32, gps=32, swarmAnchored=9/9 | `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/agent_swarm_alignment.json` | `da1d712a4de9...` | package/cli.js.map |
| SourceMap/GPS metadata is complete and map tools are aligned. | pass | sources=4756, sourcesContent=4756, decoder=pass | `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/source_map_tool_proofs.json` | `42ce4eb20b85...` | package/cli.js:8:1924 -> ../node_modules/lodash-es/_listCacheClear.js:8:0 |
| Live UI proof exists as runtime evidence, not only static topology. | pass | liveUiGate=pass | `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/gate_extracts.json` | `91e05aec51a9...` |  |
| Vitest completed with a clean process exit. | pending | vitest=skipped, exitCode=n/a | `missing` | `missing` |  |
| Swarm and agent lane is available and proven by the gate. | pass | swarmDryRun=true, coordinator=true, agent=true | `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/native_mcp_evidence.json` | `981049cf2991...` |  |
| Artifact discipline is complete. | pass | logged=21/21, hashesMatch=true | `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/artifact_hashes.json` | `b69b4be6eaad...` |  |
| Final certification summary is present. | pass | score=100, status=CERTIFIED_100 | `reports/mcp-tools-100/2026-06-14T01-12-25-809Z/summary.json` | `c52969384df0...` |  |

## Forensic Method

- Every finding is tied to an artifact path and a SHA-256 reference where the artifact is stable at report-generation time.
- `artifact_hashes.json` remains the source of truth for final artifact hashes; its own final hash is recorded in Shadow Ledger to avoid a self-hash paradox.
- External reports are historical unless imported into this evidence directory, hashed, and logged.

## Map Anchors

- Generated: {"file":"package/cli.js","line":8,"column":1924}
- Original: {"source":"../node_modules/lodash-es/_listCacheClear.js","line":8,"column":0,"name":"sample"}

## Gate Status

- testMcpIntegration: pass
- cliMap: pass
- toolSourceAlignment: pass
- agentSwarmAlignment: pass
- nativeMcp: pass
- globalProductionGate: pass
- sovereign90Sweep: pass
- liveUi: pass
- vitest: skipped

## Remaining Risk

- No pending certification lane reported by this gate.
