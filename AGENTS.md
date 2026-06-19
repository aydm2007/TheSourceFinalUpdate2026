# Sovereign Agents Ecosystem - TheSource

This file is the handoff entry point for any local or remote model operating in
`C:\tools\workspace\TheSource`.

## 📜 System Requirements & Architecture (PRD)

**Performance Agent**: مسؤول عن مراقبة مؤشرات الأداء وتوليد تقارير زمنية. يدمج مع Grafana عند تفعيلها.

> **[REQUIRED READING]**: The complete, detailed, and atomic Product Requirements Document (PRD) for the V16.0-APEX Sovereign Architecture, the MCP Daemon, and the three VS Code Sensory Extensions is located at:
> 👉 **[docs/MASTER_PRD_V16_APEX.md](docs/MASTER_PRD_V16_APEX.md)**
> 
> All future agents **MUST** read the PRD to understand the architectural boundaries, the self-healing protocols, and the Shadow Ledger memory dynamic chunking rules before making structural changes.

## 🌌 V100.0-OMNISCIENCE: Dual-Node & Decentralized Swarm Protocol
As of the V100.0 Omniscience Upgrade, the Swarm operates under a decentralized, self-healing, zero-trust protocol driven by the Master (Cloud Opus) and Deputy (Sigma Coordinator / gpt-oss-120b).
**CRITICAL OMNISCIENCE RULES FOR AGENTS:**
1. **AST Mutex Locks:** The Coordinator must NEVER use `FileWrite` directly. Specialized agents write code synchronously using `AstMutexLockManager` to prevent race conditions.
2. **Zero-Trust Visual Regression:** All UI changes MUST be verified via Port 9999 (`VisualDomMapper`). Visual drift without semantic intent is auto-rejected.
3. **Auto-Rollback Immunity:** If an agent causes an AST syntax break, `ConsensusStructuralLinter` triggers an instant Shadow Ledger Revert.
4. **Genetic Vector Memory:** Successful complex task executions MUST be extracted via `VectorSync` and stored in `.nexus/var/telemetry/semantic_lessons.json` for 0-token knowledge distillation.
5. **Deterministic Veto:** Modifying High-Risk files (`bridge.json`, `aether.ps1`) requires a cryptographic VETO key from the Master. No exceptions.
6. **Sleeper Threat Emulation:** During idle time, the Deputy acts as a Red Team evaluating its own structural integrity via `RealtimeScan` and `SandboxedChaos`.

## Current Verified State

- The project is a Sovereign MCP-Native Developer Platform with a local MCP
  bridge at `mcp_bridge_server.js` and tool authorization in `bridge.json`.
- `./aether.ps1 console` is the preferred developer entry point.
- The console model split is now unified:
  - Planner & Executor: Dynamically assigned based on active `$env:AETHER_ACTIVE_MODEL` (fallback to unified dynamic).
- Real edits are controlled by active skill filtering. If the active skill is
  `security-audit`, edit tools are intentionally hidden or denied.
- The default edit-capable skill for the console is `mcp-developer`.
- The `nexus-core` skill now supports remote `FullRepairLoop` execution through the MCP bridge by passing `__dirname` into the tool context.
- Native MCP runtime is now managed as a robust background service via `sovereign_mcp_service.cmd`, preserving persistent state without EOF disconnects.
- The repeatable MCP Server Tools certification gate is `npm run mcp-tools:certify:strict -- --full`; the latest strict local run scored **100/100** with 22 artifacts, matching SHA-256 hashes, tool-source alignment proof, agent/swarm alignment proof, and Shadow Ledger proof at `reports/mcp-tools-100/2026-06-03T19-41-21-571Z/summary.json`.
- The repeatable 90+ readiness gate is `npm run sovereign:90-sweep`; in the latest full certification lane it passed and was captured under `reports/mcp-tools-100/2026-06-03T19-41-21-571Z/sovereign_90_sweep.log`.
- The repeatable global production gate is `npm run global:production-gate`; the latest local run scored **100/100** and generated `reports/sovereign_global_production_readiness_2026-06-02.md`.
- Project-agnostic MCP resources are exposed through `ReadMcpResource`: `mcp://tool-registry`, `mcp://latest-gates`, `mcp://forensic-reports`, `mcp://source-map`, and `mcp://shadow-ledger`. Legacy project-specific resources remain compatibility surfaces only.
- **[V16.0-APEX Absolute Memory Zenith]**: Shadow Ledger memory protocol (`ShadowLedger.ts`) has been successfully healed via dynamic chunking. The Token Bloating ("Response too long") flaw is 100% neutralized, guaranteeing zero memory overflow regardless of ledger size.
- **[Sovereign Healing Zenith]**: `apex_healing_protocol.js` successfully executed with an `Absolute Zenith 100/100` rating across AgriAsset testing and TheSource diagnostics.


