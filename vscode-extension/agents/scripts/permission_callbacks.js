/**
 * 🟣 PermissionCallbacks — Sovereign Permission System for Aether Engine V11.0
 * Part of: Phase 2 — 85 → 92
 * 
 * Usage: node permission_callbacks.js --check=file_write --path=/path/to/file
 * Bridge: TELEPATHY: permission check → bridge.json
 */

const fs = require('fs');
const path = require('path');

const BRIDGE_PATH = path.join(__dirname, '..', 'memory', 'telepathy', 'bridge.json');
const KILLSWITCH_PATH = path.join(__dirname, '..', 'config', 'killswitch.json');

// ─── Permission Definitions ──────────────────────────────────

const PERMISSIONS = {
  file_read: { level: 1, desc: 'قراءة الملفات', category: 'vision' },
  file_write: { level: 2, desc: 'كتابة/إنشاء ملفات', category: 'weaver', requires_approval: ['.env', '.git', 'secrets'] },
  file_edit: { level: 3, desc: 'تعديل ملفات موجودة', category: 'weaver', requires_approval: ['master.md', 'PROJECT_CONSTITUTION.md'] },
  bash_exec: { level: 3, desc: 'تنفيذ أوامر النظام', category: 'echo', requires_approval: ['rm -rf', 'DROP TABLE', 'DELETE FROM'] },
  web_fetch: { level: 2, desc: 'جلب محتوى خارجي', category: 'network' },
  web_search: { level: 2, desc: 'بحث خارجي', category: 'network' },
  agent_delegate: { level: 2, desc: 'تفويض وكيل', category: 'swarm' },
  memory_write: { level: 1, desc: 'كتابة في الذاكرة', category: 'memory' },
  bridge_pulse: { level: 1, desc: 'إرسال نبضة تخاطر', category: 'bridge' },
  state_transition: { level: 4, desc: 'تغيير حالة المنظومة', category: 'sovereign', requires_approval: ['phase3', 'phase4', 'complete'] },
  production_killswitch: { level: 5, desc: 'تفعيل/تعطيل killswitch', category: 'sovereign', production_only: true }
};

const ENVIRONMENTS = ['development', 'staging', 'production'];
const DEFAULT_ENV = process.env.NODE_ENV || 'development';

class PermissionCallbacks {
  constructor(env = DEFAULT_ENV) {
    this.env = env;
    this.killswitch = this.loadKillswitch();
    this.auditLog = [];
  }

  loadKillswitch() {
    try {
      if (fs.existsSync(KILLSWITCH_PATH)) {
        return JSON.parse(fs.readFileSync(KILLSWITCH_PATH, 'utf-8'));
      }
    } catch (e) { /* ignore */ }
    return { enabled: false, bypass_allowed: this.env !== 'production' };
  }

  // ─── Core Permission Check ──────────────────────────────

