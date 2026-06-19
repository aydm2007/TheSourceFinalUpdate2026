/**
 * SovereignKernel — Aether-Zenith V16.0-Apex
 * -------------------------------------------
 * المحرك المركزي السيادي المسؤول عن إدارة التنفيذ، الاستشفاء الذاتي، والتقطير المعرفي.
 * يربط بين الذكاء الاستراتيجي (AETHER-ZENITH) والعتاد التنفيذي (cli.js).
 */
import path from 'path';
import fs from 'fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const SentinelGuard = require('../src/core-engine/SentinelGuard');
const FullRepairLoop = require('../src/core-engine/repair-loop');
const SelfSustainingProtocol = require('../src/core/self-sustaining');

export class SovereignKernel {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot || process.cwd();
    this.sentinel = new SentinelGuard(this.workspaceRoot);
    this.repairLoop = new FullRepairLoop(this.workspaceRoot);
    this.memory = new SelfSustainingProtocol(this.workspaceRoot);
    this.isBooted = false;
  }

  /**
   * تشغيل النواة والتحقق من النزاهة الهيكلية
   */
  async boot() {
    console.log("\n🚀 [Sovereign-Kernel] Booting Aether-Zenith V16.0-Apex...");
    
    // 1. فحص الحراسة (Sentinel Check)
    const integrity = await this.sentinel.performIntegrityAudit();
    if (!integrity.passed) {
      console.error("🚨 [Sovereign-Kernel] Integrity Breach Detected! Attempting emergency healing...");
    }

    // 2. تحميل الخريطة الإحداثية (Structural GPS)
    this.sourceMapPath = path.join(this.workspaceRoot, 'package/cli.js.map');
    console.log(`📍 [Sovereign-Kernel] Structural GPS locked: ${this.sourceMapPath}`);

    this.isBooted = true;
    console.log("✅ [Sovereign-Kernel] System Sovereign & Active.\n");
  }

  /**
   * التنفيذ السيادي مع التقطير المعرفي التلقائي (The 0.5% Seal)
   */
  async execute(toolName, args, toolFn) {
    if (!this.isBooted) await this.boot();

    const startTime = Date.now();
    try {
      console.log(`🛠️ [Sovereign-Exec] Invoking tool: ${toolName}`);
      const result = await toolFn(args);
      
      const duration = Date.now() - startTime;
      await this.memory.distillSuccessfulOperation(
        'SovereignMaster', 
        toolName, 
        JSON.stringify(args).slice(0, 100), 
        duration
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ [Sovereign-Exec] Failure in ${toolName}: ${error.message}`);
      
      const repairPlan = await this.repairLoop.handleExecutionFailure(
        toolName, 
        error.message, 
        JSON.stringify(args)
      );

      await this.memory.distillSuccessfulOperation(
        'SovereignMaster', 
        `${toolName}_FAILURE`, 
        `Error: ${error.message} | Plan: ${repairPlan.status}`, 
        duration
      );

      throw error;
    }
  }
}