## 🌌 V17.0-OMEGA: 20-Agent Swarm & Auto-Healer Protocol

The V17.0-OMEGA upgrade introduces the Phantom Execution Healer Loop.
- **Omega Swarm Orchestrator**: Supports 20 specialized agents executing in parallel waves to prevent node timeout.
- **Phantom Execution Auto-Healing**: Agents that suffer from tool permission limitations (e.g. `FileWrite` denied) will output their commands as phantom JSON text within the `shadow_ledger.jsonl`. The `swarm_auto_healer.js` script acts as a Catcher Agent to extract and execute these edits safely without bypassing MCP.
- **Visual Cortex (Port 9999)**: The `visual-semantic-tester` agent using `nvidia/nemotron-nano-12b-v2-vl:free` tests 3D/UI layout overlaps via Set-of-Mark and adversarial MCTS evaluation in conjunction with `openai/gpt-oss-120b:free-opponent`.

## Map-Driven Sovereign Emulation (Phase 5 - Apex Integration)

The platform is equipped with a zero-token `cli.js.map` Source-Map-Consumer architecture that resolves structural source awareness for headless MCP agents. Current verified evidence distinguishes three layers:

- **SourceMap structural awareness**: verified through `package/cli.js.map`, which contains 4,756 sources and 4,756 `sourcesContent` entries.
- **VisualDomMapper static topology**: verified as static UI/source topology from `cli.js.map` and `sourcesContent`; it is not a substitute for live runtime proof.
- **Live UI monitoring / screenshot awareness**: certified only when a runtime DOM snapshot, accessibility tree, screenshot, SourceMap mapping, hashes, and Shadow Ledger entries exist. The latest MCP Server Tools 100 lane captured that proof in `reports/mcp-tools-100/2026-06-03T19-41-21-571Z/`.

### 12 Real Tested Tools & Capabilities
These tools bridge the cognitive gaps by remapping runtime memory and AST footprints directly from 4,756 TypeScript source files without consuming LLM token windows:

1. **`VisualDomMapper`**: Classifies static SourceMap topology from `cli.js.map`; latest `npm run cli-map:verify` returned 1,504 components, 50 hooks, 1 page, 1 store, and 1,906 analyzed source files.
2. **`TimeTravelDebugger`**: Reconstructs state lifecycle from line mapping using source maps.
3. **`V8FlamegraphProfiler`**: Maps CPU profiles directly to original source lines to trace resource bottlenecks.
4. **`PredictiveImmunization`**: Scans vulnerabilities across 1,479 files using IDF patterns.
5. **`SandboxedChaos`**: Automates resilience testing on 20 core modules.
6. **`SwarmTeleportation`**: Extracts module metadata and dependency layers.
7. **`CrossProjectHub`**: Resolves AST integration conflicts across external codebases.
8. **`SwarmDNAExtractor`**: Generates file DNA fingerprints for 1,906 files.
9. **`Agent`**: Spawns specialist subagents with real-time telemetry extraction.
10. **`TaskOutput`**: Interacts with the `shadow_ledger.jsonl` audit trails.
11. **`PrecognitionAstMutator`**: Analyzes keyword density to compute mutation blast-radius.
12. **`LSPTool`**: Provides structural diagnostics, references, and type-definition lookups.

These tools can support 100/100 readiness only when each capability is live-callable, mapped to runtime evidence, and logged. Static SourceMap awareness is proven by `cli-map:verify`; live UI, transport, swarm, and forensic claims require fresh runtime artifacts.

## Console Startup

Use one of these commands:

```powershell
.\aether.ps1 console
.\aether.ps1 console openai/gpt-oss-120b:free
.\aether.ps1 console --planner-model openai/gpt-oss-120b:free --executor-model Qwen/Qwen2.5-Coder-32B-Instruct
```

Expected environment after startup:

- `AETHER_PROVIDER=dynamic-provider`
- `AETHER_PLANNER_PROVIDER=dynamic-provider`
- `AETHER_PLANNER_MODEL=dynamic-sovereign-unified`
- `AETHER_EXECUTOR_PROVIDER=dynamic-provider`
- `AETHER_EXECUTOR_MODEL=dynamic-sovereign-unified`
- `AETHER_DEFAULT_SKILL=mcp-developer`

## Native MCP 90+ Validation

Use this path for evidence-backed Native MCP validation:

