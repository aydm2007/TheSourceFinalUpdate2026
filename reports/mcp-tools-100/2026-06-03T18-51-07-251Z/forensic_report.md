# MCP Server Tools 100 Certification Report

Generated: 2026-06-03T18:51:58.699Z
Run ID: 2026-06-03T18-51-07-251Z

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

- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/environment.json` - environment
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/test_mcp_integration.log` - command-log
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/cli_map_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/native_mcp_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/global_production_gate.log` - command-log
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/sovereign_90_sweep.log` - command-log
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/live_ui_verify.log` - command-log
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/vitest_after.log` - command-log
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/mcp_resources.json` - mcp-resources
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/streamable_http_transcript.json` - transport-proof
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/native_mcp_evidence.json` - native-mcp-proof
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/source_map_tool_proofs.json` - source-map-proof
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/gate_extracts.json` - gate-proof
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/summary.json` - summary
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/scores.json` - scores
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/artifact_hashes.json` - artifact-hashes
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/forensic_report.md` - forensic-report-md
- `reports/mcp-tools-100/2026-06-03T18-51-07-251Z/forensic_report.html` - forensic-report-html

## Map Anchors

- Generated: {"file":"package/cli.js","line":8,"column":1924}
- Original: {"source":"../node_modules/lodash-es/_listCacheClear.js","line":8,"column":0,"name":"sample"}

## Gate Status

- testMcpIntegration: pass
- cliMap: pass
- nativeMcp: pass
- globalProductionGate: pass
- sovereign90Sweep: pass
- liveUi: pass
- vitest: pass

## Remaining Risk

- No pending certification lane reported by this gate.
