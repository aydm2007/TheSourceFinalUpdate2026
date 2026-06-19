/**
 * SovereignKernel — Aether-Zenith V16.0-Apex
 * -------------------------------------------
 * المحرك المركزي السيادي المسؤول عن إدارة التنفيذ، الاستشفاء الذاتي، والتقطير المعرفي.
 * يربط بين الذكاء الاستراتيجي (AETHER-ZENITH) والعتاد التنفيذي (cli.js).
 */
import path from 'path';
import fs from 'fs/promises';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_ROOT = path.resolve(__dirname, '..');

const SentinelGuard = require('../src/core-engine/SentinelGuard');
const FullRepairLoop = require('../src/core-engine/repair-loop');
const SelfSustainingProtocol = require('../src/core/self-sustaining');

// V43.0-Distributed-Runtime Imports
const ConstitutionalEnforcer = require('../src/core/runtime/ConstitutionalEnforcer');
const DeterministicScheduler = require('../src/core/runtime/DeterministicScheduler');
const dbManager = require('../core/db/db_manager.js');

// V50.0-Singularity Imports
const AutoDreamEngine = require('../src/core/runtime/AutoDreamEngine');
const QuorumArbitrator = require('../src/core/runtime/QuorumArbitrator');
const CompilerGate = require('../src/core/runtime/CompilerGate');

export class SovereignKernel {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot || CLI_ROOT;
    this.sentinel = new SentinelGuard(this.workspaceRoot);
    this.repairLoop = new FullRepairLoop(this.workspaceRoot);
    this.memory = new SelfSustainingProtocol(this.workspaceRoot);
    this.isBooted = false;
    this.circuitBreakers = new Map();

    // V43.0-Distributed-Runtime Kernel Components
    this.constitution = new ConstitutionalEnforcer();
    
    // Inject dynamic AdmissionControl config into Scheduler
    const admissionConfig = this.constitution.constitution.admissionControl || {};
    const AdmissionController = require('../src/core/runtime/AdmissionController');
    this.scheduler = new DeterministicScheduler(new AdmissionController(admissionConfig));

    // V44.0-Singularity Components
    const RuntimePolicyEngine = require('../src/core/runtime/RuntimePolicyEngine');
    const HybridLogicalClock = require('../src/core/runtime/HybridLogicalClock');
    const SecretVault = require('../src/core/runtime/SecretVault');
    const SchemaEvolutionEngine = require('../src/core/runtime/SchemaEvolutionEngine');

    this.policyEngine = new RuntimePolicyEngine();
    this.hlc = new HybridLogicalClock();
    this.vault = new SecretVault();
    this.schemaEngine = new SchemaEvolutionEngine();

    // Swarm Telepathy Bus (V42.0-Singularity)
    const EventEmitter = require('events');
    this.swarmBus = new EventEmitter();
    this._initializeSwarmListeners();

