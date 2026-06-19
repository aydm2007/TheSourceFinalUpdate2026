import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const sharedMcp = require('../core/mcp/shared_mcp_core.js');
const swarmHandlers = require('../core/bridge/handlers/swarm_handlers.js');

function makeSkillRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'thesource-skill-'));
  fs.mkdirSync(path.join(root, '.agents', 'skills', 'mcp-developer'), { recursive: true });
  fs.mkdirSync(path.join(root, '.nexus', 'sessions'), { recursive: true });
  fs.writeFileSync(path.join(root, '.agents', 'skills', 'mcp-developer', 'SKILL.md'), [
    '---',
    'name: mcp-developer',
    'allowed-tools:',
    '  - FileRead',
    '  - FileEdit',
    '---',
    ''
  ].join('\n'));
  return root;
}

describe('MCP policy hardening', () => {
  it('falls back to legacy active_skill.json without statting a missing session file', () => {
    const root = makeSkillRoot();
    fs.writeFileSync(path.join(root, 'active_skill.json'), JSON.stringify({ activeSkill: 'mcp-developer' }));

    sharedMcp.invalidateSkillCache();
    const result = sharedMcp.getActiveSkillTools(root, 'local');

    expect(result.skillName).toBe('mcp-developer');
    expect(result.allowedTools).toContain('FileEdit');
  });

});

describe('Swarm wave coordinator', () => {
  it('plans 40 agents as five bounded waves of eight', async () => {
    const agents = Array.from({ length: 40 }, (_, index) => ({
      name: `agent-${index + 1}`,
      description: `Task ${index + 1}`
    }));
    const result = await swarmHandlers.ParallelSwarmCoordinator({
      agents,
      wave_size: 8,
      dry_run: true
    }, {
      logShadow: () => {}
    });

    const summary = JSON.parse(result);
    expect(summary.total_agents).toBe(40);
    expect(summary.wave_size).toBe(8);
    expect(summary.waves).toBe(5);
  });
});
