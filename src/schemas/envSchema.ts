import { z } from 'zod';

export const envSchema = z.object({
  USER_TYPE: z.string().regex(/^ant$/),
  YOLO_MODE: z.string().optional(),
});
