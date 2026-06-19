import { z } from 'zod/v4'
import {
  SDKMessageSchema,
  SDKResultMessageSchema,
  SDKSessionInfoSchema,
  SDKUserMessageSchema,
  ModelUsageSchema,
} from './coreSchemas.js'

/** @alpha */
export type SDKMessage = z.infer<ReturnType<typeof SDKMessageSchema>>
/** @alpha */
export type SDKResultMessage = z.infer<ReturnType<typeof SDKResultMessageSchema>>
/** @alpha */
export type SDKSessionInfo = z.infer<ReturnType<typeof SDKSessionInfoSchema>>
/** @alpha */
export type SDKUserMessage = z.infer<ReturnType<typeof SDKUserMessageSchema>>
/** @alpha */
export type ModelUsage = z.infer<ReturnType<typeof ModelUsageSchema>>
