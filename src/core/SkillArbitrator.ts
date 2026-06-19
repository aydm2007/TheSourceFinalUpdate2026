/**
 * SkillArbitrator V2.0 — Bridge-Aware Skill Resolution & Priority Engine
 *
 * يحل تعارض المهارات ويضمن أن المهارة المختارة تعمل ضمن نطاق الجسر.
 */
import { logForDebugging } from '../utils/debug.js';

export interface SkillRule {
  name: string;
  priority: number;
  requiredTools: string[];
  layer?: 'diagnostic' | 'memory' | 'state' | 'planning' | 'execution';
}

export interface ArbitrationResult {
  selectedSkill: SkillRule;
  bridgeCompatible: boolean;
  missingTools: string[];
  alternativeSkill?: SkillRule;
}

export class SkillArbitrator {
  private bridgeAllowedTools: Set<string>;

  constructor(bridgeAllowedTools: string[] = []) {
    this.bridgeAllowedTools = new Set(bridgeAllowedTools);
  }

  /**
   * تحديث قائمة الأدوات المسموحة من الجسر
   */
  syncWithBridge(allowedTools: string[]): void {
    this.bridgeAllowedTools = new Set(allowedTools);
  }

  /**
   * حل تعارض المهارات واختيار الأنسب
   */
  resolve(rules: SkillRule[]): ArbitrationResult {
    if (rules.length === 0) {
      throw new Error('[SkillArbitrator] No skills provided for arbitration');
    }

    // ترتيب حسب الأولوية
    const sorted = [...rules].sort((a, b) => b.priority - a.priority);

    // البحث عن أول مهارة متوافقة مع الجسر
    for (const skill of sorted) {
      const missingTools = this.findMissingTools(skill);

      if (missingTools.length === 0) {
        logForDebugging(`[SkillArbitrator] Selected: ${skill.name} (priority: ${skill.priority}, bridge-compatible: true)`);
        return {
          selectedSkill: skill,
          bridgeCompatible: true,
          missingTools: []
        };
      }
    }

    // لا توجد مهارة متوافقة بالكامل — اختيار الأعلى أولوية مع تحذير
    const top = sorted[0];
    const missing = this.findMissingTools(top);
    logForDebugging(`[SkillArbitrator] WARNING: Selected ${top.name} but missing bridge tools: ${missing.join(', ')}`);

    // البحث عن بديل متوافق
    const alternative = sorted.find(s => this.findMissingTools(s).length === 0 && s !== top);

    return {
      selectedSkill: top,
      bridgeCompatible: false,
      missingTools: missing,
      alternativeSkill: alternative
    };
  }

  /**
   * البحث عن الأدوات المفقودة من الجسر لمهارة معينة
   */
  private findMissingTools(skill: SkillRule): string[] {
    if (this.bridgeAllowedTools.size === 0) return [];
    return skill.requiredTools.filter(t => !this.bridgeAllowedTools.has(t));
  }

  /**
   * التحقق من توافق مهارة معينة مع الجسر
   */
  isCompatible(skill: SkillRule): boolean {
    return this.findMissingTools(skill).length === 0;
  }

  /**
   * تقرير التوافق لجميع المهارات
   */
  getCompatibilityReport(rules: SkillRule[]): Map<string, { compatible: boolean; missing: string[] }> {
    const report = new Map<string, { compatible: boolean; missing: string[] }>();
    for (const skill of rules) {
      const missing = this.findMissingTools(skill);
      report.set(skill.name, { compatible: missing.length === 0, missing });
    }
    return report;
  }
}

export default SkillArbitrator;
