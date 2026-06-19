import { z } from 'zod';

// تعريف مخططات Zod لكل أداة مدعومة
export const toolSchemas = {
  FileRead: z.object({
    file_path: z.string(),
    encoding: z.string().default('utf-8'),
  }),
  FileWrite: z.object({
    file_path: z.string(),
    content: z.string(),
    encoding: z.string().default('utf-8'),
  }),
  FileEdit: z.object({
    file_path: z.string(),
    old_string: z.string(),
    new_string: z.string(),
  }),
  Bash: z.object({
    command: z.string(),
  }),
};

export const schemaMap = toolSchemas;