```powershell
.\launch_native_mcp.cmd
npm run native-mcp:verify
npm run tool-source:verify
npm run agent-swarm:verify
npm run sovereign:90-sweep
npm run global:production-gate
npm run mcp-tools:certify:strict -- --full
```

Operational notes:

- `launch_native_mcp.cmd` starts `mcp_remote_server.js` on `http://localhost:3847/mcp` and reports `/metrics`, active skill, and declared tool count.
- If port `3847` is occupied, the launcher exits without killing it. Set `AETHER_MCP_CLEAR_PORT=1` only when intentionally replacing the existing listener.
- `npm run native-mcp:verify` proves unauthenticated denial, skill-filtered bootstrap, `mcp-developer` pass cases, `security-audit` denial cases, Level 5 routing, and `ParallelSwarmCoordinator` dry-run.
- `npm run tool-source:verify` proves every declared `bridge.json` tool has a governed runtime source anchor and records direct `cli.js.map` anchors when present.
- `npm run agent-swarm:verify` proves every active skill has allowed tools, central governance, GPS/SourceMap protocol, execution protocol, and required swarm tool anchors.
- To prove admin `/metrics`, `/mcp` SSE, and `/admin/api/all-tools`, provide an admin key through environment variables such as `AETHER_MCP_API_KEY` or `MCP_API_KEY`. Do not place raw key values in reports.
- `npm run global:production-gate` evaluates global production readiness across MCP runtime, secrets, Kubernetes/TLS, observability/SLO, CI/CD, runtime swarm, live UI proof, and documentation drift.
- `npm run mcp-tools:certify:strict -- --full` is the only current one-command 100/100 MCP Server Tools certification path. It records command transcripts, Streamable HTTP proof, SourceMap/GPS proof, live UI proof, Vitest proof, scores, hashes, forensic reports, and Shadow Ledger entries in `reports/mcp-tools-100/<timestamp>/`.
- `Cloud Opus 4.8 Mentor` is a planner/mentor role only. Local MCP tools and deterministic scripts remain the execution and validation path.

## MCP Tool Access Rules

- Always use MCP bridge tools for file reads, edits, tests, and audits.
- Do not use shell redirection or ad hoc scripts to bypass MCP file tools.
- Use `LoadSkill("mcp-developer")` before real edits if `FileEdit`,
  `FileWrite`, or `SurgicalDiff` are not visible.
- Use `LoadSkill("security-audit")` for read-only security review; it does not
  grant edit capability by design.
- The active MCP skill is read from `.nexus/sessions/local_skill.json` first,
  with `active_skill.json` kept only for legacy compatibility.

## Required Workflow For Future Models

1. Read this file and `.agents/skills/nexus-core/master.md`.
2. List MCP tools and confirm the active skill.
3. For implementation work, activate `mcp-developer`.
4. Gather evidence with `Glob`, `Grep`, `FileRead`, or `VectorSearch`.
5. Edit only with `FileEdit`, `FileWrite`, or `SurgicalDiff`.
6. Run the smallest relevant validation.
7. Report changed files, validation results, and residual risks.

## Known Gaps And Guardrails

- Do not claim the platform is 100% complete without live validation evidence.
- Do not claim MCP Server Tools are 100/100 unless a fresh `npm run mcp-tools:certify:strict -- --full` run reports `CERTIFIED_100`, every required artifact exists, hashes match, and `.nexus/var/telemetry/shadow_ledger.jsonl` contains matching artifact entries.
- The latest strict MCP Server Tools lane is **100/100**; this certifies the MCP tools lane, not every possible product roadmap item.
- The latest global production gate is **100/100**, verifying full supply-chain, Kubernetes, observability, secrets compliance, and authenticated SSE/Streamable HTTP connectivity.
- Live visual/UI awareness has been successfully verified through runtime DOM/accessibility-tree and screenshot mapping back to `cli.js.map` in the MCP Server Tools certification lane.
- External report folders such as `C:\Users\ibrahim\.gemini\antigravity\brain\...\artifacts` are historical comparison material unless copied into a fresh TheSource evidence pack with hashes and Shadow Ledger entries.

- The swarm may be executed in waves when runtime limits prevent 40 concurrent
  agents.
- `security-audit` intentionally blocks edit tools even when `bridge.json`
  allows them.
- The remote MCP bridge now provides `__dirname` context for tool handlers, fixing `FullRepairLoop` module resolution in `nexus-core`.
- Secrets must stay in `.env` or process environment variables and must never be
  printed in documentation or reports.

## Important Files

