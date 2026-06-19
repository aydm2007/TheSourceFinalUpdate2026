class PermissionSandbox {
    /**
     * Evaluates commands against a sovereign policy. 
     * Auto-approves safe commands, blocks destructive ones, and sandboxes execution.
     */
    evaluateCommand(command) {
        const fs = require('fs');
const path = require('path');
let autoApprovePatterns = [/^ls/i, /^git status/i, /^node --version/i]; // fallback defaults
try {
  const cfgPath = path.resolve(__dirname, '..', '..', 'config.json');
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    if (Array.isArray(cfg.autoApprovePatterns)) {
      autoApprovePatterns = cfg.autoApprovePatterns.map(p => new RegExp(p, 'i'));
    }
  }
} catch (e) {
  console.error('[PermissionSandbox] Failed to load autoApprovePatterns from config.json', e);
}
        const destructivePatterns = [/^rm -rf/i, /^drop table/i];

        if (destructivePatterns.some(p => p.test(command))) {
            return { status: 'BLOCKED', policy: 'STRICT', message: 'Command blocked by Sovereign Sandbox policy.' };
        }

        if (autoApprovePatterns.some(p => p.test(command))) {
            return { status: 'AUTO_APPROVED', policy: 'STRICT', message: 'Command auto-approved. Executing in Sandbox.' };
        }

        return { status: 'REQUIRES_CONSENSUS', policy: 'STRICT', message: 'Command requires user or swarm consensus.' };
    }
}

module.exports = { PermissionSandbox };
