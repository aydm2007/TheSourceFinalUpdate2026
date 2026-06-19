/**
 * ┌────────────────────────────────────────────────────────────────┐
 * │  🔒 BridgeEnforcer V2.0 — Nexus Bridge Runtime Guardian       │
 * │  Enforces that ALL tool operations pass through bridge.json   │
 * │  Logs every access attempt to shadow_ledger.jsonl             │
 * └────────────────────────────────────────────────────────────────┘
 */
import * as fs from 'fs';
import * as path from 'path';
import { logForDebugging } from '../utils/debug.js';

export interface BridgeConfig {
  bridgeVersion: string;
  enforcementMode: 'STRICT' | 'PERMISSIVE' | 'AUDIT_ONLY';
  allowed_tools: string[];
  total_tools: number;
  bridge_constraint: string;
  last_updated: string;
}

export interface BridgeAccessResult {
  allowed: boolean;
  tool: string;
  timestamp: string;
  reason?: string;
}

export class BridgeEnforcer {
  private config: BridgeConfig | null = null;
  private bridgePath: string;
  private ledgerPath: string;
  private accessLog: BridgeAccessResult[] = [];

  constructor(workspaceRoot: string) {
    this.bridgePath = path.join(workspaceRoot, 'bridge.json');
    this.ledgerPath = path.join(workspaceRoot, 'shadow_ledger.jsonl');
    this.loadConfig();
  }

  /**
   * تحميل إعدادات الجسر من bridge.json
   */
  private loadConfig(): void {
    try {
      const raw = fs.readFileSync(this.bridgePath, 'utf-8');
      this.config = JSON.parse(raw);
      logForDebugging(`[BridgeEnforcer] Loaded bridge V${this.config!.bridgeVersion} with ${this.config!.allowed_tools.length} tools`);
    } catch (e: any) {
      logForDebugging(`[BridgeEnforcer] CRITICAL: Failed to load bridge.json — ${e.message}`);
      this.config = null;
    }
  }

  /**
   * التحقق من أن الأداة مصرح بها عبر الجسر
   */
  authorize(toolName: string, agentId?: string): BridgeAccessResult {
    const timestamp = new Date().toISOString();

    if (!this.config) {
      const result: BridgeAccessResult = {
        allowed: false,
        tool: toolName,
        timestamp,
        reason: 'Bridge configuration not loaded — all access denied'
      };
      this.logAccess(result);
      return result;
    }

    const isAllowed = this.config.allowed_tools.includes(toolName);
    const isStrict = this.config.enforcementMode === 'STRICT';

    const result: BridgeAccessResult = {
      allowed: isStrict ? isAllowed : true,
      tool: toolName,
      timestamp,
      reason: isAllowed
        ? `Tool authorized via bridge V${this.config.bridgeVersion}`
        : isStrict
          ? `SOVEREIGN BREACH: Tool '${toolName}' not in bridge.json — access DENIED`
          : `AUDIT: Tool '${toolName}' not in bridge.json — access permitted (non-strict mode)`
    };

    this.logAccess(result, agentId);
    return result;
  }

  /**
   * التحقق من صحة أداة مع رفع استثناء عند الخرق (للاستخدام في Pipeline)
   */
  enforceOrThrow(toolName: string, agentId?: string): void {
    const result = this.authorize(toolName, agentId);
    if (!result.allowed) {
      throw new Error(`[BridgeEnforcer] ${result.reason}`);
    }
  }

  /**
   * تسجيل محاولة الوصول في السجل الجنائي
   */
  private logAccess(result: BridgeAccessResult, agentId?: string): void {
    this.accessLog.push(result);

    const entry = {
      timestamp: result.timestamp,
      type: 'bridge_access',
      tool: result.tool,
      allowed: result.allowed,
      agent: agentId || 'unknown',
      enforcement: this.config?.enforcementMode || 'UNKNOWN',
      ...(result.reason && !result.allowed ? { violation: result.reason } : {})
    };

    try {
      fs.appendFileSync(this.ledgerPath, JSON.stringify(entry) + '\n', 'utf-8');
    } catch {
      logForDebugging('[BridgeEnforcer] Warning: Could not write to shadow_ledger.jsonl');
    }
  }

  /**
   * التحقق المجمّع لقائمة أدوات (Batch Authorization)
   */
  authorizeBatch(toolNames: string[], agentId?: string): Map<string, BridgeAccessResult> {
    const results = new Map<string, BridgeAccessResult>();
    for (const tool of toolNames) {
      results.set(tool, this.authorize(tool, agentId));
    }
    return results;
  }

  /**
   * تقرير صحة الجسر
   */
  getHealthReport(): {
    loaded: boolean;
    version: string;
    enforcement: string;
    totalTools: number;
    totalAccesses: number;
    violations: number;
  } {
    return {
      loaded: this.config !== null,
      version: this.config?.bridgeVersion || 'N/A',
      enforcement: this.config?.enforcementMode || 'N/A',
      totalTools: this.config?.allowed_tools?.length || 0,
      totalAccesses: this.accessLog.length,
      violations: this.accessLog.filter(r => !r.allowed).length
    };
  }

  /**
   * إعادة تحميل الجسر (Hot Reload)
   */
  reload(): void {
    this.loadConfig();
    logForDebugging('[BridgeEnforcer] Bridge configuration hot-reloaded');
  }

  /**
   * الحصول على قائمة الأدوات المصرح بها
   */
  getAllowedTools(): string[] {
    return this.config?.allowed_tools || [];
  }

  /**
   * مسح سجل الوصول (للاختبارات)
   */
  clearAccessLog(): void {
    this.accessLog = [];
  }
}

export default BridgeEnforcer;
