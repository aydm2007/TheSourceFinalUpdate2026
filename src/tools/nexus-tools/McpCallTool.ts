import { z } from 'zod/v4'
import { buildTool } from '../../Tool.js'

const inputSchema = z.strictObject({
  server_name: z.string().describe('The target MCP server name'),
  tool_name: z.string().describe('The name of the tool on the MCP server to invoke'),
  arguments: z.record(z.any()).describe('The key-value arguments for the target MCP tool'),
})

type InputSchema = typeof inputSchema
type Input = z.infer<InputSchema>

export const McpCallTool = buildTool({
  name: 'McpCall',
  searchHint: 'execute invocation hook for external Model Context Protocol adapters and third-party custom local databases',
  maxResultSizeChars: 100000,
  strict: true,
  async description() {
    return 'The execution invocation hook for external Model Context Protocol adapters. Critical to link third-party custom local database extensions.'
  },
  async prompt() {
    return 'Use McpCall to invoke tools from external MCP servers that have been linked to the local agent workspace.'
  },
  get inputSchema(): InputSchema {
    return inputSchema
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return false
  },
  toAutoClassifierInput(input) {
    return `${input.server_name}/${input.tool_name}`
  },
  userFacingName() {
    return 'McpCall'
  },
  async call({ server_name, tool_name, arguments: args }, context) {
    try {
      // Find the MCP client by server name
      const mcpClient = context.options.mcpClients.find(
        (c: any) => c.name === server_name || c.serverName === server_name
      )

      if (!mcpClient) {
        return {
          data: {
            success: false,
            message: `MCP Server "${server_name}" is not currently connected. Connected servers: ${context.options.mcpClients.map((c: any) => c.name || c.serverName).join(', ') || 'none'}`
          }
        }
      }

      // Execute tool invocation on the MCP client
      const response = await mcpClient.callTool(tool_name, args)
      return {
        data: {
          success: true,
          response,
        }
      }
    } catch (err: any) {
      throw new Error(`Failed to invoke MCP tool "${server_name}/${tool_name}": ${err.message}`)
    }
  },
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: data.success
        ? `### MCP Tool Invocation Result\n\n\`\`\`json\n${JSON.stringify(data.response, null, 2)}\n\`\`\``
        : `### MCP Tool Invocation Failed\n\n${data.message}`,
    }
  },
  renderToolUseMessage(input) {
    return `Invoking MCP Tool: ${input.server_name}/${input.tool_name}`
  }
})
