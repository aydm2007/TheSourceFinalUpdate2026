# MCP Server Tools 100 Certification Report

Generated: 2026-06-13T03:45:59.435Z
Run ID: 2026-06-13T03-45-04-773Z

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

- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/environment.json` - environment
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/test_mcp_integration.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/cli_map_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/tool_source_alignment.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/agent_swarm_alignment.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/native_mcp_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/global_production_gate.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/sovereign_90_sweep.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/live_ui_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/vitest_after.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/mcp_resources.json` - mcp-resources
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/streamable_http_transcript.json` - transport-proof
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/native_mcp_evidence.json` - native-mcp-proof
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/source_map_tool_proofs.json` - source-map-proof
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/tool_source_alignment.json` - tool-source-alignment
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/agent_swarm_alignment.json` - agent-swarm-alignment
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/gate_extracts.json` - gate-proof
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/summary.json` - summary
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/scores.json` - scores
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/artifact_hashes.json` - artifact-hashes
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/forensic_report.md` - forensic-report-md
- `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/forensic_report.html` - forensic-report-html

## Atomic Findings

| Claim | Status | Evidence | Artifact | SHA-256 | Map Anchor |
| --- | --- | --- | --- | --- | --- |
| Bridge tool inventory is governed and discoverable. | pass | bridge declared=130, exposedMcp=39 | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/native_mcp_evidence.json` | `a224ead2489c...` |  |
| Auth, metrics, SSE, Streamable HTTP, and admin tools are live. | pass | metrics=200, sse=text/event-stream, transport=streamable-http, adminTools=38 | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/streamable_http_transcript.json` | `2c1d58978161...` |  |
| Unauthenticated access is denied. | pass | unauthMetricsDenied=true, unauthMcpDenied=true | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/native_mcp_evidence.json` | `a224ead2489c...` |  |
| Active skill filtering and RBAC are enforced. | pass | bootstrap=true, securityWriteDenied=true | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/native_mcp_evidence.json` | `a224ead2489c...` |  |
| Project-agnostic MCP resources are listed and readable. | pass | genericPresent=true, genericUris=5, reads=5 | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/mcp_resources.json` | `8a646d19b745...` |  |
| Every declared bridge tool has a governed runtime source anchor. | pass | tools=130, runtimeAnchored=130, sourceMapDirect=33 | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/tool_source_alignment.json` | `0e2c2371c8ec...` | package/cli.js.map |
| All skills and required swarm tools are governed, GPS-aligned, and bridge-compatible. | pass | skills=32, gps=32, swarmAnchored=9/9 | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/agent_swarm_alignment.json` | `2d1efc459e15...` | package/cli.js.map |
| SourceMap/GPS metadata is complete and map tools are aligned. | pass | sources=4756, sourcesContent=4756, decoder=pass | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/source_map_tool_proofs.json` | `bc9cc8c1e0dd...` | package/cli.js:8:1924 -> ../node_modules/lodash-es/_listCacheClear.js:8:0 |
| Live UI proof exists as runtime evidence, not only static topology. | pass | liveUiGate=pass | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/gate_extracts.json` | `0dac1d324fd2...` |  |
| Vitest completed with a clean process exit. | pass | vitest=pass, exitCode=0 | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/vitest_after.log` | `a674ca478c81...` |  |
| Swarm and agent lane is available and proven by the gate. | pass | swarmDryRun=true, coordinator=true, agent=true | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/native_mcp_evidence.json` | `a224ead2489c...` |  |
| Artifact discipline is complete. | pass | logged=22/22, hashesMatch=true | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/artifact_hashes.json` | `a14081a83092...` |  |
| Final certification summary is present. | pass | score=100, status=CERTIFIED_100 | `reports/mcp-tools-100/2026-06-13T03-45-04-773Z/summary.json` | `dd16def3564b...` |  |

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

- No pending certification lane reported by this gate.
