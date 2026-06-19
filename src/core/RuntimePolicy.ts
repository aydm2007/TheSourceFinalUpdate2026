/**
 * RuntimePolicy V2.0 — Bridge-Aware Policy Enforcement
 * 
 * يربط سياسة التنفيذ مباشرة بالجسر (bridge.json).
 * يمنع العمليات غير المصرح بها ويصنّف المخاطر.
 */

export type RiskLevel = 'safe' | 'elevated' | 'critical' | 'forbidden';

export interface PolicyAction {
  tool: string;
  action: string;
  agent?: string;
  context?: Record<string, any>;
}

export interface PolicyVerdict {
  allowed: boolean;
  riskLevel: RiskLevel;
  reason: string;
  requiresApproval: boolean;
}

const FORBIDDEN_PATTERNS = [
  'unsafe_exec',
  'raw_shell',
  'rm -rf /',
  'format-disk',
  'drop database',
  'eval(',
  'exec(',
  '__import__',
] as const;

const ELEVATED_PATTERNS = [
  'delete',
  'purge',
  'overwrite',
  'force-push',
  'reset --hard',
  'truncate',
] as const;

export class RuntimePolicy {
  private allowedTools: Set<string>;
  private customRules: Map<string, (action: PolicyAction) => PolicyVerdict>;

  constructor(bridgeAllowedTools: string[] = []) {
    this.allowedTools = new Set(bridgeAllowedTools);
    this.customRules = new Map();
  }

  /**
   * تحديث قائمة الأدوات المسموحة من الجسر
   */
  syncWithBridge(allowedTools: string[]): void {
    this.allowedTools = new Set(allowedTools);
  }

  /**
   * إضافة قاعدة مخصصة لأداة محددة
   */
  addCustomRule(toolName: string, rule: (action: PolicyAction) => PolicyVerdict): void {
    this.customRules.set(toolName, rule);
  }

  /**
   * تقييم عملية وإصدار الحكم
   */
  enforce(action: PolicyAction): PolicyVerdict {
    // 1. فحص الأنماط المحظورة
    const actionStr = `${action.tool} ${action.action}`.toLowerCase();

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (actionStr.includes(pattern.toLowerCase())) {
        return {
          allowed: false,
          riskLevel: 'forbidden',
          reason: `Forbidden pattern detected: '${pattern}'`,
          requiresApproval: false
        };
      }
    }

    // 2. فحص الجسر
    if (this.allowedTools.size > 0 && !this.allowedTools.has(action.tool)) {
      return {
        allowed: false,
        riskLevel: 'forbidden',
        reason: `Tool '${action.tool}' not authorized via Nexus Bridge`,
        requiresApproval: false
      };
    }

    // 3. فحص القواعد المخصصة
    const customRule = this.customRules.get(action.tool);
    if (customRule) {
      return customRule(action);
    }

    // 4. فحص الأنماط المرتفعة الخطورة
    for (const pattern of ELEVATED_PATTERNS) {
      if (actionStr.includes(pattern.toLowerCase())) {
        return {
          allowed: true,
          riskLevel: 'elevated',
          reason: `Elevated risk pattern: '${pattern}' — proceed with caution`,
          requiresApproval: true
        };
      }
    }

    // 5. آمن
    return {
      allowed: true,
      riskLevel: 'safe',
      reason: 'Action compliant with all policies',
      requiresApproval: false
    };
  }

  /**
   * فحص مجمّع لعدة عمليات
   */
  enforceBatch(actions: PolicyAction[]): PolicyVerdict[] {
    return actions.map(a => this.enforce(a));
  }

  /**
   * عدد الأدوات المسجلة في السياسة
   */
  getToolCount(): number {
    return this.allowedTools.size;
  }
}

export default RuntimePolicy;
