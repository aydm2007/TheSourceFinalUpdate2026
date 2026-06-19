/**
 * MemoryManagerTool — Sovereign Sigma V12.0
 *
 * Manages agent memory lifecycle:
 *   - load:    Reads MEMORY.md for a given agentType and scope
 *   - status:  Reports current memory directory and entry counts
 *   - distill: Records a tool execution pattern into SEMANTIC_HISTORY.md
 */

import { existsSync, readdirSync } from 'fs'
import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import {
  distillToolPattern,
  getAgentMemoryDir,
  getAgentMemoryEntrypoint,
  loadAgentMemoryPrompt,
  type AgentMemoryScope,
} from '../../tools/AgentTool/agentMemory.js'
import { logForDebugging } from '../../utils/debug.js'

const inputSchema = z.object({
  action: z
    .enum(['load', 'status', 'distill'])
    .describe(
      '"load" returns the memory prompt, "status" reports directory info, "distill" records a pattern.',
    ),
  agentType: z.string().describe('Agent type whose memory to manage.'),
  scope: z
    .enum(['user', 'project', 'local'])
    .default('project')
    .describe('Memory scope. Defaults to project.'),
  // For distill action
  tool: z.string().optional().describe('Tool name (for distill action).'),
  pattern: z
    .string()
    .optional()
    .describe('Pattern description (for distill action).'),
  outcome: z
    .enum(['success', 'failure'])
    .optional()
    .describe('Tool outcome (for distill action).'),
})

type InputSchema = typeof inputSchema
type Output = { data: string }

export const MemoryManagerTool = buildTool({
  name: 'NexusMemoryManager',
  async description() {
    return 'Manage persistent agent memory: load MEMORY.md contents, check memory status, or distill a tool execution pattern into semantic history.'
  },
  inputSchema,
  maxResultSizeChars: 16_000,
  isConcurrencySafe() {
    return true
  },
  isReadOnly(input) {
    return input.action !== 'distill'
  },
  async prompt() {
    return ''
  },
  userFacingName: () => 'NexusMemoryManager',
  mapToolResultToToolResultBlockParam(content, toolUseId) {
    const text =
      typeof content === 'object' && 'data' in content
        ? String(content.data)
        : JSON.stringify(content, null, 2)
    return {
      type: 'tool_result' as const,
      tool_use_id: toolUseId,
      content: text,
    }
  },
  toAutoClassifierInput(input) {
    return `${input.action}:${input.agentType}`
  },
  async call({ action, agentType, scope, tool, pattern, outcome }) {
    const memScope = scope as AgentMemoryScope
    logForDebugging(
      `[MemoryManager] action=${action} agentType=${agentType} scope=${memScope}`,
    )

    switch (action) {
      case 'load': {
        const prompt = loadAgentMemoryPrompt(agentType, memScope)
        return {
          data: `# Memory Loaded (scope=${memScope})\n\n${prompt}`,
        }
      }

      case 'status': {
        const dir = getAgentMemoryDir(agentType, memScope)
        const entrypoint = getAgentMemoryEntrypoint(agentType, memScope)
        const dirExists = existsSync(dir)
        const memExists = existsSync(entrypoint)
        let fileCount = 0
        if (dirExists) {
          try {
            fileCount = readdirSync(dir).length
          } catch {
            fileCount = -1
          }
        }
        const lines = [
          `# MemoryManager Status`,
          `**Agent Type**: ${agentType}`,
          `**Scope**: ${memScope}`,
          `**Directory**: ${dir}`,
          `**Directory exists**: ${dirExists ? '✅ Yes' : '❌ No'}`,
          `**MEMORY.md exists**: ${memExists ? '✅ Yes' : '❌ No'}`,
          `**Files in dir**: ${fileCount >= 0 ? fileCount : 'Error reading dir'}`,
        ]
        return { data: lines.join('\n') }
      }

      case 'distill': {
        if (!tool || !pattern || !outcome) {
          return {
            data: '❌ distill action requires: tool, pattern, outcome fields.',
          }
        }
        await distillToolPattern(agentType, memScope, {
          tool,
          pattern,
          outcome,
          timestamp: new Date().toISOString(),
        })
        return {
          data: `✅ Pattern distilled into SEMANTIC_HISTORY.md\n- Tool: ${tool}\n- Outcome: ${outcome}\n- Pattern: ${pattern}`,
        }
      }

      default:
        return { data: `❌ Unknown action: ${String(action)}` }
    }
  },
} satisfies ToolDef<InputSchema, Output>)
