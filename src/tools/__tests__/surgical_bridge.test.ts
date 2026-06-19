import { describe, it, expect } from 'vitest';
const { executeTool } = require('../../../nexus_bridge.js');
import * as fs from 'fs';
import * as path from 'path';

describe('Surgical Bridge Physical Engine Tools', () => {
  it('should execute GraphMemorySync successfully', async () => {
    const files = [
      { path: 'src/main.ts', imports: ['src/utils.ts'] },
      { path: 'src/utils.ts', imports: [] }
    ];
    const resString = await executeTool('GraphMemorySync', { files });
    const res = JSON.parse(resString);
    expect(res.success).toBe(true);
    expect(res.graph['src/main.ts'].dependencies).toContain('src/utils.ts');
    expect(res.graph['src/utils.ts'].dependents).toContain('src/main.ts');
  });

  it('should execute RealtimeScan successfully', async () => {
    const testFile = path.resolve('scratch/test_scan_vuln.js');
    if (!fs.existsSync(path.dirname(testFile))) {
      fs.mkdirSync(path.dirname(testFile), { recursive: true });
    }
    fs.writeFileSync(testFile, 'const password = "123";', 'utf8');

    const resString = await executeTool('RealtimeScan', { file_path: testFile });
    const res = JSON.parse(resString);
    expect(res.safe).toBe(false);
    expect(res.findings.length).toBeGreaterThan(0);
    expect(res.findings[0].type).toBe('SENSITIVE_VARIABLE_NAMING');

    fs.unlinkSync(testFile);
  });

  it('should execute ASTAutoPatch successfully', async () => {
    const testFile = 'scratch/test_patch_ast.js';
    const testFileAbs = path.resolve(testFile);
    if (!fs.existsSync(path.dirname(testFileAbs))) {
      fs.mkdirSync(path.dirname(testFileAbs), { recursive: true });
    }
    fs.writeFileSync(testFileAbs, 'class Greeter { greet() { return "hello"; } }', 'utf8');

    // Register testFile in context store to bypass guardrail if needed
    const contextStorePath = path.resolve('scratch/agent_context_store.json');
    if (fs.existsSync(contextStorePath)) {
      try {
        const store = JSON.parse(fs.readFileSync(contextStorePath, 'utf8'));
        if (!store.readFiles) store.readFiles = [];
        if (!store.readFiles.includes(testFileAbs)) {
          store.readFiles.push(testFileAbs);
          fs.writeFileSync(contextStorePath, JSON.stringify(store));
        }
      } catch (e) {}
    }

    const resString = await executeTool('ASTAutoPatch', {
      file_path: testFile,
      class_name: 'Greeter',
      method_name: 'greet',
      patch_code: 'return "welcome";'
    });
    const res = JSON.parse(resString);
    expect(res.success).toBe(true);
    expect(res.blast.riskScore).toBe(0);

    fs.unlinkSync(testFileAbs);
  });

  it('should execute FullRepairLoop successfully', async () => {
    const ParallelTestRunner = require('../../../core/services/surgical_engine/ParallelTestRunner.js');
    const originalRunAll = ParallelTestRunner.prototype.runAll;
    ParallelTestRunner.prototype.runAll = async () => ({
      success: true,
      details: [{ name: 'MockSuite', success: true }]
    });

    try {
      const resString = await executeTool('FullRepairLoop', {
        workspace_root: process.cwd(),
        task_goal: 'Test full repair loop'
      });
      const res = JSON.parse(resString);
      expect(res.status).toBe('SUCCESS');
    } finally {
      ParallelTestRunner.prototype.runAll = originalRunAll;
    }
  });
});

