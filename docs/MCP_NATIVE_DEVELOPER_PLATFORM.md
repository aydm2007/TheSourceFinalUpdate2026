# MCP-Native Developer Platform

## Purpose

TheSource console runs a two-model developer loop:

- Planner: `openai/gpt-oss-120b:free` on OpenRouter.
- Executor: `Qwen/Qwen2.5-Coder-32B-Instruct` on SiliconFlow.

The planner reasons and decomposes. The executor handles MCP tool calls and
physical edits when tools are present.

## Console Commands

```powershell
.\aether.ps1 console
.\aether.ps1 console openai/gpt-oss-120b:free
.\aether.ps1 console --planner-model openai/gpt-oss-120b:free --executor-model Qwen/Qwen2.5-Coder-32B-Instruct
```

`openai/gpt-oss-120b:fre` is corrected to `openai/gpt-oss-120b:free` by the
wrapper because the missing final `e` prevents OpenRouter routing.

## Required Environment

Use environment variables or `.env`; never hardcode keys:

```text
OPENROUTER_API_KEY=...
SILICONFLOW_KEYS=...
AETHER_PLANNER_PROVIDER=openrouter
AETHER_PLANNER_MODEL=openai/gpt-oss-120b:free
AETHER_EXECUTOR_PROVIDER=siliconflow
AETHER_EXECUTOR_MODEL=Qwen/Qwen2.5-Coder-32B-Instruct
AETHER_DEFAULT_SKILL=mcp-developer
```

## MCP Edit Enablement

The MCP server filters tools by active skill. For real edits, the active skill
must be `mcp-developer` or another skill that explicitly allows edit tools.

Expected flow:

1. Start `.\aether.ps1 console`.
2. Confirm the console prints planner, executor, and default skill.
3. List MCP tools.
4. If edit tools are hidden, call `LoadSkill` with `mcp-developer`.
5. Use `FileEdit`, `FileWrite`, or `SurgicalDiff` for edits.
6. Run validation and report changed files.

If the active skill is `security-audit`, `FileEdit`, `FileWrite`, and
`SurgicalDiff` are blocked by design.

## Provider Routing

`package/preload.js` sends requests with tool schemas to:

- `provider=siliconflow`
- `model=Qwen/Qwen2.5-Coder-32B-Instruct`

Requests without tools use:

- `provider=openrouter`
- `model=openai/gpt-oss-120b:free`

Both `relay_bridge.js` and `package/relay_bridge.js` accept a per-request
`provider` parameter so the Qwen executor is not accidentally routed to
OpenRouter just because its model id contains `qwen/`.

## Validation Checklist

Run:

```powershell
node tests/test_relay_bridge.js
npm run health:check
node scripts/audit_skills_docs.js
```

Acceptance criteria:

- OpenRouter is selected for the planner.
- SiliconFlow is selected for tool execution.
- `mcp-developer` exposes edit tools.
- `security-audit` still blocks edit tools.
- Health checks use `.nexus/var/telemetry/shadow_ledger.jsonl` and
  `config/database.db`.
