# MCP Server Tools 100 Certification Report

Generated: 2026-06-03T18:43:25.048Z
Run ID: 2026-06-03T18-42-48-376Z

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

- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/environment.json` - environment, 918 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/test_mcp_integration.log` - command-log, 1835 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/cli_map_verify.log` - command-log, 1860 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/native_mcp_verify.log` - command-log, 3779 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/global_production_gate.log` - command-log, 818 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/sovereign_90_sweep.log` - command-log, 1753 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/live_ui_verify.log` - command-log, 1223 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/mcp_resources.json` - mcp-resources, 23509 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/streamable_http_transcript.json` - transport-proof, 247 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/native_mcp_evidence.json` - native-mcp-proof, 1856 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/source_map_tool_proofs.json` - source-map-proof, 3052 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/gate_extracts.json` - gate-proof, 11088 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/summary.json` - summary, 724 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/scores.json` - scores, 305 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/artifact_hashes.json` - artifact-hashes, 3947 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/forensic_report.md` - forensic-report-md, 2745 bytes
- `reports/mcp-tools-100/2026-06-03T18-42-48-376Z/forensic_report.html` - forensic-report-html, 3221 bytes

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
- vitest: skipped

## Remaining Risk

- No pending certification lane reported by this gate.
