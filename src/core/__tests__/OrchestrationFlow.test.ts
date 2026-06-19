import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

import StateMachine from '../../state/StateMachine.js';
import { ComplianceMonitor } from '../ComplianceMonitor.js';
import { SkillGraph } from '../SkillGraph.js';
import SelfSustainingProtocol from '../self-sustaining.js';
import { ForensicReasoner } from '../ForensicReasoner.js';
import { CentralOrchestrator } from '../orchestrator.js';

import { runCleanupFunctions } from '../../utils/cleanupRegistry.js';

const sandboxDir = path.join(__dirname, 'temp_sandbox');

describe('Sovereign Core Orchestration Suite', () => {
  beforeAll(async () => {
    await fs.mkdir(sandboxDir, { recursive: true });
    // Write a dummy api_schema.json
    const registryDir = path.join(sandboxDir, 'registry');
    await fs.mkdir(registryDir, { recursive: true });
    await fs.writeFile(
      path.join(registryDir, 'api_schema.json'),
      JSON.stringify({ sync_required_fields: { version: 'string', signature: 'string' } }, null, 2),
      'utf-8'
    );
  });

  afterAll(async () => {
    await fs.rm(sandboxDir, { recursive: true, force: true });
    await runCleanupFunctions();
  });

  describe('StateMachine', () => {
    it('should transition through states and log them', () => {
      const sm = new StateMachine();
      expect(sm.getCurrentState()).toBe('STATE_INIT');
      sm.transition('STATE_1_DISCOVERY', { info: 'test' });
      expect(sm.getCurrentState()).toBe('STATE_1_DISCOVERY');
      const log = sm.getLog();
      expect(log.length).toBe(2);
      expect(log[1]).toContain('STATE_1_DISCOVERY');
    });
  });

  describe('ComplianceMonitor', () => {
    it('should approve compliant code', async () => {
      const monitor = new ComplianceMonitor(sandboxDir);
      const report = await monitor.verifyCompliance('src/services/UserService.ts', 'const a = 1;');
      expect(report.isCompliant).toBe(true);
      expect(report.violations.length).toBe(0);
    });

    it('should reject FloatField in serializer/models', async () => {
      const monitor = new ComplianceMonitor(sandboxDir);
      const report = await monitor.verifyCompliance('src/serializers/UserSerializer.ts', 'class User { score = FloatField(); }');
      expect(report.isCompliant).toBe(false);
      expect(report.violations[0]).toContain('CWE-GRP-01');
    });

    it('should reject unsafe eval/exec functions', async () => {
      const monitor = new ComplianceMonitor(sandboxDir);
      const report = await monitor.verifyCompliance('src/utils/run.ts', 'eval("2+2")');
      expect(report.isCompliant).toBe(false);
      expect(report.violations[0]).toContain('CWE-78');
    });

    it('should flag schema drift when missing required sync fields', async () => {
      const monitor = new ComplianceMonitor(sandboxDir);
      const report = await monitor.verifyCompliance('src/services/SyncApiService.ts', 'const payload = { version: "1.0" };');
      expect(report.isCompliant).toBe(false);
      expect(report.violations[0]).toContain('Schema Drift');
    });
  });

  describe('SkillGraph', () => {
    it('should register skills and calculate parallel execution plans', () => {
      const sg = new SkillGraph();
      // Default graph contains NexusOmegaDiagnostic -> NexusMemoryManager -> NexusStateManager -> NexusAutoDream
      const plan = sg.getExecutionPlan([
        'NexusOmegaDiagnostic',
        'NexusMemoryManager',
        'NexusStateManager',
        'NexusAutoDream'
      ]);
      expect(plan.length).toBe(4);
      expect(plan[0][0]).toBe('NexusOmegaDiagnostic');
      expect(plan[1][0]).toBe('NexusMemoryManager');
      expect(plan[2][0]).toBe('NexusStateManager');
      expect(plan[3][0]).toBe('NexusAutoDream');
    });

    it('should support registering custom skills', () => {
      const sg = new SkillGraph();
      sg.registerSkill({
        name: 'CustomExecutionNode',
        layer: 'execution',
        dependencies: ['NexusAutoDream'],
        isConcurrencySafe: true
      });
      const plan = sg.getExecutionPlan([
        'NexusOmegaDiagnostic',
        'NexusMemoryManager',
        'NexusStateManager',
        'NexusAutoDream',
        'CustomExecutionNode'
      ]);
      expect(plan.flat()).toContain('CustomExecutionNode');
    });
  });

  describe('SelfSustainingProtocol', () => {
    it('should record operational distillation and log evolutionary events', async () => {
      const protocol = new SelfSustainingProtocol(sandboxDir);
      const result = await protocol.distillSuccessfulOperation('diagnostic-agent', 'astAutoPatch.js', 'const a = 1;', 120);
      expect(result.success).toBe(true);
      expect(result.status).toBe('ZERO_EXIT_CONFIRMED');

      const historyExists = await fs.stat(path.join(sandboxDir, '.nexus/agent-memory/evolution_history.md'));
      expect(historyExists.isFile()).toBe(true);
    });

    it('should mutate configuration feature gates correctly', async () => {
      const protocol = new SelfSustainingProtocol(sandboxDir);
      const result = await protocol.autoMutateFeatureGate('enable_forensic_debate', true);
      expect(result.success).toBe(true);

      const raw = await fs.readFile(path.join(sandboxDir, 'config/feature_gates.json'), 'utf-8');
      const gates = JSON.parse(raw);
      expect(gates.feature_gates.enable_forensic_debate).toBe(true);
    });
  });

  describe('ForensicReasoner', () => {
    it('should diagnose TypeErrors and assess risk parameters', async () => {
      const reasoner = new ForensicReasoner(sandboxDir);
      const report = await reasoner.analyzeTraceback('TypeError: Cannot read properties of undefined (reading "id")', { file: 'src/main.ts' });
      expect(report.cause).toBe('CRITICAL_NULL_POINTER_OR_DRIFT');
      expect(report.severity).toBe('HIGH');
      expect(report.shouldBypass).toBe('ALLOW_MUTATION_LOOP');
    });

    it('should diagnose CORS/permission errors and enforce lockdowns on critical risks', async () => {
      const reasoner = new ForensicReasoner(sandboxDir);
      const report = await reasoner.analyzeTraceback('CORS policy permission denied', { file: 'src/auth.ts' });
      expect(report.cause).toBe('SECURITY_POLICIES_BREACH');
      expect(report.severity).toBe('CRITICAL');
      expect(report.shouldBypass).toBe('FORCE_LOCKDOWN');
    });
  });

  describe('CentralOrchestrator', () => {
    it('should execute the sovereign pipeline successfully on clean code', async () => {
      const orchestrator = new CentralOrchestrator(sandboxDir);
      const result = await orchestrator.executeSovereignPipeline(
        'Add simple logging',
        'src/services/PaymentService.ts',
        'PaymentComponent',
        'logPayment',
        'const logPayment = () => { console.log("Paid"); };'
      );
      expect(result.integrity_status).toBe('SUCCESS');
      expect(result.final_verification).toBe('ZERO_EXIT_CONFIRMED');
      expect(result.pipeline_log.length).toBeGreaterThan(5);
    });

    it('should intercept compliance breach errors and perform forensic traceback analysis', async () => {
      const orchestrator = new CentralOrchestrator(sandboxDir);
      const result = await orchestrator.executeSovereignPipeline(
        'Add floating fields',
        'src/serializers/PaymentSerializer.ts',
        'PaymentSerializerComponent',
        'serialize',
        'class Serializer { amount = FloatField(); }'
      );
      expect(result.integrity_status).toBe('FAILED');
      expect(result.final_verification).toBe('FORCE_MUTATION_ROLLBACK');
      expect(result.diagnostics).toBeDefined();
      expect(result.diagnostics.cause).toBe('UNSPECIFIED_LOGICAL_FAULT');
    });
  });
});
