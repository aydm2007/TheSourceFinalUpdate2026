import { describe, it, expect } from 'vitest';
import { executeTool } from '../LegacyToolDispatcher.js';

describe('BashTool Sovereign Integrity', () => {
  it('should execute command and return stdout', async () => {
    // Chaining commands since the mock uses independent child processes
    const result = await executeTool('Bash', { command: 'echo 100' });
    expect(result.stdout).toContain('100');
  });

  it('should handle stderr for non-existent commands', async () => {
    await expect(
      executeTool('Bash', { command: 'non_existent_command_sovereign_xyz' })
    ).rejects.toThrow();
  });
});
