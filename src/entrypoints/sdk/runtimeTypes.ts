import { z } from 'zod/v4'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'

/** @alpha */
export type AnyZodRawShape = z.ZodRawShape
/** @alpha */
export type InferShape<T extends AnyZodRawShape> = z.infer<z.ZodObject<T>>

/** @alpha */
export type ListSessionsOptions = {
  dir?: string
  limit?: number
  offset?: number
}

/** @alpha */
export type GetSessionInfoOptions = {
  dir?: string
}

/** @alpha */
export type SessionMutationOptions = {
  dir?: string
}

/** @alpha */
export type ForkSessionOptions = {
  dir?: string
  upToMessageId?: string
  title?: string
}

/** @alpha */
export type ForkSessionResult = {
  sessionId: string
}

/** @alpha */
export type GetSessionMessagesOptions = {
  dir?: string
}

/** @alpha */
export type InternalOptions = {
  dir: string
}

/** @alpha */
export type InternalQuery = {
  prompt: string
}

/** @alpha */
export type Options = {
  dir?: string
}

/** @alpha */
export type Query = {
  prompt: string
}

/** @alpha */
export type SDKSessionOptions = {
  dir: string
  apiKey?: string
  signal?: AbortSignal
}

/** @alpha */
export type SDKSession = {
  sessionId: string
}

/** @alpha */
export interface SdkMcpToolDefinition<Schema extends AnyZodRawShape> {
  name: string
  description: string
  inputSchema: Schema
  handler: (args: InferShape<Schema>, extra: unknown) => Promise<CallToolResult>
}

/** @alpha */
export type SessionMessage = {
  uuid: string
  role: string
  content: any
}

/** @alpha */
export type McpSdkServerConfigWithInstance = {
  name: string
}
