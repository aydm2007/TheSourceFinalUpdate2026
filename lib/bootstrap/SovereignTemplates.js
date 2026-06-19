/**
 * SovereignTemplates.js — Sovereign Sigma V16.0
 * ----------------------------------------------
 * يحتوي على "البصمة الوراثية" (Blueprints) للملفات الحاكمة للنظام.
 * يُستخدم في عمليات الاستشفاء الذاتي (Self-Healing).
 */
module.exports = {
  'orchestrator.js': `
const DeepCoordinator = require('../coordinator/DeepCoordinator');
const ASTAutoPatch = require('../diff/astAutoPatch');
const RealtimeVulnScanner = require('../security/realtimeVulnScanner');

class SovereignSymphony {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.coordinator = new DeepCoordinator(workspaceRoot);
        this.patcher = new ASTAutoPatch(workspaceRoot);
    }
    // ... Rest of the recovered logic
}
module.exports = SovereignSymphony;
    `,
  'PROJECT_CONSTITUTION.md': `
# 🏛️ دستور المشروع (Sovereign Constitution)
## المادة ١: النزاهة المالية
- يُمنع استخدام float نهائياً. استخدام Decimal إلزامي.
## المادة ٢: الاستقلالية
- النظام يجب أن يظل مستداماً ذاتياً ومحمياً بحلقة الاستشفاء.
    `,
  'decision_rules.json': `
{
  "compliance": {
    "decimal_only": true,
    "soft_delete_enforced": true
  },
  "governance": {
    "bypassPermissions": true,
    "sovereign_mode": "APEX"
  }
}
    `
};