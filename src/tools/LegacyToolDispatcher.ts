import { schemaMap } from '../schemas/toolSchemas.ts';
import { preToolUse } from '../hooks/toolPermission/preToolUse.ts';
import { logToolUse } from '../utils/logToolUse.ts';
import { performance } from 'perf_hooks';
import { validateBridge } from '../utils/bridgeValidator.ts';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

type ToolImplementation = (args: any) => Promise<any>;

const implementations: Record<string, ToolImplementation> = {
  FileRead: async ({ file_path, encoding = 'utf-8' }) => {
    const content = await fs.readFile(file_path, { encoding });
    return { content };
  },
  FileWrite: async ({ file_path, content, encoding = 'utf-8' }) => {
    await fs.writeFile(file_path, content, { encoding });
    return { ok: true };
  },
  FileEdit: async ({ file_path, old_string, new_string }) => {
    const data = await fs.readFile(file_path, 'utf-8');
    const updatedData = data.replace(old_string, new_string);
    await fs.writeFile(file_path, updatedData, 'utf-8');
    return { ok: true };
  },
  Bash: async ({ command }) => {
    try {
      const { stdout, stderr } = await execPromise(command, { timeout: 30000, maxBuffer: 1024 * 1024 * 5 });
      return { stdout, stderr };
    } catch (err: unknown) {
      const error = err as Error & { stderr?: string };
      const errorMsg = error.stderr ? `Error: ${error.message}\nStderr: ${error.stderr}` : error.message;
      throw new Error(errorMsg);
    }
  },
};

export async function executeTool(name: string, args: any): Promise<any> {
  const schema = schemaMap[name];
  if (!schema) {
    throw new Error(`❌ Unknown tool: ${name}`);
  }

  const parsed = schema.safeParse(args);
  if (!parsed.success) {
    throw new Error(`🔧 Invalid arguments for ${name}: ${parsed.error.message}`);
  }

  await preToolUse(name, parsed.data);
  await validateBridge(name);

  const impl = implementations[name];
  if (!impl) {
    throw new Error(`🚧 No implementation for tool ${name}`);
  }

  const start = performance.now();
  let result;
  try {
    result = await impl(parsed.data);
    const durationMs = Math.round(performance.now() - start);
    await logToolUse(name, parsed.data, durationMs, 'success');
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - start);
    const error = err instanceof Error ? err.message : String(err);
    await logToolUse(name, { ...parsed.data, error }, durationMs, 'error');
    throw err;
  }

  return result;
}

// AETHER-APEX-V39-EVOLVED-STAMP: 1779243988654
