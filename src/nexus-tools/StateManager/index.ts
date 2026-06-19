/**
 * StateManagerTool — Sovereign Sigma V12.0
 *
 * Provides read/write access to the Nexus Engine's runtime AppState
 * from within sub-agents and tools. Allows agents to inspect permission
 * modes, feature flags, and session-scoped settings.
 */

import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { logForDebugging } from '../../utils/debug.js'

const inputSchema = z.object({
  action: z
    .enum(['read', 'set_permission_mode', 'read_usage'])
    .describe(
      '"read" returns key AppState fields. "set_permission_mode" updates the permission mode. "read_usage" returns current session metrics.',
    ),
  permissionMode: z
    .enum(['default', 'acceptEdits', 'bypassPermissions', 'plan', 'auto'])
    .optional()
    .describe('Target permission mode (for set_permission_mode action).'),
})

type InputSchema = typeof inputSchema
type Output = { data: string }

export const StateManagerTool = buildTool({
  name: 'NexusStateManager',
  async description() {
    return 'Inspect and manage Nexus Engine runtime state: permission modes, feature flags, and session metrics.'
  },
  inputSchema,
  maxResultSizeChars: 8_000,
  isConcurrencySafe() {
    return true
  },
  isReadOnly(input) {
    return (
      input.action === 'read' ||
      input.action === 'read_usage'
    )
  },
  async prompt() {
    return ''
  },
  userFacingName: () => 'NexusStateManager',
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
    return input.action
  },
  async call({ action, permissionMode }, { getAppState, setAppState, messages, queryTracking }) {
    logForDebugging(`[StateManager] action=${action}`)

    switch (action) {
      case 'read': {
        const state = getAppState()
        const lines = [
          `# Nexus Engine State Snapshot`,
          `**Permission Mode**: ${state.toolPermissionContext.mode}`,
          `**Bypass Available**: ${state.toolPermissionContext.isBypassPermissionsModeAvailable}`,
          `**Message Count**: ${messages.length}`,
          `**Query Depth**: ${queryTracking?.depth ?? 0}`,
          `**Fast Mode**: ${state.fastMode ?? 'default'}`,
          `**Active Agent Tasks**: ${Object.keys(state.todos ?? {}).length}`,
        ]
        return { data: lines.join('\n') }
      }

      case 'set_permission_mode': {
        if (!permissionMode) {
          return { data: '❌ set_permission_mode requires the permissionMode field.' }
        }
        setAppState(prev => ({
          ...prev,
          toolPermissionContext: {
            ...prev.toolPermissionContext,
            mode: permissionMode,
          },
        }))
        return {
          data: `✅ Permission mode updated to: **${permissionMode}**`,
        }
      }

      case 'read_usage': {
        const state = getAppState()
        const lines = [
          `# Session Usage`,
          `**Fast Mode**: ${state.fastMode ?? 'default'}`,
          `**Active Agent Tasks**: ${Object.keys(state.todos ?? {}).length}`,
          `**Query Depth**: ${queryTracking?.depth ?? 0}`,
        ]
        return { data: lines.join('\n') }
      }

      default:
        return { data: `❌ Unknown action: ${String(action)}` }
    }
  },
} satisfies ToolDef<InputSchema, Output>)
