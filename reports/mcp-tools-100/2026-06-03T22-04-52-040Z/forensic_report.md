# MCP Server Tools 100 Certification Report

Generated: 2026-06-03T22:05:39.300Z
Run ID: 2026-06-03T22-04-52-040Z

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

- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/environment.json` - environment
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/test_mcp_integration.log` - command-log
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/cli_map_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/tool_source_alignment.log` - command-log
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/agent_swarm_alignment.log` - command-log
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/native_mcp_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/global_production_gate.log` - command-log
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/sovereign_90_sweep.log` - command-log
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/live_ui_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/mcp_resources.json` - mcp-resources
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/streamable_http_transcript.json` - transport-proof
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/native_mcp_evidence.json` - native-mcp-proof
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/source_map_tool_proofs.json` - source-map-proof
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/tool_source_alignment.json` - tool-source-alignment
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/agent_swarm_alignment.json` - agent-swarm-alignment
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/gate_extracts.json` - gate-proof
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/summary.json` - summary
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/scores.json` - scores
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/artifact_hashes.json` - artifact-hashes
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/forensic_report.md` - forensic-report-md
- `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/forensic_report.html` - forensic-report-html

## Atomic Findings

| Claim | Status | Evidence | Artifact | SHA-256 | Map Anchor |
| --- | --- | --- | --- | --- | --- |
| Bridge tool inventory is governed and discoverable. | pass | bridge declared=129, exposedMcp=38 | `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/native_mcp_evidence.json` | `3f890450ff32...` |  |
| Auth, metrics, SSE, Streamable HTTP, and admin tools are live. | pending | metrics=null, sse=null, transport=streamable-http, adminTools=null | `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/streamable_http_transcript.json` | `cad5f659257d...` |  |
| Unauthenticated access is denied. | pending | unauthMetricsDenied=false, unauthMcpDenied=false | `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/native_mcp_evidence.json` | `3f890450ff32...` |  |
| Active skill filtering and RBAC are enforced. | pass | bootstrap=true, securityWriteDenied=true | `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/native_mcp_evidence.json` | `3f890450ff32...` |  |
| Project-agnostic MCP resources are listed and readable. | pass | genericPresent=true, genericUris=5, reads=5 | `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/mcp_resources.json` | `3e1d2d0f7ccc...` |  |
| Every declared bridge tool has a governed runtime source anchor. | pass | tools=129, runtimeAnchored=129, sourceMapDirect=33 | `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/tool_source_alignment.json` | `fd659fa9e32f...` | package/cli.js.map |
| All skills and required swarm tools are governed, GPS-aligned, and bridge-compatible. | pass | skills=28, gps=28, swarmAnchored=9/9 | `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/agent_swarm_alignment.json` | `de6bebd9e7c3...` | package/cli.js.map |
| SourceMap/GPS metadata is complete and map tools are aligned. | pass | sources=4756, sourcesContent=4756, decoder=pass | `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/source_map_tool_proofs.json` | `a31738218fe4...` | package/cli.js:8:1924 -> ../node_modules/lodash-es/_listCacheClear.js:8:0 |
| Live UI proof exists as runtime evidence, not only static topology. | pass | liveUiGate=pass | `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/gate_extracts.json` | `1ddf788bb4f2...` |  |
| Vitest completed with a clean process exit. | pending | vitest=skipped, exitCode=n/a | `missing` | `missing` |  |
| Swarm and agent lane is available and proven by the gate. | pass | swarmDryRun=true, coordinator=true, agent=true | `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/native_mcp_evidence.json` | `3f890450ff32...` |  |
| Artifact discipline is complete. | pass | logged=21/21, hashesMatch=true | `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/artifact_hashes.json` | `6de8c9236ad5...` |  |
| Final certification summary is present. | pending | score=81, status=PROVISIONAL | `reports/mcp-tools-100/2026-06-03T22-04-52-040Z/summary.json` | `50c05c3042c5...` |  |

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

- Do not claim 100/100 until every lane reaches full points with fresh artifacts.
- Streamable HTTP/SSE/metrics/admin proof is incomplete, usually because admin API key/server evidence is missing.