    // V50.0-Singularity Components
    this.quorumArbitrator = new QuorumArbitrator();
    this.compilerGate = new CompilerGate(this.workspaceRoot);
    this.autoDream = new AutoDreamEngine(this.workspaceRoot);
  }

  _initializeSwarmListeners() {
    this.swarmBus.on('FINANCE_EVENT', (data) => {
      console.log(`\n💰 [Swarm-Finance] Financial event received: ${JSON.stringify(data)}`);
      this.memory.distillSuccessfulOperation('finance-auditor', 'FINANCE_EVENT', JSON.stringify(data), 0).catch(()=>{});
    });

    this.swarmBus.on('AGRI_UPDATE', (data) => {
      console.log(`\n🌱 [Swarm-Agri] Agricultural update received: ${JSON.stringify(data)}`);
      this.memory.distillSuccessfulOperation('agri-specialist', 'AGRI_UPDATE', JSON.stringify(data), 0).catch(()=>{});
      // Trigger UI synthesizer to check for AST patches
      this.swarmBus.emit('UI_SYNC_REQUEST', { source: 'AGRI_UPDATE', data });
    });

    this.swarmBus.on('UI_SYNC_REQUEST', (data) => {
      console.log(`\n🎨 [Swarm-UI] UI/UX Synthesizer preparing to scan AST for: ${data.source}`);
      this.memory.distillSuccessfulOperation('ui-synthesizer', 'UI_SYNC_REQUEST', JSON.stringify(data), 0).catch(()=>{});
    });
  }

  /**
   * تشغيل النواة والتحقق من النزاهة الهيكلية
   */
  async boot(bootOptions = {}) {
    console.log("\n🚀 [Sovereign-Kernel] Booting Aether-Zenith V44.0-Singularity...");
    
    // Resolve project ID from CLI arguments or environment variables
    let projectId = process.env.PROJECT_ID || process.env.AETHER_PROJECT_ID;
    
    const projectArgIndex = process.argv.findIndex(arg => arg.startsWith('--project'));
    if (projectArgIndex !== -1) {
      const arg = process.argv[projectArgIndex];
      if (arg.includes('=')) {
        projectId = arg.split('=')[1];
      } else if (projectArgIndex + 1 < process.argv.length) {
        projectId = process.argv[projectArgIndex + 1];
      }
    }

    if (projectId) {
      try {
        await dbManager.init();
        const project = await dbManager.getProjectById(projectId);
        if (project) {
          console.log(`📁 [Sovereign-Kernel] Switched to Database Project "${project.name}" at: ${project.path}`);
          this.projectId = project.id;
          this.workspaceRoot = project.path;
          
          // Re-instantiate with target workspace path
          const SentinelGuard = require('../src/core-engine/SentinelGuard');
          const FullRepairLoop = require('../src/core-engine/repair-loop');
          const SelfSustainingProtocol = require('../src/core/self-sustaining');
          
          this.sentinel = new SentinelGuard(this.workspaceRoot);
          this.repairLoop = new FullRepairLoop(this.workspaceRoot);
          this.memory = new SelfSustainingProtocol(this.workspaceRoot);
          
          this.compilerGate = new CompilerGate(this.workspaceRoot);
          this.autoDream = new AutoDreamEngine(this.workspaceRoot);
        } else {
          console.warn(`⚠️ [Sovereign-Kernel] Project ID "${projectId}" not found in database. Using local directory.`);
        }
      } catch (e) {
        console.warn(`⚠️ [Sovereign-Kernel] Database connection failed during project load: ${e.message}`);
      }
    } else {
      try {
        await dbManager.init();
      } catch (e) {}
    }

    // 1. فحص الحراسة (Sentinel Check)
    const integrity = await this.sentinel.verifySystemIntegrity();
    if (!integrity.isValid) {
      console.error("🚨 [Sovereign-Kernel] Integrity Breach Detected! Attempting emergency healing...");
    }

    // 2. تحميل الخريطة الإحداثية (Structural GPS)
    this.sourceMapPath = path.join(this.workspaceRoot, 'package/cli.js.map');
    console.log(`📍 [Sovereign-Kernel] Structural GPS locked: ${this.sourceMapPath}`);

    // 3. Dynamic Source-Map Watching (Chokidar)
    try {
      const chokidar = require('chokidar');
      this.watcher = chokidar.watch(path.join(this.workspaceRoot, 'src/**/*.js'), {
        ignored: /(^|[\/\\])\../,
        persistent: true
      });
      
      this.watcher.on('change', (filePath) => {
        console.log(`\n👁️‍🗨️ [Sovereign-Watcher] Structural change detected in ${filePath}`);
        // Notify the memory system to track this forensic event
        this.memory.distillSuccessfulOperation(
           'SovereignWatcher',
           'STRUCTURAL_MUTATION',
           `File changed: ${filePath}`,
           0
        ).catch(() => {});
      });
      console.log(`👁️‍🗨️ [Sovereign-Kernel] Dynamic forensic watching enabled via Chokidar.`);
    } catch (err) {
      console.warn(`⚠️ [Sovereign-Kernel] Could not initialize Chokidar watching: ${err.message}`);
    }

    // V44.0: Initialize Secret Vault & HLC Tick on Boot
    this.vault.loadSecrets(process.env);
    const bootTimestamp = this.hlc.tick();
    console.log(`🔐 [Sovereign-Vault] Secrets redaction layer active.`);
    console.log(`🕐 [HLC] Boot timestamp: ${bootTimestamp}`);

    // V44.0: Handle CLI boot options
    if (bootOptions) {
      this._enableAutoBypass = !!bootOptions.enableAutoBypass;
      if (bootOptions.overrideConsensus) {
        console.warn(`[KERNEL] Force-consensus mode active. Skipping quorum validation.`);
      }
    }

    this.isBooted = true;
    console.log("✅ [Sovereign-Kernel] System Sovereign & Active. V44.0-Singularity\n");
  }

  /**
   * التنفيذ السيادي مع التقطير المعرفي التلقائي (The 0.5% Seal)
   */
  async execute(toolName, args, toolFn) {
    if (!this.isBooted) await this.boot();

    // V44.0: Dynamic Policy Enforcement
    const policyResult = this.policyEngine.evaluate('system', toolName, args);
    if (!policyResult.allowed) {
       console.warn(`[POLICY_DENY] ${toolName} blocked: ${policyResult.reason}`);
       if (!this._enableAutoBypass) {
         throw new Error(`PolicyEngine DENY: ${toolName} - Reason: ${policyResult.reason}`);
       } else {
         console.warn(`[BYPASS] Override active. Permitting execution of ${toolName}.`);
       }
    }

    // V50.0: Byzantine Multi-Agent Consensus Quorum Check
    const consensus = await this.quorumArbitrator.evaluateConsensus(toolName, args);
    if (!consensus.approved) {
      console.warn(`[QUORUM_DENY] ${toolName} blocked: ${consensus.reason}`);
      if (!this._enableAutoBypass) {
        throw new Error(`QuorumArbitrator DENY: ${toolName} - Reason: ${consensus.reason}`);
      } else {
        console.warn(`[BYPASS] Consensus override active. Permitting execution of ${toolName}.`);
      }
    }

    // V44.0: Schema Evolution
    args = this.schemaEngine.migrate(toolName, args, 2);

    let cb = this.circuitBreakers.get(toolName);
    if (!cb) {
      cb = { failures: 0, lastFailure: 0, status: 'CLOSED' };
      this.circuitBreakers.set(toolName, cb);
    }

    if (cb.status === 'OPEN') {
      const cooldown = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - cb.lastFailure > cooldown) {
        cb.status = 'HALF_OPEN';
        console.warn(`⏳ [Circuit-Breaker] Tool ${toolName} entering HALF_OPEN state.`);
      } else {
        throw new Error(`Circuit Breaker OPEN: ${toolName} is temporarily disabled due to continuous failures.`);
      }
    }

    const startTime = Date.now();
    // V44.0: HLC Tick — stamp the execution with distributed time
    const hlcTimestamp = this.hlc.tick();

    // V50.0 staging and backup for CompilerGate
    const fsSync = require('fs');
    const isFileWrite = ['FileWrite', 'SurgicalWrite', 'SurgicalReplace', 'write_to_file', 'replace_file_content'].includes(toolName);
    const targetPath = args.path || args.TargetFile || args.targetPath || args.target;
    let backupPath = null;

    if (isFileWrite && targetPath) {
      try {
        const resolvedPath = path.resolve(this.workspaceRoot, targetPath);
        if (fsSync.existsSync(resolvedPath)) {
          backupPath = `${resolvedPath}.backup_stage`;
          fsSync.copyFileSync(resolvedPath, backupPath);
        }
      } catch (e) {}
    }

    try {
      console.log(`🛠️ [Sovereign-Exec] Invoking tool: ${toolName} @ HLC ${hlcTimestamp}`);
      const result = await toolFn(args);
      
      if (cb.status !== 'CLOSED') {
         cb.status = 'CLOSED';
         cb.failures = 0;
         console.log(`🟢 [Circuit-Breaker] Tool ${toolName} recovered. Status set to CLOSED.`);
      }
      
      // V50.0 CompilerGate validation on successful execution
      if (backupPath && fsSync.existsSync(backupPath)) {
        const resolvedPath = path.resolve(this.workspaceRoot, targetPath);
        try {
          this.compilerGate.checkSyntax(resolvedPath);
          fsSync.unlinkSync(backupPath);
          console.log(`✅ [Compiler-Gate] Syntax/Compilation check passed for: ${targetPath}`);
        } catch (err) {
          fsSync.copyFileSync(backupPath, resolvedPath);
          fsSync.unlinkSync(backupPath);
          console.error(`🚨 [Compiler-Gate Failure] Syntax check failed on: ${targetPath}. Rolled back modification!`);
          throw new Error(`CompilerGate validation failed: ${err.message}`);
        }
      }

      const duration = Date.now() - startTime;
      // V44.0: Sanitize log payloads before writing to Shadow Ledger
      const sanitizedArgs = this.vault.sanitizeLog(JSON.stringify(args).slice(0, 100));
      await this.memory.distillSuccessfulOperation(
        'SovereignMaster', 
        toolName, 
        sanitizedArgs, 
        duration
      );

      // Log directly to the SQLite database via dbManager
      try {
        const username = process.env.CLI_USER_NAME || 'ibrahim_admin';
        const userRow = await dbManager.db.get('SELECT id FROM users WHERE username = ?', [username]);
        const userId = userRow ? userRow.id : 'admin_user';
        await dbManager.logUsage(userId, toolName, duration, 0);

        // Notify the remote server SSE broadcaster
        const adminKey = process.env.MCP_API_KEY;
        const port = process.env.PORT || 3847;
        const targetProjId = this.projectId || 'thesource';

        if (adminKey) {
          fetch(`http://localhost:${port}/admin/api/cli-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminKey}` },
            body: JSON.stringify({
              username,
              toolName,
              durationMs: duration,
              projectId: targetProjId,
              success: true
            }),
            signal: AbortSignal.timeout ? AbortSignal.timeout(500) : undefined
          }).catch(() => {}); // silently ignore if server is down
        }
      } catch (err) {}

      // V50.0: Trigger continuous background reflection
      this.autoDream.triggerReflection().catch(() => {});

      return result;
    } catch (error) {
      // V50.0 CompilerGate rollback on execution failure
      if (backupPath && fsSync.existsSync(backupPath)) {
        const resolvedPath = path.resolve(this.workspaceRoot, targetPath);
        fsSync.copyFileSync(backupPath, resolvedPath);
        fsSync.unlinkSync(backupPath);
        console.log(`🔄 [Compiler-Gate] Rolled back modification on ${targetPath} due to tool execution failure.`);
      }

      const duration = Date.now() - startTime;
      console.error(`❌ [Sovereign-Exec] Failure in ${toolName}: ${error.message}`);
      
      cb.failures++;
      cb.lastFailure = Date.now();
      if (cb.failures >= 3) {
         cb.status = 'OPEN';
         console.error(`🔴 [Circuit-Breaker] Tool ${toolName} failed 3 times. Status set to OPEN.`);
      }

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

      // Log directly to the SQLite database via dbManager
      try {
        const username = process.env.CLI_USER_NAME || 'ibrahim_admin';
        const userRow = await dbManager.db.get('SELECT id FROM users WHERE username = ?', [username]);
        const userId = userRow ? userRow.id : 'admin_user';
        await dbManager.logUsage(userId, toolName, duration, 0);

        // Notify the remote server SSE broadcaster
        const adminKey = process.env.MCP_API_KEY;
        const port = process.env.PORT || 3847;
        const targetProjId = this.projectId || 'thesource';

        if (adminKey) {
          fetch(`http://localhost:${port}/admin/api/cli-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminKey}` },
            body: JSON.stringify({
              username,
              toolName,
              durationMs: duration,
              projectId: targetProjId,
              success: false
            }),
            signal: AbortSignal.timeout ? AbortSignal.timeout(500) : undefined
          }).catch(() => {});
        }
      } catch (err) {}

      // V50.0: Trigger continuous background reflection
      this.autoDream.triggerReflection().catch(() => {});

      throw error;
    }
  }
}
