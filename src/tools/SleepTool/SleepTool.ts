import { z } from 'zod/v4'
import { buildTool } from '../../Tool.js'
import { SLEEP_TOOL_NAME, DESCRIPTION, SLEEP_TOOL_PROMPT } from './prompt.js'

export const SleepTool = buildTool({
  name: SLEEP_TOOL_NAME,
  searchHint: 'wait for duration or rest',
  inputSchema: z.object({
    durationMs: z.number().describe('Duration to sleep in milliseconds'),
    reason: z.string().optional().describe('Reason for sleeping'),
  }),
  async call({ durationMs }, context) {
    const startTime = Date.now()
    
    // Create a promise that resolves after durationMs or when aborted
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, durationMs)
      context.abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    const actualDuration = Date.now() - startTime
    return {
      data: {
        waitedMs: actualDuration,
        requestedMs: durationMs,
        interrupted: context.abortController.signal.aborted,
      },
    }
  },
  async description({ durationMs, reason }) {
    return `Sleeping for ${durationMs}ms${reason ? ` (${reason})` : ''}`
  },
  async prompt() {
    return SLEEP_TOOL_PROMPT
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  maxResultSizeChars: 1000,
  renderToolUseMessage({ durationMs, reason }) {
    return `Sleep(${durationMs}ms${reason ? `, "${reason}"` : ''})`
  },
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: content.interrupted 
        ? `Sleep interrupted after ${content.waitedMs}ms.`
        : `Slept for ${content.waitedMs}ms.`,
    }
  },
})