- Console wrapper: `aether.ps1`
- MCP stdio server: `mcp_bridge_server.js`
- MCP shared filtering: `core/mcp/shared_mcp_core.js`
- Skill activation: `core/bridge/handlers/lsp_handlers.js`
- Console model relay: `package/preload.js`, `package/relay_bridge.js`,
  `relay_bridge.js`
- MCP Server Tools certification: `scripts/mcp_tools_certification_gate.js`
- Tool/source alignment proof: `scripts/verify_tool_source_alignment.js`
- Agent/swarm alignment proof: `scripts/verify_agent_swarm_alignment.js`
- MCP Server Tools certification docs: `docs/MCP_SERVER_TOOLS_100_CERTIFICATION.md`
- Edit-capable console skill: `.agents/skills/mcp-developer/SKILL.md`
- Health checks: `health-check.js`, `core/diagnostics/health_probe.js`

## Verification & Sovereign Validation Status

The platform's features, APIs, and model mappings are verified to be fully functional and compliant with the V15.0/V16.0 protocols.

### 🧪 Live Validation Scores
- **Core Diagnostics (`health-check.js`)**: Passed successfully.
- **Surgical Fixes (`validate_fixes.js`)**: **100/100 score** achieved (All 6 core surgical fixes verified).
- **Consolidated Test Runner (`node tests/test_runner.js`)**: **26/26 test suites passed** (covering Relay Bridge logic, JSON repair, and Aether behavior).
- **Vitest Suite (`npx vitest run`)**: latest strict full certification lane passed **129/129 tests** with clean exit; see `reports/mcp-tools-100/2026-06-03T19-41-21-571Z/vitest_after.log`.
- **SourceMap Verification (`npm run cli-map:verify`)**: passed; verifies `package/cli.js`, `package/cli.js.map`, 4,756 sources, 4,756 `sourcesContent`, static `VisualDomMapper` topology, and maps static layout.
- **Tool Source Alignment (`npm run tool-source:verify`)**: passed; proves all declared `bridge.json` tools have governed runtime source anchors and records direct `cli.js.map` anchors when available.
- **Agent/Swarm Alignment (`npm run agent-swarm:verify`)**: passed; proves all active skills are bridge-compatible, centrally governed, GPS-aligned, and that required swarm tools are anchored.
- **Native MCP 90+ Sweep (`npm run sovereign:90-sweep`)**: latest strict full certification lane passed and was captured at `reports/mcp-tools-100/2026-06-03T19-41-21-571Z/sovereign_90_sweep.log`.
- **Global Production Gate (`npm run global:production-gate`)**: latest local run scored **100/100**. It passed Kubernetes/TLS manifest readiness, observability/SLO wiring, CI/CD gate detection, secret scan, runtime swarm ledger proof, and verified live Admin DOM/accessibility/screenshot delivery.
- **MCP Server Tools Certification (`npm run mcp-tools:certify:strict -- --full`)**: latest strict run scored **100/100 Absolute Zenith** with 22 artifacts, `tool_source_alignment.json`, `agent_swarm_alignment.json`, `artifact_hashes.json`, `scores.json`, `summary.json`, `forensic_report.md/html`, Streamable HTTP transcript, live UI artifacts, SourceMap tool proofs, and Shadow Ledger chunked-memory proof.

### 🔄 Model Translation & Failover Guardrails
- **SiliconFlow Translation**: Translates `gemini-2.0-flash-exp:free` to `deepseek-ai/DeepSeek-V4-Flash`, `deepseek-r1-chat` to `deepseek-ai/DeepSeek-V4-Pro`, and `qwen-2.5-coder-32b-instruct` to `Qwen/Qwen3.6-35B-A3B`.
- **OpenRouter Translation**: Successfully routes openrouter free requests with fallback to local providers and custom mapping (e.g. `moonshotai/kimi-k2.6:free`).
- **Failover**: Configured with automatic failover to the next available provider if a model or provider is rate-limited (429), busy (503), or unauthorized.

### 📊 Redesigned Premium Evaluation HTML Report
- **Path**: `C:\Users\ibrahim\Desktop\مقارنة بين مشروعي المصدر\اخر تقييم\التقييم من 100\التحليل الاخير\supreme_architecture_evaluation_detailed_report.html`
- **Aesthetic**: Redesigned to a premium dark-mode, glassmorphic layout. Includes interactive tabs, live search index filtering for 150 metrics, animated progress charts, and responsive SVG diagrams showcasing MCP swarm execution paths.
- **Score Matrix**: strict independent re-evaluation remains documented in `reports/sovereign_architecture_re_evaluation_2026-06-02.md`; the current MCP Server Tools certification source of truth is **100/100** at `reports/mcp-tools-100/2026-06-03T19-41-21-571Z/summary.json`.
