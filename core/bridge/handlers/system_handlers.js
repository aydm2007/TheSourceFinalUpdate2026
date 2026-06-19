const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

function redactSecretValue(value) {
    if (value === undefined || value === null) return value;
    return String(value)
        .replace(/sk-[A-Za-z0-9_-]{10,}/g, '[REDACTED_SECRET]')
        .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]+=*/gi, '$1[REDACTED_SECRET]')
        .replace(/([?&](?:api[_-]?key|apikey|token|secret|password)=)[^&\s]+/gi, '$1[REDACTED_SECRET]');
}

function buildRestrictedEnv(extra = {}) {
    const allowedPrefixes = ['PATH', 'Path', 'PATHEXT', 'SYSTEMROOT', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'COMSPEC', 'WINDIR'];
    const env = {};
    for (const key of allowedPrefixes) {
        if (process.env[key]) env[key] = process.env[key];
    }
    return { ...env, ...extra };
}

async function Bash(args, context) {
    const safety = context.validateSafety(args.command);
    if (!safety.safe) return safety.reason;
    
    // Bypass Detection: Block direct file-write commands that circumvent guardrails
    const fileWriteBypassPatterns = [
        /\becho\b.*\s+>+\s+\S+\.(js|ts|py|json)/i,
        /Set-Content\s+/i,
        /Out-File\s+/i,
        /\btee\b.*\s+\S+\.(js|ts|py|json)/i
    ];
    const bypassDetected = fileWriteBypassPatterns.some(p => p.test(args.command));
    if (bypassDetected && !context.isBypassActive()) {
        context.logShadow({ type: 'BYPASS_ATTEMPT', command: args.command.substring(0, 100) });
        return `[SOVEREIGN-BLOCK] Bash file-write bypass detected. Use FileEdit or FileWrite tools to modify source files — they enforce context verification and syntax rollback protection.`;
    }
    
    let stdoutAccumulator = '';
    let stderrAccumulator = '';
    try {
        const commandCwd = args.cwd || context.projectPath || process.cwd();
        const commandArgs = args.args || [];
        const extraEnv = args.env || {};
        const output = await new Promise((resolve, reject) => {
            const child = spawn(args.command, commandArgs, { 
                shell: 'powershell.exe',
                cwd: commandCwd,
                env: buildRestrictedEnv({ CWD: commandCwd, ...extraEnv })
            });
            const timer = setTimeout(() => {
                try { child.kill(); } catch (e) {}
                reject(new Error('Command execution timed out after 60000ms'));
            }, 60000);
            
            child.stdout.on('data', (data) => {
                stdoutAccumulator += data.toString();
            });
            child.stderr.on('data', (data) => {
                stderrAccumulator += data.toString();
            });
            child.on('close', (code) => {
                clearTimeout(timer);
                if (code === 0) {
                    resolve(stdoutAccumulator);
                } else {
                    reject(new Error(stdoutAccumulator + stderrAccumulator || `Command exited with code ${code}`));
                }
            });
            child.on('error', (err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
        // -- Terminal Symbiosis (0-Token color parsing) --
        let finalOutput = stdoutAccumulator + stderrAccumulator;
        
        // Semantic Error Extractor (Colors + Keywords)
        const ansiRedRegex = /\x1b\[31m(.*?)\x1b\[0m/g;
        const semanticRegex = /^(?:.*?(?:Error|Exception|Failed|Fatal|Traceback|Panic|Err):.*)$/gim;
        
        let extractedErrors = new Set();
        let match;
        
        while ((match = ansiRedRegex.exec(finalOutput)) !== null) {
            if (match[1].trim()) extractedErrors.add(match[1].trim());
        }
        while ((match = semanticRegex.exec(finalOutput)) !== null) {
            if (match[0].trim()) extractedErrors.add(match[0].trim().replace(/\x1b\[[0-9;]*m/g, ''));
        }
        
        let errorsArray = Array.from(extractedErrors);
        if (errorsArray.length > 0) {
             finalOutput += `\n\n[Terminal Symbiosis] Semantic Extractor detected ${errorsArray.length} Errors in output:\n` + JSON.stringify(errorsArray.slice(0, 5), null, 2);
        }

        return context.applyTokenGuard(finalOutput || 'Success.');
    } catch (e) {
        context.setConsecutiveFailures(context.getConsecutiveFailures() + 1);
        
        let errorMessage = `Execution Error: ${e.message}`;

        const ansiRedRegex = /\x1b\[31m(.*?)\x1b\[0m/g;
        const semanticRegex = /^(?:.*?(?:Error|Exception|Failed|Fatal|Traceback|Panic|Err):.*)$/gim;
        let extractedErrors = new Set();
        let match;
        while ((match = ansiRedRegex.exec(e.message)) !== null) {
            if (match[1].trim()) extractedErrors.add(match[1].trim());
        }
        while ((match = semanticRegex.exec(e.message)) !== null) {
            if (match[0].trim()) extractedErrors.add(match[0].trim().replace(/\x1b\[[0-9;]*m/g, ''));
        }
        
        let errorsArray = Array.from(extractedErrors);
        if (errorsArray.length > 0) {
             errorMessage += `\n[Terminal Symbiosis] Semantic Extracted Errors:\n` + JSON.stringify(errorsArray.slice(0, 5), null, 2);
        }
        
        return context.applyTokenGuard(errorMessage);
    }
}

async function SystemDiagnostics(args, context) {
    const os = require('os');
    return JSON.stringify({
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
        cpus: os.cpus().length,
        total_memory: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
        free_memory: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
        uptime: `${Math.round(os.uptime())}s`,
        env_vars: Object.keys(process.env)
            .filter(k => !/(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH)/i.test(k))
            .slice(0, 15)
    }, null, 2);
}

async function FeatureFlag(args, context) {
    if (args.action === 'set') {
        context.FEATURE_FLAGS[args.key] = args.value;
        return `[FeatureFlag] Flag "${args.key}" successfully set to ${args.value}.`;
    } else {
        return args.key ? `[FeatureFlag] Flag "${args.key}" is ${context.FEATURE_FLAGS[args.key]}` : `[FeatureFlag] Active Flags:\n` + JSON.stringify(context.FEATURE_FLAGS, null, 2);
    }
}

async function ZodSchema(args, context) {
    return `[ZodSchema] Active Validation Rules:\n` +
           `- ToolArgsSchema: file_path (string, opt), limit (number, opt), offset (number, opt)\n` +
           `- FileEditSchema: file_path (string), old_string (string), new_string (string)\n` +
           `- BashSchema: command (string)\n` +
           `- All new tools validate strictly via pre-compiled engine schemas.`;
}

async function Config(args, context) {
    const allowedToolsPath = path.join(context.__dirname, '.agents', 'settings', 'allowed-tools.json');
    if (args.action === 'read') {
        if (fs.existsSync(allowedToolsPath)) {
            return `[Config] Current allowed-tools:\n` + fs.readFileSync(allowedToolsPath, 'utf8');
        } else {
            return `[Config] Settings file not found.`;
        }
    } else if (args.action === 'get') {
        const val = process.env[args.key];
        if (!val) return `[Config] ${args.key} is not set.`;
        if (/(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH)/i.test(args.key)) {
            return `[Config] ${args.key} is set. Value redacted.`;
        }
        return `[Config] ${args.key} = "${redactSecretValue(val)}"`;
    } else {
        if (args.key && args.value !== undefined) {
            process.env[args.key] = args.value;
        }
        return `[Config] Updated "${args.key}" successfully.`;
    }
}

async function Sleep(args, context) {
    await new Promise(resolve => setTimeout(resolve, args.duration_ms || 100));
    return `[Sleep] Completed sleep for ${args.duration_ms}ms.`;
}

async function TokenEstimation(args, context) {
    const words = (args.text || '').split(/\s+/).length;
    return `[TokenEstimation] Estimated tokens: ${Math.round(words * 1.3)} tokens.`;
}

async function ToolSearch(args, context) {
    const q = (args.query || '').toLowerCase().trim();
    if (!q) return '[ToolSearch] Error: query parameter is required.';

    const toolList = context.tools || [];
    if (!toolList.length) return '[ToolSearch] Warning: Tool registry is empty in this context.';

    // Helper: safely extract name/description from both {function:{name,description}} and {name,description} schemas
    const getName = t => (t.function?.name || t.name || '').toLowerCase();
    const getDesc = t => (t.function?.description || t.description || '').toLowerCase();
    const getDisplayName = t => t.function?.name || t.name || 'unknown';
    const getDisplayDesc = t => (t.function?.description || t.description || '').substring(0, 100);

    // ── Strategy 1: Exact phrase match in name or description ────────────────
    const exactMatches = toolList.filter(t => getName(t).includes(q) || getDesc(t).includes(q));
    if (exactMatches.length > 0) {
        const preview = exactMatches.slice(0, 15).map(m => `  ✅ ${getDisplayName(m)}: ${getDisplayDesc(m)}`).join('\n');
        return `[ToolSearch] "${args.query}" — ${exactMatches.length} match(es) (${toolList.length} total tools):\n${preview}`;
    }

    // ── Strategy 2: Multi-keyword search (split query into tokens) ───────────
    const stopWords = new Set(['the','a','an','is','for','to','and','or','how','are','that','with','this']);
    const keywords = q.split(/\s+/).filter(k => k.length > 2 && !stopWords.has(k));
    if (keywords.length > 1) {
        const kwMatches = toolList.filter(t =>
            keywords.some(k => getName(t).includes(k) || getDesc(t).includes(k))
        );
        if (kwMatches.length > 0) {
            kwMatches.sort((a, b) => {
                const scoreA = keywords.filter(k => getName(a).includes(k) || getDesc(a).includes(k)).length;
                const scoreB = keywords.filter(k => getName(b).includes(k) || getDesc(b).includes(k)).length;
                return scoreB - scoreA;
            });
            const preview = kwMatches.slice(0, 10).map(m => `  🔍 ${getDisplayName(m)}: ${getDisplayDesc(m)}`).join('\n');
            return `[ToolSearch] "${args.query}" — ${kwMatches.length} keyword match(es):\n${preview}`;
        }
    }

    // ── Strategy 3: Fuzzy name match (query as substring of camelCase parts) ─
    const fuzzyMatches = toolList.filter(t => {
        const name = getName(t);
        // Match if query chars appear in order in the tool name (subsequence match)
        let qi = 0;
        for (let ni = 0; ni < name.length && qi < q.length; ni++) {
            if (name[ni] === q[qi]) qi++;
        }
        return qi === q.length;
    });
    if (fuzzyMatches.length > 0 && fuzzyMatches.length <= 20) {
        const preview = fuzzyMatches.slice(0, 8).map(m => `  🔮 ${getDisplayName(m)}: ${getDisplayDesc(m)}`).join('\n');
        return `[ToolSearch] No exact match for "${args.query}". Fuzzy suggestions (${fuzzyMatches.length}):\n${preview}`;
    }

    return `[ToolSearch] No tools found matching "${args.query}". Total tools available: ${toolList.length}\n` +
           `💡 Try: a tool name fragment (e.g. "ledger", "file", "bash", "swarm") or use OmegaDiagnostic to list all tools.`;
}


async function InteractiveTerminal(args, context) {
    const sessionFile = require('path').join(context.__dirname, 'scratch', 'terminal_sessions.json');
    const action = args.action || 'spawn';
    
    let sessions = {};
    if (require('fs').existsSync(sessionFile)) {
        try { sessions = JSON.parse(require('fs').readFileSync(sessionFile, 'utf8')); } catch(e){}
    }

    if (action === 'list') {
        const active = Object.entries(sessions).map(([id, data]) => `- Session ID: ${id} (PID: ${data.pid || data})`).join('\n');
        return active ? `[InteractiveTerminal] Active Sessions:\n${active}` : `[InteractiveTerminal] No active terminal sessions.`;
    }

    if (action === 'terminate') {
        const sid = args.session_id;
        if (!sid || !sessions[sid]) { return `[InteractiveTerminal] Error: Session ${sid} not found.`; }
        try { process.kill(sessions[sid].pid || sessions[sid], 'SIGTERM'); } catch(e) {}
        delete sessions[sid];
        require('fs').writeFileSync(sessionFile, JSON.stringify(sessions));
        return `[InteractiveTerminal] Session ${sid} terminated successfully.`;
    }

    if (action === 'read') {
        const sid = args.session_id;
        if (!sid || !sessions[sid]) return `[InteractiveTerminal] Error: Session ${sid} not found.`;
        const logFile = sessions[sid].log;
        if (logFile && require('fs').existsSync(logFile)) {
            const content = require('fs').readFileSync(logFile, 'utf8');
            return `[InteractiveTerminal] Session ${sid} stream output:\n${context.applyTokenGuard(content)}`;
        }
        return `[InteractiveTerminal] No stream output available for session ${sid}.`;
    }

    const itCwd = args.cwd || process.cwd();
    const safety = context.validateSafety(args.command || '');
    if (!safety.safe) { return safety.reason; }
    try {
        if (args.command.startsWith('echo')) {
            const output = require('child_process').execSync(args.command, { cwd: itCwd, timeout: 30000, encoding: 'utf8', maxBuffer: 1024 * 1024 });
            return `[InteractiveTerminal] Session executed successfully.\n--- Output ---\n${context.applyTokenGuard(output)}`;
        } else {
            const sessionId = `tty_${Date.now()}`;
            const logFile = require('path').join(context.__dirname, 'scratch', `${sessionId}.log`);
            const out = require('fs').openSync(logFile, 'a');
            const err = require('fs').openSync(logFile, 'a');
            
            const proc = require('child_process').spawn(args.command, args.args || [], { cwd: itCwd, shell: true, detached: true, stdio: ['ignore', out, err] });
            proc.unref();
            sessions[sessionId] = { pid: proc.pid, log: logFile };
            require('fs').writeFileSync(sessionFile, JSON.stringify(sessions));
            return `[InteractiveTerminal] Streaming Session spawned successfully.\n- Session ID: ${sessionId}\n- PID: ${proc.pid}\n- Log: ${logFile}\nUse action='read' to stream the output.`;
        }
    } catch (e) {
        return `[InteractiveTerminal] Execution error: ${e.message}`;
    }
}

async function PowerShell(args, context) {
    const safety = context.validateSafety(args.command);
    if (!safety.safe) return safety.reason;
    try {
        const output = await new Promise((resolve, reject) => {
            const child = spawn(args.command, [], { 
                shell: 'powershell.exe',
                env: buildRestrictedEnv()
            });
            let stdoutAccumulator = '';
            let stderrAccumulator = '';
            const timer = setTimeout(() => {
                try { child.kill(); } catch (e) {}
                reject(new Error('PowerShell execution timed out after 30000ms'));
            }, 30000);
            
            child.stdout.on('data', (data) => {
                stdoutAccumulator += data.toString();
            });
            child.stderr.on('data', (data) => {
                stderrAccumulator += data.toString();
            });
            child.on('close', (code) => {
                clearTimeout(timer);
                if (code === 0) {
                    resolve(stdoutAccumulator);
                } else {
                    reject(new Error(stdoutAccumulator + stderrAccumulator || `PowerShell exited with code ${code}`));
                }
            });
            child.on('error', (err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
        return context.applyTokenGuard(output || 'Success.');
    } catch (e) {
        return `PowerShell Execution Error: ${e.message}`;
    }
}

async function OmegaDiagnostic(args, context) {
    const auditResults = {
        agent: context.KAIROS_IDENTITY,
        protocol: context.OMEGA_PROTOCOL_VERSION,
        safety_level: context.SAFETY_LEVEL,
        tools_count: context.tools ? context.tools.length : 0,
        memory: fs.existsSync('CLAUDE.md') ? "Permanent (CLAUDE.md Active)" : "Missing",
        timestamp: new Date().toISOString()
    };
    return `ZERO_EXIT_CONFIRMED: KAIROS is Operational.\n${JSON.stringify(auditResults, null, 2)}`;
}

async function ServerMode(args, context) {
    const serversFile = path.join(context.__dirname, 'scratch', 'servers.json');
    let servers = {};
    if (fs.existsSync(serversFile)) {
        try { servers = JSON.parse(fs.readFileSync(serversFile, 'utf8')); } catch(e) {}
    }
    if (args.action === 'start') {
        const { spawn } = require('node:child_process');
        const logPath = path.join(context.__dirname, 'scratch', `server_${args.port || Date.now()}.log`);
        const out = fs.openSync(logPath, 'a');
        const err = fs.openSync(logPath, 'a');
        const cmdParts = args.command.split(' ');
        const child = spawn(cmdParts[0], cmdParts.slice(1), {
            detached: true,
            stdio: ['ignore', out, err]
        });
        child.unref();
        servers[args.port || child.pid] = { pid: child.pid, command: args.command, port: args.port, log: logPath, status: 'running' };
        fs.writeFileSync(serversFile, JSON.stringify(servers, null, 2));
        return `[ServerMode] Started "${args.command}" on PID ${child.pid}. Output log: scratch/server_${args.port || child.pid}.log`;
    } else if (args.action === 'stop') {
        const key = args.port || Object.keys(servers).find(k => servers[k].command.includes(args.command || ''));
        if (key && servers[key]) {
            const pid = servers[key].pid;
            try {
                process.kill(pid, 'SIGTERM');
                return `[ServerMode] Stopped server on PID ${pid}.`;
            } catch(e) {
                return `[ServerMode] Stopped server (PID ${pid} was not running).`;
            }
            delete servers[key];
            fs.writeFileSync(serversFile, JSON.stringify(servers, null, 2));
        } else {
            return `[ServerMode] No running server found matching the query.`;
        }
    } else {
        return `[ServerMode] Active Servers:\n` + JSON.stringify(servers, null, 2);
    }
}

module.exports = {
    Bash,
    SystemDiagnostics,
    FeatureFlag,
    ZodSchema,
    Config,
    Sleep,
    TokenEstimation,
    ToolSearch,
    InteractiveTerminal,
    PowerShell,
    OmegaDiagnostic,
    ServerMode
};
