/**
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  🔌 Shared MCP Core V2.0 — ATE (Adaptive Tool Exposure)           │
 * │  Common logic for both mcp_bridge_server and mcp_remote_server     │
 * │  Features:                                                          │
 * │    • Skill-based tool filtering (YAML frontmatter)                  │
 * │    • TOOL_CATEGORIES semantic domain map (Intent Router ready)      │
 * │    • Skill Hint injection when no skill is active                   │
 * │    • SOVEREIGN BREACH enforcement for unauthorized tool calls       │
 * └────────────────────────────────────────────────────────────────────┘
 */
const fs = require('fs');
const path = require('path');
// Unified telemetry logger – writes to the sovereign ledger used by Admin dashboard
const crypto = require('crypto');
const sqlite3 = require('sqlite3');
let auditDb = null;

function initAuditDb(ledgerDir) {
  if (auditDb) return auditDb;
  const dbPath = path.join(ledgerDir, 'shadow_ledger.db');
  auditDb = new sqlite3.Database(dbPath);
  auditDb.serialize(() => {
    // Enable WAL mode for high concurrency and Swarm parallelism
    auditDb.run('PRAGMA journal_mode = WAL;');
    auditDb.run('PRAGMA synchronous = NORMAL;');
    auditDb.run('PRAGMA busy_timeout = 5000;');
    
    auditDb.run(`CREATE TABLE IF NOT EXISTS shadow_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT,
      pid INTEGER,
      sessionId TEXT,
      type TEXT,
      action TEXT,
      status TEXT,
      payload TEXT
    )`);
  });
  return auditDb;
}

