import * as fs from 'fs';
import * as path from 'path';
import { ZodError } from 'zod';
import { bridgeSchema } from '../schemas/bridgeSchemas';

export interface BridgeConfig {
  allowed_tools: string[];
  bridgeVersion: string;
}

/**
 * Load bridge.json and validate it using Zod.
 */
export async function loadBridgeConfig(): Promise<BridgeConfig> {
  const bridgePath = path.join(process.cwd(), '.agents', 'memory', 'telepathy', 'bridge.json');
  const raw = await fs.promises.readFile(bridgePath, 'utf-8');
  const parsed = bridgeSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    throw new ZodError(parsed.error.errors);
  }
  return parsed.data as BridgeConfig;
}

/**
 * Validate that a tool is allowed according to bridge.json and that the bridge version matches.
 */
export async function validateBridge(name: string): Promise<void> {
  const cfg = await loadBridgeConfig();

  // Verify bridge version consistency
  const runtimeVersion = process.env.BRIDGE_VERSION || '1.0.0';
  if (cfg.bridgeVersion !== runtimeVersion) {
    throw new Error(`🚧 Bridge version mismatch – cfg:${cfg.bridgeVersion} vs runtime:${runtimeVersion}`);
  }

  // Verify tool permission
  if (!cfg.allowed_tools.includes(name)) {
    throw new Error(`🚫 Tool "${name}" غير مسموح بها وفقاً ل bridge.json`);
  }
}
