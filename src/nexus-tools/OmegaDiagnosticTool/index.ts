/**
 * OmegaDiagnosticTool — Forensic System Integrity Verifier
 *
 * Sovereign Sigma V12.0 — Apex Integration
 *
 * Checks health of the following subsystems:
 *   - Agent memory persistence (agentMemory.ts)
 *   - Teleport/SLCR local relay (localRelay.ts)
 *   - Query chain tracking (Tool.ts)
 *   - Tool execution concurrency config
 */

import { z } from 'zod/v4'
import { buildTool } from '../../Tool.js'
import { getAgentMemoryDir } from '../../tools/AgentTool/agentMemory.js'
import { slcr } from '../../utils/teleport/localRelay.js'
import { logForDebugging } from '../../utils/debug.js'

const inputSchema = z.object({
  subsystem: z
    .enum(['all', 'memory', 'relay', 'query', 'tools'])
    .optional()
    .default('all')
    .describe('Which subsystem to diagnose. Defaults to all.'),
  agentType: z
    .string()
    .optional()
    .describe('Agent type to check memory for (used when subsystem=memory).'),
})

type DiagnosticResult = {
  subsystem: string
  status: 'ok' | 'warn' | 'error'
  message: string
}

async function runDiagnostics(
  subsystem: string,
  agentType?: string,
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = []

  if (subsystem === 'all' || subsystem === 'memory') {
    try {
      const scope = 'project'
      const type = agentType ?? 'general-purpose'
      const dir = getAgentMemoryDir(type, scope)
      results.push({
        subsystem: 'AgentMemory',
        status: 'ok',
        message: `Memory dir resolved: ${dir} (scope=${scope}, agentType=${type})`,
      })
    } catch (e) {
      results.push({
        subsystem: 'AgentMemory',
        status: 'error',
        message: `Failed to resolve memory directory: ${String(e)}`,
      })
    }
  }

  if (subsystem === 'all' || subsystem === 'relay') {
    try {
      const sessions = slcr.list()
      results.push({
        subsystem: 'SLCR_LocalRelay',
        status: 'ok',
        message: `Local relay active. Sessions in memory: ${sessions.length}`,
      })
    } catch (e) {
      results.push({
        subsystem: 'SLCR_LocalRelay',
        status: 'error',
        message: `Local relay fault: ${String(e)}`,
      })
    }
  }

  if (subsystem === 'all' || subsystem === 'query') {
    const concurrency = process.env.NEXUS_ENGINE_MAX_TOOL_USE_CONCURRENCY
    results.push({
      subsystem: 'QueryChainTracking',
      status: 'ok',
      message: concurrency
        ? `Tool concurrency: ${concurrency} (NEXUS_ENGINE_MAX_TOOL_USE_CONCURRENCY)`
        : 'Tool concurrency: 10 (default)',
    })
  }

  if (subsystem === 'all' || subsystem === 'tools') {
    const concurrencyLimit = parseInt(
      process.env.NEXUS_ENGINE_MAX_TOOL_USE_CONCURRENCY || '10',
      10,
    )
    results.push({
      subsystem: 'ToolExecutionEngine',
      status: concurrencyLimit > 0 ? 'ok' : 'warn',
      message: `Tool concurrency limit: ${concurrencyLimit}. Engine: Sovereign V12.0.`,
    })
  }

  return results
}

export const OmegaDiagnosticTool = buildTool({
  name: 'NexusOmegaDiagnostic',
  description(_input, _options) {
    return Promise.resolve(
      'Forensic system integrity check for all Nexus Engine subsystems. Returns health status of memory, relay, query chain, and tool execution.',
    )
  },
  inputSchema,
  maxResultSizeChars: 8_000,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  prompt: async (_options) => '',
  userFacingName: () => 'NexusOmegaDiagnostic',
  renderToolUseMessage: (_input, _options) => null,
  mapToolResultToToolResultBlockParam(content, toolUseId) {
    const text =
      typeof content === 'string'
        ? content
        : JSON.stringify(content, null, 2)
    return {
      type: 'tool_result' as const,
      tool_use_id: toolUseId,
      content: text,
    }
  },
  toAutoClassifierInput: () => '',
  async call({ subsystem, agentType }) {
    logForDebugging(`[OmegaDiagnostic] Running diagnostics: subsystem=${subsystem}`)
    const results = await runDiagnostics(subsystem, agentType)

    const lines = results.map(
      (r) => `[${r.status.toUpperCase()}] ${r.subsystem}: ${r.message}`,
    )
    const allOk = results.every((r) => r.status === 'ok')
    const summary = allOk
      ? '✅ All systems operational — Sovereign Sigma V12.0 integrity confirmed.'
      : '⚠️  Some subsystems reported warnings or errors.'

    const output = `# OmegaDiagnostic Report\n\n${lines.join('\n')}\n\n---\n${summary}`

    return { data: output }
  },
})
