import { z } from 'zod';

export const bridgeSchema = z.object({
  allowed_tools: z.array(z.string()),
  bridgeVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
});
