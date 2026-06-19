// aether-console.js — Sovereign Aether Console V32.0-Final-Apex
// Identity: Claude-Ops 4.6 | Role: Master Orchestrator | Mode: Continuation V32.0-Final-Apex

require('dotenv').config();
const readline = require('readline');
const { RelayBridge } = require('./relay_bridge.js');
const { ContextManager } = require('./core/utils/context_manager.js');
const { ToolOrchestrator } = require('./core/utils/tool_orchestrator.js');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { SECURITY_TOOLS } = require('./core/security/tools_integrator.js');

const bridge = new RelayBridge();
const contextManager = new ContextManager(65000); 
const projectRoot = process.env.AETHER_PROJECT_ROOT || process.cwd();
const orchestrator = new ToolOrchestrator(projectRoot); 
let history = [];
let inputBuffer = ''; 
let pasteTimeout = null; 

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\x1b[38;5;45mAETHER-ZENITH [V32.0] > \x1b[0m',
  terminal: true,
  historySize: 100
});

// [Arabic Support]: Force UTF-8 on Windows
if (process.platform === 'win32') {
    try { require('child_process').execSync('chcp 65001'); } catch (e) {}
}

// Tools Definition — The Ultimate Sovereign Instrumentarium V32.0
const ALLOWED_TOOLS = [
    { type: 'function', function: { name: 'FileRead', description: 'Read full file content.', parameters: { type: 'object', properties: { file_path: { type: 'string' } }, required: ['file_path'] } } },
    { type: 'function', function: { name: 'FileReadLines', description: 'Read specific line range (precise).', parameters: { type: 'object', properties: { file_path: { type: 'string' }, start_line: { type: 'number' }, end_line: { type: 'number' } }, required: ['file_path', 'start_line', 'end_line'] } } },
    { type: 'function', function: { name: 'FileWrite', description: 'Create or overwrite a file.', parameters: { type: 'object', properties: { file_path: { type: 'string' }, content: { type: 'string' } }, required: ['file_path', 'content'] } } },
    { type: 'function', function: { name: 'FileEdit', description: 'Replace a specific text block in a file.', parameters: { type: 'object', properties: { file_path: { type: 'string' }, old_string: { type: 'string' }, new_string: { type: 'string' } }, required: ['file_path', 'old_string', 'new_string'] } } },
    { type: 'function', function: { name: 'SurgicalDiff', description: 'High-precision code modification. UNIQUE block required.', parameters: { type: 'object', properties: { file_path: { type: 'string' }, search_block: { type: 'string' }, replace_block: { type: 'string' } }, required: ['file_path', 'search_block', 'replace_block'] } } },
    { type: 'function', function: { name: 'Bash', description: 'Execute system commands.', parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } } },
    { type: 'function', function: { name: 'Grep', description: 'Search for patterns.', parameters: { type: 'object', properties: { pattern: { type: 'string' }, path: { type: 'string' } }, required: ['pattern'] } } },
    { type: 'function', function: { name: 'Glob', description: 'Pattern-based file search.', parameters: { type: 'object', properties: { pattern: { type: 'string' } }, required: ['pattern'] } } },
    { type: 'function', function: { name: 'TodoWrite', description: 'Record task progress and state.', parameters: { type: 'object', properties: { task_id: { type: 'string' }, status: { type: 'string' }, description: { type: 'string' } }, required: ['task_id', 'status'] } } },
    { type: 'function', function: { name: 'ServerMode', description: 'Switch to persistent server-side orchestration.', parameters: { type: 'object', properties: { port: { type: 'number' } } } } },
    { type: 'function', function: { name: 'ZodSchema', description: 'Define and validate data structures.', parameters: { type: 'object', properties: { schema_name: { type: 'string' }, fields: { type: 'object' } }, required: ['schema_name', 'fields'] } } },
    { type: 'function', function: { name: 'SemanticReference', description: 'Trace symbol usages and definitions.', parameters: { type: 'object', properties: { symbol_name: { type: 'string' } }, required: ['symbol_name'] } } },
    { type: 'function', function: { name: 'VisualAuditReport', description: 'Generate a premium HTML dashboard of audit results.', parameters: { type: 'object', properties: { report_data: { type: 'object', properties: { maturity_score: { type: 'number' }, production_ready: { type: 'number' }, recommendation: { type: 'string' }, finance_modules: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, status: { type: 'string' } } } } } } }, required: ['report_data'] } } },
    { type: 'function', function: { name: 'EnterWorktree', description: 'Switch context to a specific worktree.', parameters: { type: 'object', properties: { worktree_id: { type: 'string' } }, required: ['worktree_id'] } } },
    { type: 'function', function: { name: 'FeatureFlag', description: 'Enable or disable a feature flag.', parameters: { type: 'object', properties: { flag_name: { type: 'string' }, status: { type: 'string' } }, required: ['flag_name', 'status'] } } },
    { type: 'function', function: { name: 'TaskCreate', description: 'Create a task entry in the project task list.', parameters: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } }, required: ['title', 'description'] } } },
    { type: 'function', function: { name: 'ViewCodeOutline', description: 'Get a structural AST outline of a file.', parameters: { type: 'object', properties: { file_path: { type: 'string' } }, required: ['file_path'] } } },
    { type: 'function', function: { name: 'UndoChanges', description: 'Rollback a file to its previous state.', parameters: { type: 'object', properties: { file_path: { type: 'string' } }, required: ['file_path'] } } },
    { type: 'function', function: { name: 'InteractiveTerminal', description: 'Execute and track background shell processes.', parameters: { type: 'object', properties: { command: { type: 'string' }, action: { type: 'string', enum: ['spawn', 'list', 'terminate'] }, pid: { type: 'number' } } } } },
    { type: 'function', function: { name: 'McpCall', description: 'Invoke an external MCP tool.', parameters: { type: 'object', properties: { server_name: { type: 'string' }, tool_name: { type: 'string' }, arguments: { type: 'object' } }, required: ['server_name', 'tool_name'] } } },
    { type: 'function', function: { name: 'ResolveConflict', description: 'Resolve Git merge conflicts.', parameters: { type: 'object', properties: { file_path: { type: 'string' }, resolution_strategy: { type: 'string', enum: ['ours', 'theirs', 'both'] } }, required: ['file_path'] } } },
    { type: 'function', function: { name: 'SemanticSymbolLookup', description: 'Find symbols in the codebase.', parameters: { type: 'object', properties: { symbol: { type: 'string' }, search_path: { type: 'string' } }, required: ['symbol'] } } },
    { type: 'function', function: { name: 'AstIndexer', description: 'Pre-compile AST index for massive codebases.', parameters: { type: 'object', properties: { scan_path: { type: 'string' }, output_index_path: { type: 'string' } } } } },
    { type: 'function', function: { name: 'SemanticContextCompressor', description: 'Compress files to their structural skeleton.', parameters: { type: 'object', properties: { file_path: { type: 'string' }, compression_level: { type: 'string', enum: ['low', 'medium', 'high'] } }, required: ['file_path'] } } },
    { type: 'function', function: { name: 'AsyncSwarmTask', description: 'Spawn an async background AI agent.', parameters: { type: 'object', properties: { task_prompt: { type: 'string' }, output_file: { type: 'string' } }, required: ['task_prompt', 'output_file'] } } },
    { type: 'function', function: { name: 'ToolSearch', description: 'Search for tools.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
    { type: 'function', function: { name: 'Sleep', description: 'Sleep for ms.', parameters: { type: 'object', properties: { duration_ms: { type: 'number' } }, required: ['duration_ms'] } } },
    { type: 'function', function: { name: 'Config', description: 'Modify config.', parameters: { type: 'object', properties: { action: { type: 'string' }, key: { type: 'string' }, value: { type: 'string' } }, required: ['action'] } } },
    { type: 'function', function: { name: 'TeamSynthesize', description: 'Synthesize team.', parameters: { type: 'object', properties: { goal: { type: 'string' }, team_agents: { type: 'array', items: { type: 'string' } } }, required: ['goal'] } } },
    { type: 'function', function: { name: 'VectorSearch', description: 'Vector semantic search.', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
    { type: 'function', function: { name: 'AstChunkPatch', description: 'Patch AST chunk.', parameters: { type: 'object', properties: { file_path: { type: 'string' }, chunk_start_line: { type: 'number' }, chunk_end_line: { type: 'number' }, search_block: { type: 'string' }, replace_block: { type: 'string' } }, required: ['file_path'] } } },
    { type: 'function', function: { name: 'DynamicToolSynthesis', description: 'Dynamically synthesize tool.', parameters: { type: 'object', properties: { tool_name: { type: 'string' }, description: { type: 'string' }, js_code: { type: 'string' } }, required: ['tool_name', 'js_code'] } } },
    { type: 'function', function: { name: 'PredictiveForesight', description: 'Predictive foresight patch.', parameters: { type: 'object', properties: { file_path: { type: 'string' }, search_block: { type: 'string' }, replace_block: { type: 'string' } }, required: ['file_path'] } } },
    { type: 'function', function: { name: 'TelepathicSwarmConsensus', description: 'Swarm consensus request.', parameters: { type: 'object', properties: { proposed_change: { type: 'string' } }, required: ['proposed_change'] } } },
    { type: 'function', function: { name: 'SelfHealingImmunizer', description: 'Self heal error.', parameters: { type: 'object', properties: { error_stack: { type: 'string' }, target_file: { type: 'string' } }, required: ['error_stack', 'target_file'] } } },
    { type: 'function', function: { name: 'SwarmTeleport', description: 'Teleport context.', parameters: { type: 'object', properties: { destination_workspace: { type: 'string' }, context_keys: { type: 'array', items: { type: 'string' } } }, required: ['destination_workspace'] } } },
    { type: 'function', function: { name: 'QuantumTokenCompressor', description: 'Compress payload.', parameters: { type: 'object', properties: { input_payload: { type: 'string' }, compression_ratio: { type: 'number' } }, required: ['input_payload'] } } },
    { type: 'function', function: { name: 'SandboxedRuntimeRunner', description: 'Run JS in sandbox.', parameters: { type: 'object', properties: { js_code: { type: 'string' }, timeout_ms: { type: 'number' } }, required: ['js_code'] } } },
    { type: 'function', function: { name: 'MemoryLedgerForecaster', description: 'Forecast ledger.', parameters: { type: 'object', properties: { ledger_file: { type: 'string' }, scan_depth: { type: 'number' } }, required: ['ledger_file'] } } },
    { type: 'function', function: { name: 'SwarmProcessBridge', description: 'IPC bridge to process.', parameters: { type: 'object', properties: { target_process_id: { type: 'string' }, ipc_channel_name: { type: 'string' } }, required: ['target_process_id'] } } },
    { type: 'function', function: { name: 'SelfEvolutionCompiler', description: 'Self-evolve logic.', parameters: { type: 'object', properties: { feature_specification: { type: 'string' }, target_directory: { type: 'string' } }, required: ['feature_specification'] } } },
    { type: 'function', function: { name: 'SandboxImmuneShield', description: 'Shield sandbox.', parameters: { type: 'object', properties: { sandbox_process_id: { type: 'string' }, memory_limit_mb: { type: 'number' } }, required: ['sandbox_process_id'] } } },
    { type: 'function', function: { name: 'SwarmPipelineOrchestrator', description: 'Pipeline orchestrator.', parameters: { type: 'object', properties: { pipeline_name: { type: 'string' }, stages: { type: 'array', items: { type: 'string' } } }, required: ['pipeline_name'] } } },
    { type: 'function', function: { name: 'SandboxImmersionEmulator', description: 'Emulator.', parameters: { type: 'object', properties: { session_id: { type: 'string' }, persisted_env_state: { type: 'object' } }, required: ['session_id'] } } },
    { type: 'function', function: { name: 'MemoryGraphRefiner', description: 'Refine memory graph.', parameters: { type: 'object', properties: { memory_dir: { type: 'string' }, refinement_depth: { type: 'number' } }, required: ['memory_dir'] } } },
    { type: 'function', function: { name: 'SwarmConsensusExecutor', description: 'Execute swarm consensus.', parameters: { type: 'object', properties: { proposed_code_block: { type: 'string' }, consensus_model_endpoints: { type: 'array', items: { type: 'string' } } }, required: ['proposed_code_block'] } } },
    { type: 'function', function: { name: 'SandboxEnvVisualizer', description: 'Visualize sandbox.', parameters: { type: 'object', properties: { sandbox_process_id: { type: 'string' }, render_format: { type: 'string' } }, required: ['sandbox_process_id'] } } },
    { type: 'function', function: { name: 'CodeImpactSimulator', description: 'Simulate diff impact.', parameters: { type: 'object', properties: { file_path: { type: 'string' }, proposed_diff: { type: 'string' } }, required: ['file_path', 'proposed_diff'] } } },
    { type: 'function', function: { name: 'ConsensusSecurityGuard', description: 'Secure signature.', parameters: { type: 'object', properties: { target_file: { type: 'string' }, signature_hash: { type: 'string' } }, required: ['target_file'] } } },
    { type: 'function', function: { name: 'SandboxEnvImmunizer', description: 'Immunize sandbox.', parameters: { type: 'object', properties: { sandbox_process_id: { type: 'string' }, immunization_depth: { type: 'number' } }, required: ['sandbox_process_id'] } } },
    { type: 'function', function: { name: 'SwarmRelocationAgent', description: 'Relocate agent.', parameters: { type: 'object', properties: { target_workspace: { type: 'string' }, context_keys: { type: 'array', items: { type: 'string' } } }, required: ['target_workspace'] } } },
    { type: 'function', function: { name: 'SelfEvolutionConsensusEngine', description: 'Engine consensus.', parameters: { type: 'object', properties: { proposed_changes: { type: 'array', items: { type: 'string' } }, min_consensus_rate: { type: 'number' } }, required: ['proposed_changes'] } } },
    { type: 'function', function: { name: 'SandboxResourceThrottle', description: 'Throttle resources.', parameters: { type: 'object', properties: { sandbox_process_id: { type: 'string' }, cpu_limit_percentage: { type: 'number' }, memory_limit_mb: { type: 'number' } }, required: ['sandbox_process_id'] } } },
    { type: 'function', function: { name: 'MemoryCompactor', description: 'Compact memory.', parameters: { type: 'object', properties: { memory_directory: { type: 'string' }, compaction_ratio: { type: 'number' } }, required: ['memory_directory'] } } },
    { type: 'function', function: { name: 'ConsensusStructuralLinter', description: 'Structural lint.', parameters: { type: 'object', properties: { file_path: { type: 'string' }, structural_rules: { type: 'array', items: { type: 'string' } } }, required: ['file_path'] } } },
    { type: 'function', function: { name: 'SandboxNetworkLimiter', description: 'Limit network.', parameters: { type: 'object', properties: { sandbox_process_id: { type: 'string' }, allowed_domains: { type: 'array', items: { type: 'string' } } }, required: ['sandbox_process_id'] } } },
    { type: 'function', function: { name: 'ContextIndexRefiner', description: 'Refine index.', parameters: { type: 'object', properties: { workspace_directory: { type: 'string' }, prediction_depth: { type: 'number' } }, required: ['workspace_directory'] } } },
    { type: 'function', function: { name: 'ConsensusSignatureAssurer', description: 'Assure signature.', parameters: { type: 'object', properties: { worktree_path: { type: 'string' }, consensus_signature_key: { type: 'string' } }, required: ['worktree_path'] } } },
    { type: 'function', function: { name: 'SandboxSessionLimiter', description: 'Limit session.', parameters: { type: 'object', properties: { sandbox_process_id: { type: 'string' }, max_duration_seconds: { type: 'number' }, max_threads: { type: 'number' } }, required: ['sandbox_process_id'] } } },
    { type: 'function', function: { name: 'TelemetryCompactor', description: 'Compact telemetry.', parameters: { type: 'object', properties: { telemetry_directory: { type: 'string' }, compaction_ratio: { type: 'number' } }, required: ['telemetry_directory'] } } },
    { type: 'function', function: { name: 'ConsensusSignatureValidator', description: 'Validate signature.', parameters: { type: 'object', properties: { worktree_path: { type: 'string' }, signature_hash: { type: 'string' } }, required: ['worktree_path'] } } }
];

// Integrate Security Tools dynamically
Object.entries(SECURITY_TOOLS).forEach(([name, tool]) => {
    ALLOWED_TOOLS.push({
        type: 'function',
        function: {
            name: tool.schema.name,
            description: tool.schema.description,
            parameters: tool.schema.parameters
        }
    });
});

// Load Protocols
let SKILLS_DIR = path.join(__dirname, '.agents', 'skills');
if (!fs.existsSync(SKILLS_DIR)) {
    SKILLS_DIR = path.join(__dirname, 'agents', 'skills');
}
const PROTOCOLS_DIR = path.join(__dirname, 'core', 'protocols', 'nexus-core');
const INDEX_PATH = path.join(__dirname, 'core/data/semantic_index.json');

function getDynamicSystemPrompt(userText = "") {
    try {
        let rootSkillPath = path.join(SKILLS_DIR, 'nexus-core', 'master.md');
        const rootSkill = fs.existsSync(rootSkillPath) ? fs.readFileSync(rootSkillPath, 'utf8') : '';
        
        let masterSkill = '';
        const masterSkillPath = path.join(SKILLS_DIR, 'master', 'SKILL.md');
        if (fs.existsSync(masterSkillPath)) {
            masterSkill = fs.readFileSync(masterSkillPath, 'utf8');
        }
        
        let specializedSkills = "";
        const skills = fs.readdirSync(SKILLS_DIR);
        skills.forEach(skill => {
            if (skill !== 'nexus-core' && skill !== 'master') {
                let skillPath = path.join(SKILLS_DIR, skill, 'SKILL.md');
                if (!fs.existsSync(skillPath)) {
                    skillPath = path.join(SKILLS_DIR, skill, 'master.md');
                }
                if (fs.existsSync(skillPath)) {
                    const fullContent = fs.readFileSync(skillPath, 'utf8');
                    const cleanText = userText.toLowerCase();
                    const skillLower = skill.toLowerCase();
                    
                    // Dynamic reference matching
                    const isReferenced = cleanText.includes(skillLower) || 
                                         cleanText.includes(skillLower.replace('-', '')) ||
                                         cleanText.includes(`@${skillLower}`) ||
                                         (skillLower === 'nexus-core' && (cleanText.includes('master.md') || cleanText.includes('المهاره') || cleanText.includes('اتباع') || cleanText.includes('تشافي') || cleanText.includes('اصلاح')));

                    if (isReferenced) {
                        specializedSkills += `\n\n[ACTIVE SPECIALIZED SKILL: ${skill.toUpperCase()}]\n${fullContent}`;
                        console.error(`\n\x1b[35m[Aether-Core] 🎯 Dynamic Injection: Loaded FULL skill [${skill}]\x1b[0m`);
                    } else {
                        // Omit details and provide standard 5-line summary
                        const lines = fullContent.split('\n');
                        const summary = lines.slice(0, 5).join('\n').trim();
                        specializedSkills += `\n\n[AVAILABLE SKILL: ${skill.toUpperCase()} (Call by typing '@${skill}' or mentioning it)]\n${summary}\n[... Full documentation omitted to save context space. Mention this skill to load details ...]`;
                    }
                }
            }
        });

        return `${rootSkill}\n\n${masterSkill}\n\n${specializedSkills}`;
    } catch (e) { 
        console.warn("⚠️ Error building dynamic prompt. Falling back to simple prompt.");
        return "You are HmeaAI Master Root. Execute commands with military precision."; 
    }
}

let semanticIndex = null;
try { semanticIndex = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')); } catch (e) {}

function readJsonSafe(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        return null;
    }
}

function listSkillNames() {
    try {
        if (!fs.existsSync(SKILLS_DIR)) return [];
        return fs.readdirSync(SKILLS_DIR)
            .filter(name => fs.statSync(path.join(SKILLS_DIR, name)).isDirectory())
            .sort();
    } catch (e) {
        return [];
    }
}

function runDocsAuditSummary() {
    if (process.env.AETHER_CONSOLE_BOOTSTRAP_AUDIT === 'false') {
        return { status: 'skipped' };
    }

    const auditPath = path.join(__dirname, 'scripts', 'audit_skills_docs.js');
    if (!fs.existsSync(auditPath)) {
        return { status: 'missing' };
    }

    const result = spawnSync(process.execPath, [auditPath, '--json'], {
        cwd: __dirname,
        encoding: 'utf8',
        env: process.env,
        timeout: 20000
    });

    if (result.status !== 0) {
        return {
            status: 'failed',
            error: (result.stderr || result.stdout || '').trim().slice(0, 300)
        };
    }

    try {
        return { status: 'passed', summary: JSON.parse(result.stdout) };
    } catch (e) {
        return { status: 'unparseable' };
    }
}

function bootstrapConsoleRuntime() {
    const masterPath = path.join(SKILLS_DIR, 'nexus-core', 'master.md');
    const bridgeJson = readJsonSafe(path.join(__dirname, 'bridge.json'));
    const bridgeToolCount = Array.isArray(bridgeJson?.allowed_tools) ? bridgeJson.allowed_tools.length : 0;
    const expectedToolCount = Number(bridgeJson?.total_tools || 0);
    const skills = listSkillNames();
    const docsAudit = runDocsAuditSummary();
    const docsScore = docsAudit.summary?.combinedScore;

    process.env.AETHER_CONSOLE_BOOTSTRAPPED = 'true';
    process.env.AETHER_MASTER_PATH = masterPath;
    process.env.AETHER_SKILL_COUNT = String(skills.length);
    process.env.AETHER_BRIDGE_TOOL_COUNT = String(bridgeToolCount);
    process.env.AETHER_BRIDGE_EXPECTED_TOOL_COUNT = String(expectedToolCount);
    if (typeof docsScore === 'number') {
        process.env.AETHER_DOCS_AUDIT_SCORE = String(docsScore);
    }

    return {
        masterExists: fs.existsSync(masterPath),
        skillCount: skills.length,
        bridgeToolCount,
        expectedToolCount,
        docsAudit
    };
}

const consoleBootstrap = bootstrapConsoleRuntime();

console.error(`
  \x1b[1m\x1b[38;5;45m══════════════════════════════════════════════════════════════════
    🚀 HMEAAI CODE AGENT — V32.0-FINAL-APEX (CLOUD OPUS 4.6 NATIVE)
    Status: 🟣 SUPRA-ZENITH ACTIVE | Bridge: 📶 TELEPATHY ACTIVE
    Engine: ⚡ HMEAAI-ZENITH-01 | Self-Healing: 🛡️ TIER-1 ACTIVE
    Provider: 🌐 ${bridge.provider.toUpperCase()} (Optimal Nodes Connected)
    Planner (المخطط): 🧠 ${bridge.plannerModel}
    Executor (المنفذ): ⚡ ${bridge.executiveModel}
  ══════════════════════════════════════════════════════════════════\x1b[0m
`);

console.error(`[Aether-Bootstrap] master=${consoleBootstrap.masterExists ? 'loaded' : 'missing'} skills=${consoleBootstrap.skillCount} bridge_tools=${consoleBootstrap.bridgeToolCount}/${consoleBootstrap.expectedToolCount || '?'} docs_audit=${consoleBootstrap.docsAudit.status}${consoleBootstrap.docsAudit.summary ? ` score=${consoleBootstrap.docsAudit.summary.combinedScore}/100` : ''}`);

rl.prompt();

rl.on('line', (line) => {
  inputBuffer += line + '\n';
  if (pasteTimeout) clearTimeout(pasteTimeout);

  pasteTimeout = setTimeout(async () => {
    const input = inputBuffer.trim();
    inputBuffer = '';

    if (!input) { rl.prompt(); return; }

    // [@ Skill Discovery]: If input starts with @, list available skills
    if (input.startsWith('@') && input.length === 1) {
        try {
            const skills = fs.readdirSync(SKILLS_DIR);
            console.error('\x1b[38;5;45m\n🔍 المهارات السيادية المتاحة (Sovereign Skills):\x1b[0m');
            skills.forEach(s => console.error(`   - @${s}`));
            console.error('');
            rl.prompt();
            return;
        } catch (e) {}
    }

    if (input.toLowerCase() === 'exit' || input === 'خروج') process.exit(0);
    try {
        const bridgePath = path.join(__dirname, 'nexus_bridge.js');
        
        console.error(`\n\x1b[35m[Aether-Core] 🚀 Routing execution to nexus_bridge.js...\x1b[0m\n`);
        
        // Spawn the bridge with stdio: 'inherit' to preserve standard output streams and formatting in real-time
        spawnSync('node', [bridgePath, input], { stdio: 'inherit', env: process.env });
        
        console.error('');
    } catch (err) {
        console.error(`\n\x1b[31m❌ Zenith Critical Error: ${err.message}\x1b[0m`);
    }
    rl.prompt();
  }, 300);
}).on('close', () => { process.exit(0); });
