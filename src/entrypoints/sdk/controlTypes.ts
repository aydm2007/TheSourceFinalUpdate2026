import { z } from 'zod/v4'
import {
  SDKControlRequestSchema,
  SDKControlResponseSchema,
} from './controlSchemas.js'

/** @alpha */
export type SDKControlRequest = z.infer<ReturnType<typeof SDKControlRequestSchema>>
/** @alpha */
export type SDKControlResponse = z.infer<ReturnType<typeof SDKControlResponseSchema>>
