import { z } from 'zod/v4'
import { McpServerStatusSchema } from './coreSchemas.js'

/** @internal */
export type McpServerStatus = z.infer<ReturnType<typeof McpServerStatusSchema>>

/** @internal */
export type ToolDefinition = {
  name: string
  description: string
  inputSchema: any
}
