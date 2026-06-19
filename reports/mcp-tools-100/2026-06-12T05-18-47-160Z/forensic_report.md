# MCP Server Tools 100 Certification Report

Generated: 2026-06-12T05:20:05.023Z
Run ID: 2026-06-12T05-18-47-160Z

## Final Score: 81/100

Result: provisional. One or more lanes are missing fresh proof or matching artifacts.

## Atomic Score Matrix

| Lane | Points |
| --- | ---: |
| Tool inventory/schema | 10/10 |
| Auth/RBAC/skill filtering | 11/15 |
| Streamable HTTP/SSE/metrics/admin | 0/15 |
| MCP resources/read resources | 10/10 |
| SourceMap/GPS proof | 15/15 |
| Forensic audit/reporting | 15/15 |
| Swarm/agent proof | 10/10 |
| Artifact + Shadow Ledger discipline | 10/10 |

## Evidence

SHA-256 source of truth: `artifact_hashes.json` for regular artifacts, and Shadow Ledger for `artifact_hashes.json` itself.

- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/environment.json` - environment
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/test_mcp_integration.log` - command-log
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/cli_map_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/tool_source_alignment.log` - command-log
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/agent_swarm_alignment.log` - command-log
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/native_mcp_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/global_production_gate.log` - command-log
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/sovereign_90_sweep.log` - command-log
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/live_ui_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/vitest_after.log` - command-log
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/mcp_resources.json` - mcp-resources
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/streamable_http_transcript.json` - transport-proof
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/native_mcp_evidence.json` - native-mcp-proof
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/source_map_tool_proofs.json` - source-map-proof
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/tool_source_alignment.json` - tool-source-alignment
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/agent_swarm_alignment.json` - agent-swarm-alignment
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/gate_extracts.json` - gate-proof
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/summary.json` - summary
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/scores.json` - scores
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/artifact_hashes.json` - artifact-hashes
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/forensic_report.md` - forensic-report-md
- `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/forensic_report.html` - forensic-report-html

## Atomic Findings

| Claim | Status | Evidence | Artifact | SHA-256 | Map Anchor |
| --- | --- | --- | --- | --- | --- |
| Bridge tool inventory is governed and discoverable. | pass | bridge declared=129, exposedMcp=38 | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/native_mcp_evidence.json` | `ddea974151ec...` |  |
| Auth, metrics, SSE, Streamable HTTP, and admin tools are live. | pending | metrics=null, sse=null, transport=streamable-http, adminTools=null | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/streamable_http_transcript.json` | `544704bd8f9f...` |  |
| Unauthenticated access is denied. | pending | unauthMetricsDenied=false, unauthMcpDenied=false | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/native_mcp_evidence.json` | `ddea974151ec...` |  |
| Active skill filtering and RBAC are enforced. | pass | bootstrap=true, securityWriteDenied=true | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/native_mcp_evidence.json` | `ddea974151ec...` |  |
| Project-agnostic MCP resources are listed and readable. | pass | genericPresent=true, genericUris=5, reads=5 | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/mcp_resources.json` | `1e36ad881f6b...` |  |
| Every declared bridge tool has a governed runtime source anchor. | pass | tools=129, runtimeAnchored=129, sourceMapDirect=33 | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/tool_source_alignment.json` | `aab4178fd3e6...` | package/cli.js.map |
| All skills and required swarm tools are governed, GPS-aligned, and bridge-compatible. | pass | skills=29, gps=29, swarmAnchored=9/9 | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/agent_swarm_alignment.json` | `a3a55c9c117a...` | package/cli.js.map |
| SourceMap/GPS metadata is complete and map tools are aligned. | pass | sources=4756, sourcesContent=4756, decoder=pass | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/source_map_tool_proofs.json` | `41b400b0b85e...` | package/cli.js:8:1924 -> ../node_modules/lodash-es/_listCacheClear.js:8:0 |
| Live UI proof exists as runtime evidence, not only static topology. | pass | liveUiGate=pass | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/gate_extracts.json` | `b0b6a9179867...` |  |
| Vitest completed with a clean process exit. | pass | vitest=pass, exitCode=0 | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/vitest_after.log` | `cff571072747...` |  |
| Swarm and agent lane is available and proven by the gate. | pass | swarmDryRun=true, coordinator=true, agent=true | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/native_mcp_evidence.json` | `ddea974151ec...` |  |
| Artifact discipline is complete. | pass | logged=22/22, hashesMatch=true | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/artifact_hashes.json` | `28428321f340...` |  |
| Final certification summary is present. | pending | score=81, status=PROVISIONAL | `reports/mcp-tools-100/2026-06-12T05-18-47-160Z/summary.json` | `207093ce4827...` |  |

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
- vitest: pass

## Remaining Risk

- Do not claim 100/100 until every lane reaches full points with fresh artifacts.
- Streamable HTTP/SSE/metrics/admin proof is incomplete, usually because admin API key/server evidence is missing.
