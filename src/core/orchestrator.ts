import StateMachine from '../state/StateMachine.js';
import { ComplianceMonitor } from './ComplianceMonitor.js';
import { ForensicReasoner } from './ForensicReasoner.js';
import SelfSustainingProtocol from './self-sustaining.js';
import { BridgeEnforcer } from './BridgeEnforcer.js';
import { RuntimePolicy } from './RuntimePolicy.js';
import { SecretScanner } from './security/SecretScanner.js';

export class CentralOrchestrator {
  private stateMachine: StateMachine;
  private compliance: ComplianceMonitor;
  private forensics: ForensicReasoner;
  private evolution: any;
  private bridge: BridgeEnforcer;
  private policy: RuntimePolicy;

  constructor(public workspaceRoot: string) {
    this.stateMachine = new StateMachine();
    this.compliance = new ComplianceMonitor(workspaceRoot);
    this.forensics = new ForensicReasoner(workspaceRoot);
    this.evolution = new SelfSustainingProtocol(workspaceRoot);
    this.bridge = new BridgeEnforcer(workspaceRoot);
    this.policy = new RuntimePolicy(this.bridge.getAllowedTools());
    
    // Scan for exposed secrets on startup
    const scanner = new SecretScanner(workspaceRoot);
    scanner.quickScan();
  }

  /**
   * تشغيل خط الأنابيب السيادي الكامل للمهمة الاستراتيجية
   * جميع العمليات تمر عبر الجسر إلزامياً
   */
  async executeSovereignPipeline(
    goal: string, 
    targetFile: string, 
    componentName: string, 
    methodName: string, 
    patchCode: string,
    toolsUsed: string[] = ['FileRead', 'FileEdit']
  ): Promise<any> {
    console.log(`\n🚀 [Orchestrator] Launching Sovereign Pipeline for File: ${targetFile}`);
    const startTime = Date.now();

    try {
      // 0. BRIDGE GATE — التحقق من أن جميع الأدوات مصرح بها
      for (const tool of toolsUsed) {
        this.bridge.enforceOrThrow(tool, 'CentralOrchestrator');
      }

      // 0.5 POLICY CHECK — التحقق من سياسة التنفيذ
      const policyVerdict = this.policy.enforce({
        tool: toolsUsed[0] || 'FileEdit',
        action: `patch:${componentName}.${methodName}`,
        agent: 'CentralOrchestrator'
      });
      if (!policyVerdict.allowed) {
        throw new Error(`Policy Violation: ${policyVerdict.reason}`);
      }

      // 1. STATE_1: DISCOVERY
      this.stateMachine.transition('STATE_1_DISCOVERY', { goal, targetFile });
      
      // 2. STATE_2: SWARM_CONSENSUS
      this.stateMachine.transition('STATE_2_SWARM_CONSENSUS', { targetFile, componentName });
      
      // 3. STATE_3: SURGICAL_INJECTION
      this.stateMachine.transition('STATE_3_SURGICAL_INJECTION', { methodName });
      
      // 4. STATE_4: EMPIRICAL_WAR_GAMING
      this.stateMachine.transition('STATE_4_EMPIRICAL_WAR_GAMING', { patchCode });
      
      // فحص الامتثال الكلي للأكواد المحدثة (Compliance Check)
      const audit = await this.compliance.verifyCompliance(targetFile, patchCode);
      if (!audit.isCompliant) {
        throw new Error(`Compliance Breach Detected: ${audit.violations.join(' | ')}`);
      }

      // 5. STATE_5: AUTO_HEALING
      this.stateMachine.transition('STATE_5_AUTO_HEALING', { status: "COMPLIANCE_PASSED" });
      
      // 6. STATE_6: ZERO_EXIT_LOCKDOWN
      this.stateMachine.transition('STATE_6_ZERO_EXIT_LOCKDOWN', { status: "LOCK_AND_DISTILL" });
      
      // تقطير النمط وتثبيت الوزن في الذاكرة السيادية
      const duration = Date.now() - startTime;
      await this.evolution.distillSuccessfulOperation('general-purpose', 'astAutoPatch.js', goal, duration);

      return {
        final_verification: "ZERO_EXIT_CONFIRMED",
        integrity_status: "SUCCESS",
        bridge_health: this.bridge.getHealthReport(),
        pipeline_log: this.stateMachine.getLog()
      };

    } catch (error: any) {
      console.error(`\n🚨 [Pipeline Failure] Routing traceback to Forensic Interceptor: ${error.message}`);
      
      // تشغيل العقل الجنائي عند الكوارث لمنع الانهيار (Self-Healing Triggers)
      const diagnostics = await this.forensics.analyzeTraceback(error.stack || error.message, { file: targetFile });
      
      return {
        final_verification: "FORCE_MUTATION_ROLLBACK",
        integrity_status: "FAILED",
        bridge_health: this.bridge.getHealthReport(),
        diagnostics: diagnostics
      };
    }
  }

  /**
   * تقرير صحة الجسر (للتشخيص الخارجي)
   */
  getBridgeHealth() {
    return this.bridge.getHealthReport();
  }

  /**
   * إعادة تحميل الجسر (Hot Reload)
   */
  reloadBridge() {
    this.bridge.reload();
    this.policy.syncWithBridge(this.bridge.getAllowedTools());
  }
}
