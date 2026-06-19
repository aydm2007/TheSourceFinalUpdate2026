# MCP Server Tools 100 Certification Report

Generated: 2026-06-13T03:39:07.706Z
Run ID: 2026-06-13T03-38-04-315Z

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

- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/environment.json` - environment
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/test_mcp_integration.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/cli_map_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/tool_source_alignment.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/agent_swarm_alignment.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/native_mcp_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/global_production_gate.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/sovereign_90_sweep.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/live_ui_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/vitest_after.log` - command-log
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/mcp_resources.json` - mcp-resources
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/streamable_http_transcript.json` - transport-proof
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/native_mcp_evidence.json` - native-mcp-proof
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/source_map_tool_proofs.json` - source-map-proof
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/tool_source_alignment.json` - tool-source-alignment
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/agent_swarm_alignment.json` - agent-swarm-alignment
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/gate_extracts.json` - gate-proof
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/summary.json` - summary
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/scores.json` - scores
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/artifact_hashes.json` - artifact-hashes
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/forensic_report.md` - forensic-report-md
- `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/forensic_report.html` - forensic-report-html

## Atomic Findings

| Claim | Status | Evidence | Artifact | SHA-256 | Map Anchor |
| --- | --- | --- | --- | --- | --- |
| Bridge tool inventory is governed and discoverable. | pass | bridge declared=130, exposedMcp=39 | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/native_mcp_evidence.json` | `a118affe5e55...` |  |
| Auth, metrics, SSE, Streamable HTTP, and admin tools are live. | pass | metrics=200, sse=text/event-stream, transport=streamable-http, adminTools=38 | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/streamable_http_transcript.json` | `9c7ac31667cc...` |  |
| Unauthenticated access is denied. | pass | unauthMetricsDenied=true, unauthMcpDenied=true | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/native_mcp_evidence.json` | `a118affe5e55...` |  |
| Active skill filtering and RBAC are enforced. | pass | bootstrap=true, securityWriteDenied=true | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/native_mcp_evidence.json` | `a118affe5e55...` |  |
| Project-agnostic MCP resources are listed and readable. | pass | genericPresent=true, genericUris=5, reads=5 | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/mcp_resources.json` | `dd5b94d6dbac...` |  |
| Every declared bridge tool has a governed runtime source anchor. | pass | tools=130, runtimeAnchored=130, sourceMapDirect=33 | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/tool_source_alignment.json` | `ba1cfb66af1d...` | package/cli.js.map |
| All skills and required swarm tools are governed, GPS-aligned, and bridge-compatible. | pass | skills=32, gps=32, swarmAnchored=9/9 | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/agent_swarm_alignment.json` | `fda79e3f05a9...` | package/cli.js.map |
| SourceMap/GPS metadata is complete and map tools are aligned. | pass | sources=4756, sourcesContent=4756, decoder=pass | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/source_map_tool_proofs.json` | `e190244c2ce4...` | package/cli.js:8:1924 -> ../node_modules/lodash-es/_listCacheClear.js:8:0 |
| Live UI proof exists as runtime evidence, not only static topology. | pass | liveUiGate=pass | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/gate_extracts.json` | `e71751a09b86...` |  |
| Vitest completed with a clean process exit. | pass | vitest=pass, exitCode=0 | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/vitest_after.log` | `d1c7d54cc130...` |  |
| Swarm and agent lane is available and proven by the gate. | pass | swarmDryRun=true, coordinator=true, agent=true | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/native_mcp_evidence.json` | `a118affe5e55...` |  |
| Artifact discipline is complete. | pass | logged=22/22, hashesMatch=true | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/artifact_hashes.json` | `cbdffc2760e4...` |  |
| Final certification summary is present. | pass | score=100, status=CERTIFIED_100 | `reports/mcp-tools-100/2026-06-13T03-38-04-315Z/summary.json` | `d6b58589f623...` |  |

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