  check(permission, context = {}) {
    const perm = PERMISSIONS[permission];
    if (!perm) {
      return this.deny(permission, `Unknown permission: ${permission}`);
    }

    // Production killswitch
    if (this.env === 'production' && this.killswitch.enabled) {
      if (perm.production_only) {
        return this.deny(permission, 'Killswitch active — production operations blocked');
      }
      if (perm.level >= 4 && !context.bypass_token) {
        return this.deny(permission, 'Killswitch active — level 4+ operations require bypass_token');
      }
    }

    // Check sensitive paths
    if (perm.requires_approval && context.path) {
      for (const sensitive of perm.requires_approval) {
        if (context.path.includes(sensitive) && !context.approved) {
          return this.deny(permission, `Sensitive path: ${context.path} requires explicit approval`);
        }
      }
    }

    // Check dangerous commands
    if (perm.requires_approval && context.command) {
      for (const dangerous of perm.requires_approval) {
        if (context.command.toUpperCase().includes(dangerous.toUpperCase()) && !context.approved) {
          return this.deny(permission, `Dangerous command pattern: "${dangerous}" requires explicit approval`);
        }
      }
    }

    // All checks passed
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      permission,
      context: { path: context.path, command: context.command },
      result: 'granted',
      env: this.env
    });

    return {
      granted: true,
      permission,
      level: perm.level,
      category: perm.category,
      env: this.env,
      timestamp: new Date().toISOString()
    };
  }

  deny(permission, reason) {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      permission,
      result: 'denied',
      reason,
      env: this.env
    });

    return {
      granted: false,
      permission,
      reason,
      env: this.env,
      timestamp: new Date().toISOString()
    };
  }

  // ─── Batch Check ────────────────────────────────────────

  checkAll(operations) {
    return operations.map(op => this.check(op.permission, op.context));
  }

  // ─── Approval Request ───────────────────────────────────

  requestApproval(permission, context) {
    return {
      ...this.check(permission, { ...context, approved: false }),
      approval_required: true,
      approval_id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message: `Approval required for: ${permission} on ${context.path || context.command || 'unknown'}`
    };
  }

  // ─── Audit ──────────────────────────────────────────────

  getAuditLog(limit = 20) {
    return this.auditLog.slice(-limit);
  }

  getStats() {
    const total = this.auditLog.length;
    const granted = this.auditLog.filter(e => e.result === 'granted').length;
    const denied = this.auditLog.filter(e => e.result === 'denied').length;

    return {
      total_checks: total,
      granted,
      denied,
      grant_rate: total > 0 ? Math.round(granted / total * 100) : 100,
      env: this.env,
      killswitch: this.killswitch.enabled
    };
  }

  // ─── List Available Permissions ─────────────────────────

  listPermissions() {
    return Object.entries(PERMISSIONS).map(([name, perm]) => ({
      name,
      level: perm.level,
      category: perm.category,
      description: perm.desc,
      production_only: perm.production_only || false,
      has_sensitive_paths: !!perm.requires_approval
    }));
  }
}

// ─── CLI ────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  const cmd = args.find(a => a.startsWith('--cmd='))?.split('=')[1] || 'list';
  const env = args.find(a => a.startsWith('--env='))?.split('=')[1] || DEFAULT_ENV;

  const pc = new PermissionCallbacks(env);

  switch (cmd) {
    case 'list':
      console.log(JSON.stringify(pc.listPermissions(), null, 2));
      break;

    case 'check': {
      const permission = args.find(a => a.startsWith('--check='))?.split('=')[1];
      const filePath = args.find(a => a.startsWith('--path='))?.split('=')[1];
      const command = args.find(a => a.startsWith('--command='))?.split('=')[1];
      const approved = args.includes('--approved');

      if (!permission) {
        console.log(JSON.stringify({ error: '--check=permission_name required' }));
        process.exit(1);
      }

      const result = pc.check(permission, { path: filePath, command, approved });
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'batch': {
      // Test batch: check multiple permissions
      const results = pc.checkAll([
        { permission: 'file_read', context: { path: 'README.md' } },
        { permission: 'file_write', context: { path: '.env' } },
        { permission: 'file_write', context: { path: '.env', approved: true } },
        { permission: 'bash_exec', context: { command: 'npm test' } },
        { permission: 'bash_exec', context: { command: 'rm -rf /' } },
        { permission: 'state_transition', context: {} }
      ]);
      console.log(JSON.stringify(results, null, 2));
      break;
    }

    case 'stats':
      // Run some checks first for stats
      pc.check('file_read', { path: 'test.md' });
      pc.check('file_write', { path: '.env' });
      pc.check('file_write', { path: '.env', approved: true });
      pc.check('bash_exec', { command: 'npm test' });
      console.log(JSON.stringify(pc.getStats(), null, 2));
      break;

    case 'audit':
      console.log(JSON.stringify(pc.getAuditLog(10), null, 2));
      break;

    default:
      console.log(JSON.stringify({
        error: `Unknown command: ${cmd}`,
        usage: 'node permission_callbacks.js --cmd=list|check|batch|stats|audit'
      }));
  }
}

module.exports = { PermissionCallbacks, PERMISSIONS, ENVIRONMENTS };
