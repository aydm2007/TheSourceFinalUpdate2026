import { loadBridgeConfig } from '../../utils/bridgeValidator.ts';
import { describe, it, expect } from 'vitest';

describe('Bridge Sovereignty Test', () => {
  it('should load and validate bridge.json successfully', async () => {
    const config = await loadBridgeConfig();
    expect(config.bridgeVersion).toBe('1.0.0');
    expect(config.allowed_tools).toContain('FileRead');
  });
});
