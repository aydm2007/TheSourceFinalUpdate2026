# TheSource Global Production SLO

## Service Objectives

- MCP authenticated availability: 99.9% monthly.
- MCP tool-call p95 latency: 2 seconds for read-only tools, 10 seconds for bounded runtime tools.
- Error budget: 43.2 minutes per 30-day window.
- Security objective: zero critical/high dependency vulnerabilities at release time.

## Signals

- Metrics: Prometheus `/metrics` via authenticated scrape.
- Logs: Shadow Ledger JSONL plus platform log aggregation.
- Traces: OpenTelemetry OTLP exporter when configured.
- Readiness: Kubernetes exec probe against authenticated `/health`.

## Release Gates

- `npm run global:production-gate` must be at least 95/100 for staging.
- 100/100 requires authenticated MCP runtime proof, clean Vitest, live UI proof, and live swarm execution proof.