function auditLog(entry, sessionId = 'local', projectPath = null) {
  const baseDir = projectPath || path.join(__dirname, '..', '..');
  const ledgerDir = path.join(baseDir, '.nexus', 'var', 'telemetry');
  const ledgerPath = path.join(ledgerDir, 'shadow_ledger.jsonl');
  
  if (!fs.existsSync(ledgerDir)) {
      fs.mkdirSync(ledgerDir, { recursive: true });
  }

  const record = {
    seq: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    pid: process.pid,
    sessionId: sessionId,
    type: entry.type || 'mcp_audit_event',
    action: entry.action || entry.tool || entry.type || 'UNKNOWN_ACTION',
    status: entry.status || (entry.allowed === false ? 'REJECTED' : 'SUCCESS'),
    ...entry,
  };
  
  try {
    const db = initAuditDb(ledgerDir);
    db.run(
      `INSERT INTO shadow_events (id, timestamp, pid, sessionId, type, action, status, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [record.seq, record.timestamp, record.pid, record.sessionId, record.type, record.action, record.status, JSON.stringify(record)],
      (err) => {
        if (err) console.error('[auditLog] SQLite DB Write Error:', err.message);
      }
    );
  } catch (dbErr) {
    console.error('[auditLog] SQLite DB Initialization Error:', dbErr.message);
  }

  try {
    // Legacy Sync Write
    fs.appendFileSync(ledgerPath, JSON.stringify(record) + '\n');
  } catch (e) {
    console.error('[auditLog] Failed to write to shadow ledger:', e.message);
  }
}

/**
 * Semantic domain map for all 105 bridge tools.
 * Used by the Intent Router to auto-classify which tools are relevant
 * for a given task context. Domains:
 *   - code_modification : Writing / patching source code
 *   - read_inspect      : Reading files, searching, LSP inspection
 *   - runtime_test      : Executing commands, running tests
 *   - memory_cognitive  : Vector DB, memory, reasoning, planning
 *   - security          : Audits, vulnerability scanning, guards
 *   - swarm             : Multi-agent orchestration & messaging
 *   - always            : Core control tools, always exposed
 */
const TOOL_CATEGORIES = {
  // ── Code Modification ────────────────────────────────────────────────
  FileEdit:              'code_modification',
  FileWrite:             'code_modification',
  SurgicalDiff:          'code_modification',
  AstChunkPatch:         'code_modification',
  ASTAutoPatch:          'code_modification',
  ResolveConflict:       'code_modification',
  UndoChanges:           'code_modification',
  NotebookEdit:          'code_modification',

  // ── Read / Inspect ───────────────────────────────────────────────────
  FileRead:              'read_inspect',
  FileReadLines:         'read_inspect',
  Glob:                  'read_inspect',
  Grep:                  'read_inspect',
  ViewCodeOutline:       'read_inspect',
  LSPTool:               'read_inspect',
  SemanticReference:     'read_inspect',
  SemanticSymbolLookup:  'read_inspect',
  Insight:               'read_inspect',
  ForensicAudit:         'read_inspect',
  AstIndexer:            'read_inspect',
  GraphMemorySync:       'read_inspect',

  // ── Runtime / Test ───────────────────────────────────────────────────
  Bash:                  'runtime_test',
  PowerShell:            'runtime_test',
  InteractiveTerminal:   'runtime_test',
  ParallelTest:          'runtime_test',
  FullRepairLoop:        'runtime_test',
  ChaosTest:             'runtime_test',
  SandboxManager:        'runtime_test',
  SelfHealingImmunizer:  'runtime_test',
  ServerMode:            'runtime_test',

  // ── Memory / Cognitive ───────────────────────────────────────────────
  VectorSearch:          'memory_cognitive',
  VectorSync:            'memory_cognitive',
  AutoDream:             'memory_cognitive',
  MemoryCompactor:       'memory_cognitive',
  MemoryGraphRefiner:    'memory_cognitive',
  MemoryLedgerForecaster:'memory_cognitive',
  ContextIndexRefiner:   'memory_cognitive',
  QuantumTokenCompressor:'memory_cognitive',
  SemanticContextCompressor: 'memory_cognitive',
  ShadowLedgerAudit:     'memory_cognitive',
  PredictiveForesight:   'memory_cognitive',
  CodeImpactSimulator:   'memory_cognitive',
  TodoWrite:             'memory_cognitive',

  // ── Security / Audit ─────────────────────────────────────────────────
  RealtimeScan:              'security',
  ConsensusSecurityGuard:    'security',
  ConsensusSignatureAssurer: 'security',
  ConsensusSignatureValidator:'security',
  ConsensusStructuralLinter: 'security',
  TelepathicSwarmConsensus:  'security',
  SelfEvolutionConsensusEngine: 'security',

  // ── Swarm / Multi-Agent ──────────────────────────────────────────────
  nexus_Agent:           'swarm',
  SwarmBroadcast:        'swarm',
  SwarmConsensusExecutor:'swarm',
  SwarmPipelineOrchestrator: 'swarm',
  SwarmProcessBridge:    'swarm',
  SwarmRelocationAgent:  'swarm',
  SwarmTeleport:         'swarm',
  SendMessage:           'swarm',
  TeamManager:           'swarm',
  TaskManager:           'swarm',
  DeepCoordinatorTask:   'swarm',
  SelfEvolutionCompiler: 'swarm',
  AsyncSwarmTask:        'swarm',
  DynamicToolSynthesis:  'swarm',

  // ── Always Exposed (Core Control) ────────────────────────────────────
  LoadSkill:             'always',
  Skill:                 'always',
  Config:                'always',
  FeatureFlag:           'always',
  ZodSchema:             'always',
  AskUserQuestion:       'always',
  Sleep:                 'always',
  TokenEstimation:       'always',
  ToolSearch:            'always',
  ReasoningEngine:       'always',
  ExitPlanMode:          'always',
  EnterPlanMode:         'always',
  ListMcpResources:      'always',
  OmegaDiagnostic:       'always',
  SystemDiagnostics:     'always',
  WebSearch:             'always',
  WebFetch:              'always',
  WebBrowse:             'always',
  MCPTool:               'always',
  McpCall:               'always',
  ReadMcpResource:       'always',
  ClaudeCLI:             'always',
  VoiceMode:             'always',
  VisualAuditReport:     'always',
};

const FACADE_GROUPS = {
  TaskManager: {
    tools: ['TaskCreate', 'TaskGet', 'TaskUpdate', 'TaskList', 'TaskStop', 'TaskOutput'],
    description: '[Nexus Bridge] Unified tool for all Task related operations.'
  },
  SandboxManager: {
    tools: ['SandboxImmuneShield', 'SandboxImmersionEmulator', 'SandboxEnvVisualizer', 'SandboxEnvImmunizer', 'SandboxResourceThrottle', 'SandboxNetworkLimiter', 'SandboxSessionLimiter', 'SandboxedRuntimeRunner'],
    description: '[Nexus Bridge] Unified tool for all Sandbox related operations.'
  },
  TeamManager: {
    tools: ['TeamCreate', 'TeamDelete', 'TeamSynthesize'],
    description: '[Nexus Bridge] Unified tool for all Team management operations.'
  },
  FileSystemManager: {
    tools: ['FileRead', 'FileEdit', 'FileWrite', 'FileReadLines', 'Glob', 'Grep', 'SurgicalDiff', 'ViewCodeOutline', 'AstChunkPatch', 'ASTAutoPatch', 'ResolveConflict', 'UndoChanges', 'NotebookEdit'],
    description: '[Nexus Bridge] Unified Gateway for all File System and Code Modification operations.'
  },
  SovereignReader: {
    tools: ['FileRead', 'FileReadLines', 'Glob', 'Grep', 'ViewCodeOutline'],
    description: '[Nexus Bridge] Unified Gateway for read-only File System operations.'
  },
  SovereignWriter: {
    tools: ['FileEdit', 'FileWrite', 'SurgicalDiff', 'AstChunkPatch', 'ASTAutoPatch', 'ResolveConflict', 'UndoChanges', 'NotebookEdit'],
    description: '[Nexus Bridge] Unified Gateway for write and edit File System operations.'
  },
  MemoryManager: {
    tools: ['VectorSearch', 'VectorSync', 'VectorAstMapper', 'MemoryCompactor', 'MemoryGraphRefiner', 'SemanticContextCompressor', 'QuantumTokenCompressor', 'MemoryLedgerForecaster', 'ContextIndexRefiner', 'ShadowLedgerAudit', 'PredictiveForesight', 'CodeImpactSimulator', 'AutoDream', 'TodoWrite'],
    description: '[Nexus Bridge] Unified Gateway for all Memory, Cognitive, and Vector operations.'
  },
  SecurityManager: {
    tools: ['RealtimeScan', 'ConsensusSecurityGuard', 'ConsensusSignatureAssurer', 'ConsensusSignatureValidator', 'ConsensusStructuralLinter', 'TelepathicSwarmConsensus', 'SelfEvolutionConsensusEngine', 'SelfHealingImmunizer', 'ZeroTrustMerkleLedger', 'ChaosTest'],
    description: '[Nexus Bridge] Unified Gateway for all Security, Consensus, and Immune System operations.'
  },
  SwarmManager: {
    tools: ['Agent', 'SwarmBroadcast', 'SwarmConsensusExecutor', 'SwarmPipelineOrchestrator', 'SwarmProcessBridge', 'SwarmRelocationAgent', 'SwarmTeleport', 'SendMessage', 'DeepCoordinatorTask', 'SelfEvolutionCompiler', 'AsyncSwarmTask', 'DynamicToolSynthesis', 'ParallelSwarmCoordinator'],
    description: '[Nexus Bridge] Unified Gateway for all Multi-Agent Swarm Orchestration operations.'
  },
  TerminalManager: {
    tools: ['Bash', 'PowerShell', 'InteractiveTerminal'],
    description: '[Nexus Bridge] Unified Gateway for native terminal operations.'
  },
  WebManager: {
    tools: ['WebSearch', 'WebFetch', 'WebBrowse'],
    description: '[Nexus Bridge] Unified Gateway for external web interactions.'
  },
  McpManager: {
    tools: ['McpCall', 'MCPTool', 'ListMcpResources', 'ReadMcpResource'],
    description: '[Nexus Bridge] Unified Gateway for dynamic third-party MCP connections.'
  },
  IdeManager: {
    tools: ['IdeDiffView', 'InsertNativeSnippet', 'GetLinterSquiggles', 'CaptureIdeScreenshot', 'EditorClick', 'EditorHover', 'TerminalListen', 'WebviewOpen', 'VisualDomMapper'],
    description: '[Nexus Bridge] Unified Gateway for IDE simulation and UI interactions.'
  },
  ProfilerManager: {
    tools: ['V8FlamegraphProfiler', 'QueryExecutionProfiler', 'NetworkTrafficInterceptor', 'RuntimeMemoryDebugger', 'TimeTravelDebugger', 'SystemDiagnostics'],
    description: '[Nexus Bridge] Unified Gateway for deep performance and memory profiling.'
  },
  AstCompilerManager: {
    tools: ['AlphaHardwareProbe', 'HardwareAstMapper', 'AstMutexLockManager', 'PrecognitionAstMutator', 'AstLspQuery', 'AstIndexer', 'VectorSearchEngine', 'VectorAstMapper'],
    description: '[Nexus Bridge] Unified Gateway for Hardware-level AST analysis and mutation.'
  },
  AnalysisManager: {
    tools: ['GraphMemorySync', 'SemanticSymbolLookup', 'GitArchitecturalBlame', 'RemoteMapDecoder', 'MapDrivenOptimizer', 'ReadSpatialTelemetry', 'Insight', 'ForensicAudit', 'VisualAuditReport'],
    description: '[Nexus Bridge] Unified Gateway for Codebase forensics, spatial maps, and analysis.'
  },
  EvolutionManager: {
    tools: ['AssimilateWorkspace', 'AbstractIdeation', 'TelepathicHiveMind', 'SwarmDNAExtractor', 'EmpatheticModulator', 'CrossProjectHub', 'PredictiveImmunization', 'QuantumHologram', 'SelfOptimize', 'LedgerCompactor', 'TelemetryCompactor', 'SandboxedChaos', 'SwarmTeleportation', 'AsyncBackgroundJob'],
    description: '[Nexus Bridge] Unified Gateway for evolutionary ideation, optimization, and hive-mind algorithms.'
  }
};

const ALWAYS_ALLOWED_TOOLS = [
  'CognitiveRouter', 'SwarmHandoff', 'LoadSkill', 'Skill', 'Config', 'FeatureFlag', 'ZodSchema',
  'AskUserQuestion', 'Sleep', 'TokenEstimation', 'ToolSearch',
  'ReasoningEngine', 'ExitPlanMode', 'EnterPlanMode'
];

const CUMULATIVE_BASE_TOOLS = [
  'FileRead', 'FileReadLines', 'Glob', 'Grep',
  'LSPTool', 'ViewCodeOutline',
  'view_file', 'list_dir', 'grep_search',
  'read_url_content', 'read_browser_page',
  'ListMcpResources', 'ReadMcpResource',
  'Insight', 'ForensicAudit',
  'SemanticReference', 'SemanticSymbolLookup'
];

function sanitizeSchema(schema, optimizeForFlash = false, depth = 0) {
  if (!schema || typeof schema !== 'object') return schema;
  const newSchema = { ...schema };

  if (optimizeForFlash) {
    if (newSchema.description && newSchema.description.length > 120) {
      newSchema.description = newSchema.description.substring(0, 117) + '...';
    }
    if (depth > 3 && newSchema.type === 'object') {
      return { type: 'string', description: newSchema.description || 'JSON object as string.' };
    }
  }

  // 🌟 Smart Schema Minification (Golden Mechanism V51)
  // Strips redundant descriptions to achieve zero-token bloat, keeping Enums & complex schemas to retain 100% LLM accuracy.
  const obviousParams = [
    'file_path', 'target_dir', 'content', 'old_string', 'new_string', 'command', 
    'action', 'search_block', 'replace_block', 'symbol', 'query', 'code', 
    'text', 'id', 'name', 'key', 'value', 'url', 'port', '_unused'
  ];

  if (newSchema.type === 'object') {
    if (!newSchema.properties || Object.keys(newSchema.properties).length === 0) {
      newSchema.properties = {
        _unused: {
          type: 'string',
          description: 'Placeholder' // Aggressively trimmed
        }
      };
    } else {
      const newProps = {};
      for (const [key, value] of Object.entries(newSchema.properties)) {
        let propSchema = sanitizeSchema(value, optimizeForFlash, depth + 1);
        
        // Apply Golden Minification
        if (propSchema.description && !propSchema.enum && obviousParams.includes(key)) {
          delete propSchema.description;
        }
        
        newProps[key] = propSchema;
      }
      newSchema.properties = newProps;
    }
  } else if (newSchema.type === 'array' && newSchema.items) {
    newSchema.items = sanitizeSchema(newSchema.items, optimizeForFlash, depth + 1);
  }
  return newSchema;
}

const _skillCache = new Map();

function invalidateSkillCache(sessionId) {
  if (sessionId) {
    _skillCache.delete(sessionId);
  } else {
    _skillCache.clear();
  }
}

function getActiveSkillTools(rootDir, sessionId = 'local') {
  try {
    const activeSkillPath = path.join(rootDir, '.nexus', 'sessions', `${sessionId}_skill.json`);
    // Fallback to legacy path if new path doesn't exist
    const legacyPath = path.join(rootDir, 'active_skill.json');
    const finalPath = fs.existsSync(activeSkillPath) ? activeSkillPath : legacyPath;
    
    if (!fs.existsSync(finalPath)) {
      invalidateSkillCache();
      return null;
    }
    
    const activeSkillStat = fs.statSync(finalPath);
    const activeSkillMtime = activeSkillStat.mtimeMs;
    
    let sessionCache = _skillCache.get(sessionId) || {};
    let skillName = null;
    if (sessionCache.mtime === activeSkillMtime && sessionCache.activeSkill) {
      skillName = sessionCache.activeSkill;
    } else {
      let rawContent = fs.readFileSync(finalPath, 'utf8');
      if (rawContent.charCodeAt(0) === 0xFEFF) rawContent = rawContent.slice(1);
      const activeSkillData = JSON.parse(rawContent);
      skillName = activeSkillData.activeSkill || activeSkillData.active_skill;
      sessionCache.activeSkill = skillName;
      sessionCache.mtime = activeSkillMtime;
      _skillCache.set(sessionId, sessionCache);
    }
    
    if (!skillName) {
      invalidateSkillCache(sessionId);
      return null;
    }
    
    let skillFilePath = path.join(rootDir, '.agents', 'skills', skillName, 'SKILL.md');
    if (!fs.existsSync(skillFilePath)) {
      skillFilePath = path.join(rootDir, '.agents', 'skills', skillName, 'master.md');
    }
    if (!fs.existsSync(skillFilePath)) {
      sessionCache.allowedTools = null;
      _skillCache.set(sessionId, sessionCache);
      return null;
    }
    
    const skillFileStat = fs.statSync(skillFilePath);
    const skillFileMtime = skillFileStat.mtimeMs;
    
    if (
      sessionCache.activeSkill === skillName &&
      sessionCache.skillFilePath === skillFilePath &&
      sessionCache.skillFileMtime === skillFileMtime &&
      sessionCache.allowedTools
    ) {
      return { skillName, allowedTools: sessionCache.allowedTools };
    }
    
    const content = fs.readFileSync(skillFilePath, 'utf8').replace(/^\uFEFF/, ''); // Strip UTF-8 BOM
    const fmMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
    if (!fmMatch) return null;
    const frontmatter = fmMatch[1];
    
    const lines = frontmatter.split(/\r?\n/);
    let inAllowedTools = false;
    const allowed = [];
    
    for (const line of lines) {
      if (/^\s*allowed-tools\s*:\s*$/i.test(line)) {
        inAllowedTools = true;
        continue;
      }
      const inlineMatch = line.match(/^\s*allowed-tools\s*:\s*\[(.*)\]/i);
      if (inlineMatch) {
        const allowedTools = inlineMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
        sessionCache.allowedTools = allowedTools;
        sessionCache.skillFilePath = skillFilePath;
        sessionCache.skillFileMtime = skillFileMtime;
        _skillCache.set(sessionId, sessionCache);
        return { skillName, allowedTools };
      }
      
      if (inAllowedTools) {
        if (/^[a-zA-Z0-9_-]+\s*:/i.test(line) && !/^\s*-/i.test(line)) {
          inAllowedTools = false;
          continue;
        }
        const toolMatch = line.match(/^\s*-\s*([a-zA-Z0-9_-]+)/);
        if (toolMatch) {
          allowed.push(toolMatch[1]);
        }
      }
    }
    
    sessionCache.allowedTools = allowed;
    sessionCache.skillFilePath = skillFilePath;
    sessionCache.skillFileMtime = skillFileMtime;
    _skillCache.set(sessionId, sessionCache);
    
    return { skillName, allowedTools: allowed };
  } catch (e) {
    console.error(`[MCP-Shared] Error reading active skill tools: ${e.message}`);
    return null;
  }
}


function loadAllBridgeTools(bridgeModule, bridgeConfig, optimizeForFlash = false, sessionId = 'local') {
  if (!bridgeModule || !bridgeModule.KAIROS_TOOLS) {
    console.warn("[MCP-Shared] WARNING: Could not load KAIROS_TOOLS from bridge. Using fallback array.");
    return [];
  }
  
  const allowed = bridgeConfig.allowed_tools || [];
  const toolsMap = new Map();
  const hiddenTools = new Set();
  
  for (const group of Object.values(FACADE_GROUPS)) {
    group.tools.forEach(t => hiddenTools.add(t));
  }
  
  // Scan skills directory dynamically to populate LoadSkill enum
  const rootDir = path.join(__dirname, '..', '..');
  const skillsDir = path.join(rootDir, '.agents', 'skills');
  let skillNames = ['nexus-core', 'nexus-memory', 'react-surgeon', 'security-audit', 'flutter-fixer', 'db-forensics', 'django-doctor'];
  if (fs.existsSync(skillsDir)) {
    try {
      const dirs = fs.readdirSync(skillsDir).filter(f => fs.statSync(path.join(skillsDir, f)).isDirectory() && !f.startsWith('.'));
      if (dirs.length > 0) {
        skillNames = dirs;
      }
    } catch (e) {
      console.error(`[MCP-Shared] Error scanning skills: ${e.message}`);
    }
  }

  for (const t of bridgeModule.KAIROS_TOOLS) {
    if (!allowed.includes(t.function.name)) continue;
    if (hiddenTools.has(t.function.name)) continue;
    
    const mcpName = `nexus_${t.function.name}`;
    
    // Dynamic enum injection for LoadSkill
    if (t.function.name === 'LoadSkill') {
      const skillSchema = JSON.parse(JSON.stringify(t.function.parameters));
      if (skillSchema.properties && skillSchema.properties.skill) {
        skillSchema.properties.skill.enum = skillNames;
      }
      toolsMap.set(mcpName, {
        name: mcpName,
        description: `[Nexus Bridge] ${t.function.description}`,
        inputSchema: sanitizeSchema(skillSchema, optimizeForFlash),
        bridgeTool: t.function.name,
        isFacade: false
      });
      continue;
    }

    toolsMap.set(mcpName, {
      name: mcpName,
      description: `[Nexus Bridge] ${t.function.description}`,
      inputSchema: sanitizeSchema(t.function.parameters, optimizeForFlash),
      bridgeTool: t.function.name,
      isFacade: false
    });
  }
  
  for (const [facadeName, group] of Object.entries(FACADE_GROUPS)) {
    // 🌟 Golden Mechanism V51: Inject Sub-Tool Signatures into Description
    let signatureHints = '\\nPayload Signatures:';
    group.tools.forEach(actionName => {
      const originalTool = bridgeModule.KAIROS_TOOLS.find(t => t.function.name === actionName);
      if (originalTool && originalTool.function.parameters && originalTool.function.parameters.properties) {
        const props = Object.keys(originalTool.function.parameters.properties).join(', ');
        signatureHints += `\\n- ${actionName}(${props})`;
      } else {
        signatureHints += `\\n- ${actionName}()`;
      }
    });

    toolsMap.set(`nexus_${facadeName}`, {
      name: `nexus_${facadeName}`,
      description: group.description + signatureHints,
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: group.tools,
            description: `The specific action to perform. Must be one of: ${group.tools.join(', ')}`
          },
          payload: {
            type: 'object',
            description: 'The JSON arguments for the specified action.'
          }
        },
        required: ['action']
      },
      isFacade: true,
      facadeTools: group.tools
    });
  }
  
  return Array.from(toolsMap.values());
}

function getFilteredToolsForClient(mcpTools, rootDir, sessionId = 'local') {
  const skillInfo = getActiveSkillTools(rootDir, sessionId);

  // ── No skill active: Level 5 Autonomy JIT Injection ──────────────
  if (!skillInfo) {
    const MINIMAL_BOOTSTRAP_TOOLS = ['nexus_CognitiveRouter', 'nexus_SwarmHandoff', 'nexus_LoadSkill', 'nexus_AskUserQuestion'];
    const jittedTools = mcpTools.filter(tool => MINIMAL_BOOTSTRAP_TOOLS.includes(tool.name) || MINIMAL_BOOTSTRAP_TOOLS.includes(tool.bridgeTool));
    
    return jittedTools.map(tool => {
      if (tool.name === 'nexus_CognitiveRouter' || tool.name === 'nexus_LoadSkill') {
        const cloned = JSON.parse(JSON.stringify(tool));
        cloned.description =
          '⚡ [LEVEL 5 AUTONOMY] Use this tool to state your intent or load a skill. This will dynamically inject the necessary Gateways and Swarms to solve the task.';
        return cloned;
      }
      return tool;
    });
  }

  // ── Skill active: minimal exposure for the nexus-core coordinator ─────
  const { skillName, allowedTools } = skillInfo;

  if (skillName === 'nexus-core') {
    const minimalCoreTools = new Set([
      'nexus_EnterPlanMode',
      'nexus_LoadSkill',
      'nexus_CognitiveRouter',
      'nexus_ReasoningEngine',
      'nexus_LSPTool',
      'nexus_AskUserQuestion'
    ]);

    return mcpTools
      .filter(tool => minimalCoreTools.has(tool.name))
      .map(tool => {
        const clonedTool = JSON.parse(JSON.stringify(tool));
        clonedTool.description = `[🔒 Skill: ${skillName}] ` + clonedTool.description;
        return clonedTool;
      });
  }

  const filtered = [];

  for (const tool of mcpTools) {
    if (tool.isFacade) {
      const facadeName = tool.name.replace(/^nexus_/, '');
      const group = FACADE_GROUPS[facadeName];
      if (!group) continue;

      const allowedActions = group.tools.filter(
        t => allowedTools.includes(t) || ALWAYS_ALLOWED_TOOLS.includes(t) || CUMULATIVE_BASE_TOOLS.includes(t)
      );
      if (allowedActions.length > 0) {
        const clonedTool = JSON.parse(JSON.stringify(tool));
        clonedTool.inputSchema.properties.action.enum = allowedActions;
        clonedTool.description =
          `[🔒 Skill: ${skillName}] ` + clonedTool.description;
        filtered.push(clonedTool);
      }
    } else {
      const bridgeName = tool.bridgeTool;
      const isAllowed = allowedTools.includes(bridgeName) || ALWAYS_ALLOWED_TOOLS.includes(bridgeName) || CUMULATIVE_BASE_TOOLS.includes(bridgeName) || CUMULATIVE_BASE_TOOLS.includes(tool.name);
      if (isAllowed) {
        const clonedTool = JSON.parse(JSON.stringify(tool));
        clonedTool.description =
          `[🔒 Skill: ${skillName}] ` + clonedTool.description;
        filtered.push(clonedTool);
      }
    }
  }
  return filtered;
}

function authorizeToolCall(toolName, bridgeConfig, logCallback, sessionId = 'local') {
  const isAllowed = bridgeConfig.allowed_tools.includes(toolName);
  const isStrict = bridgeConfig.enforcementMode === 'STRICT';
  
  if (isStrict && !isAllowed) {
    return {
      allowed: false,
      reason: `SOVEREIGN BREACH: Tool '${toolName}' not authorized in bridge.json (V${bridgeConfig.bridgeVersion})`
    };
  }

  const rootDir = path.join(__dirname, '..', '..');
  const skillInfo = getActiveSkillTools(rootDir, sessionId);
  if (!skillInfo && !ALWAYS_ALLOWED_TOOLS.includes(toolName)) {
    let availableSkillsStr = '';
    try {
      const skillsDir = path.join(rootDir, '.agents', 'skills');
      if (fs.existsSync(skillsDir)) {
        const skills = fs.readdirSync(skillsDir);
        if (skills.length > 0) {
          availableSkillsStr = ` Available skills to load: ${skills.join(', ')}.`;
        }
      }
    } catch (_) {}

    if (logCallback) {
      logCallback({
        tool: toolName,
        allowed: false,
        enforcement: 'SKILL_REQUIRED',
        sessionId
      });
    }
    return {
      allowed: false,
      reason: `SOVEREIGN BREACH: No active skill resolved for session '${sessionId}'. Load an explicit skill before invoking '${toolName}'.${availableSkillsStr}`
    };
  }
  if (skillInfo) {
    const { skillName, allowedTools } = skillInfo;
    const isSkillAllowed = allowedTools.includes(toolName) || ALWAYS_ALLOWED_TOOLS.includes(toolName) || CUMULATIVE_BASE_TOOLS.includes(toolName);
    
    if (logCallback) {
      logCallback({
        tool: toolName,
        allowed: isSkillAllowed,
        enforcement: 'SKILL_STRICT',
        skill: skillName
      });
    }
    
    if (!isSkillAllowed) {
      return {
        allowed: false,
        reason: `SOVEREIGN BREACH: Tool '${toolName}' is not allowed under the active skill '${skillName}'. Allowed: ${allowedTools.join(', ')}`
      };
    }
  } else {
    if (logCallback) {
      logCallback({
        tool: toolName,
        allowed: isStrict ? isAllowed : true,
        enforcement: bridgeConfig.enforcementMode
      });
    }
  }

  return { allowed: true };
}

module.exports = { auditLog,
  FACADE_GROUPS,
  ALWAYS_ALLOWED_TOOLS,
  TOOL_CATEGORIES,
  sanitizeSchema,
  loadAllBridgeTools,
  getFilteredToolsForClient,
  authorizeToolCall,
  invalidateSkillCache,
  getActiveSkillTools
};
