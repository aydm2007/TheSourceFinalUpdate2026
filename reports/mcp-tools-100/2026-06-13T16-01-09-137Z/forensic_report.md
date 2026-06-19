# MCP Server Tools 100 Certification Report

Generated: 2026-06-13T16:02:26.791Z
Run ID: 2026-06-13T16-01-09-137Z

## Final Score: 63/100

Result: provisional. One or more lanes are missing fresh proof or matching artifacts.

## Atomic Score Matrix

| Lane | Points |
| --- | ---: |
| Tool inventory/schema | 10/10 |
| Auth/RBAC/skill filtering | 0/15 |
| Streamable HTTP/SSE/metrics/admin | 0/15 |
| MCP resources/read resources | 10/10 |
| SourceMap/GPS proof | 15/15 |
| Forensic audit/reporting | 15/15 |
| Swarm/agent proof | 3/10 |
| Artifact + Shadow Ledger discipline | 10/10 |

## Evidence

SHA-256 source of truth: `artifact_hashes.json` for regular artifacts, and Shadow Ledger for `artifact_hashes.json` itself.

- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/environment.json` - environment
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/test_mcp_integration.log` - command-log
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/cli_map_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/tool_source_alignment.log` - command-log
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/agent_swarm_alignment.log` - command-log
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/native_mcp_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/global_production_gate.log` - command-log
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/sovereign_90_sweep.log` - command-log
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/live_ui_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/vitest_after.log` - command-log
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/mcp_resources.json` - mcp-resources
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/streamable_http_transcript.json` - transport-proof
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/native_mcp_evidence.json` - native-mcp-proof
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/source_map_tool_proofs.json` - source-map-proof
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/tool_source_alignment.json` - tool-source-alignment
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/agent_swarm_alignment.json` - agent-swarm-alignment
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/gate_extracts.json` - gate-proof
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/summary.json` - summary
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/scores.json` - scores
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/artifact_hashes.json` - artifact-hashes
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/forensic_report.md` - forensic-report-md
- `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/forensic_report.html` - forensic-report-html

## Atomic Findings

| Claim | Status | Evidence | Artifact | SHA-256 | Map Anchor |
| --- | --- | --- | --- | --- | --- |
| Bridge tool inventory is governed and discoverable. | pending | bridge declared=n/a, exposedMcp=n/a | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/native_mcp_evidence.json` | `514d5c71fdf4...` |  |
| Auth, metrics, SSE, Streamable HTTP, and admin tools are live. | pending | metrics=n/a, sse=n/a, transport=n/a, adminTools=n/a | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/streamable_http_transcript.json` | `671c2cdfd469...` |  |
| Unauthenticated access is denied. | pending | unauthMetricsDenied=false, unauthMcpDenied=false | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/native_mcp_evidence.json` | `514d5c71fdf4...` |  |
| Active skill filtering and RBAC are enforced. | pending | bootstrap=n/a, securityWriteDenied=n/a | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/native_mcp_evidence.json` | `514d5c71fdf4...` |  |
| Project-agnostic MCP resources are listed and readable. | pass | genericPresent=true, genericUris=5, reads=5 | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/mcp_resources.json` | `a848385a9b29...` |  |
| Every declared bridge tool has a governed runtime source anchor. | pass | tools=130, runtimeAnchored=130, sourceMapDirect=33 | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/tool_source_alignment.json` | `247b7c34e3b5...` | package/cli.js.map |
| All skills and required swarm tools are governed, GPS-aligned, and bridge-compatible. | pass | skills=32, gps=32, swarmAnchored=9/9 | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/agent_swarm_alignment.json` | `0a833abd923e...` | package/cli.js.map |
| SourceMap/GPS metadata is complete and map tools are aligned. | pass | sources=4756, sourcesContent=4756, decoder=pass | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/source_map_tool_proofs.json` | `7eafb1215e87...` | package/cli.js:8:1924 -> ../node_modules/lodash-es/_listCacheClear.js:8:0 |
| Live UI proof exists as runtime evidence, not only static topology. | pass | liveUiGate=pass | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/gate_extracts.json` | `688365137d41...` |  |
| Vitest completed with a clean process exit. | pending | vitest=fail, exitCode=1 | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/vitest_after.log` | `c3db47480331...` |  |
| Swarm and agent lane is available and proven by the gate. | pending | swarmDryRun=false, coordinator=false, agent=false | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/native_mcp_evidence.json` | `514d5c71fdf4...` |  |
| Artifact discipline is complete. | pass | logged=22/22, hashesMatch=true | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/artifact_hashes.json` | `c7447f40751d...` |  |
| Final certification summary is present. | pending | score=63, status=PROVISIONAL | `reports/mcp-tools-100/2026-06-13T16-01-09-137Z/summary.json` | `1099ecf8eda2...` |  |

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
- nativeMcp: fail
- globalProductionGate: fail
- sovereign90Sweep: pass
- liveUi: pass
- vitest: fail

## Remaining Risk

- Failed gates: nativeMcp, globalProductionGate, vitest.
- Do not claim 100/100 until every lane reaches full points with fresh artifacts.
- Streamable HTTP/SSE/metrics/admin proof is incomplete, usually because admin API key/server evidence is missing.
