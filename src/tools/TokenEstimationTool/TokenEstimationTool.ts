import { z } from 'zod/v4'
import { buildTool } from '../../Tool.js'
import { countMessagesTokensWithAPI, roughTokenCountEstimationForMessages } from '../../services/tokenEstimation.js'

export const TokenEstimationTool = buildTool({
  name: 'TokenEstimation',
  searchHint: 'estimate token count of messages or text',
  inputSchema: z.object({
    text: z.string().optional().describe('Text to estimate tokens for'),
    includeHistory: z.boolean().optional().default(false).describe('Whether to include conversation history in the estimation'),
  }),
  async call({ text, includeHistory }, context) {
    let messages = []
    if (includeHistory) {
      messages = context.messages
    }
    if (text) {
      messages.push({ role: 'user', content: text })
    }

    if (messages.length === 0) {
      return {
        data: {
          totalTokens: 0,
          method: 'none',
        },
      }
    }

    // Try API count first
    const apiCount = await countMessagesTokensWithAPI(messages as any, context.options.tools as any)
    if (apiCount !== null) {
      return {
        data: {
          totalTokens: apiCount,
          method: 'api',
        },
      }
    }

    // Fallback to rough estimation
    const roughCount = roughTokenCountEstimationForMessages(messages as any)
    return {
      data: {
        totalTokens: roughCount,
        method: 'rough_estimation',
      },
    }
  },
  async description({ text, includeHistory }) {
    return `Estimating tokens for ${includeHistory ? 'history' : ''}${text ? (includeHistory ? ' and ' : '') + 'provided text' : ''}`
  },
  async prompt() {
    return 'Estimate the number of tokens in the conversation history or a given string. This helps in managing context limits and predicting costs.'
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  maxResultSizeChars: 1000,
  renderToolUseMessage({ includeHistory, text }) {
    return `TokenEstimation(${includeHistory ? 'history=true' : ''}${text ? (includeHistory ? ', ' : '') + 'text=...' : ''})`
  },
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    return {
      type: 'tool_result',
      tool_use_id: toolUseID,
      content: `Estimated total tokens: ${content.totalTokens} (calculated via ${content.method})`,
    }
  },
})
