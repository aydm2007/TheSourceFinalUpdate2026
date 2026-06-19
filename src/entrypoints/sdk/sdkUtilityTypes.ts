// SDK Utility Types - Helper types for SDK builders.

/**
 * Extracts the usage type from a model response, ensuring it's not null.
 */
export type NonNullableUsage = {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens?: number
  cacheCreationInputTokens?: number
  webSearchRequests?: number
  costUSD?: number
}
