import { z } from 'zod/v4'
import { SettingsSchema } from '../../utils/settings/types.js'

/** @alpha */
export type Settings = z.infer<ReturnType<typeof SettingsSchema>>
