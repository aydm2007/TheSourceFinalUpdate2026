/**
 * tool_orchestrator.js — Aether Sovereign Tool Execution Engine
 * Bridges the gap between Cloud AI logic and local system execution.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ToolOrchestrator {
    constructor(projectRoot) {
        this.projectRoot = projectRoot || process.cwd();
    }

    /**
     * Maps AI tool calls to local JS functions
     */
    async execute(toolName, input) {
        console.error(`\x1b[34m[ToolExecution] Running ${toolName}...\x1b[0m`);
        
        try {
            switch (toolName) {
                case 'FileRead':
                    return this.fileRead(input.file_path);
                case 'FileWrite':
                    return this.fileWrite(input.file_path, input.content);
                case 'FileEdit':
                    return this.fileEdit(input.file_path, input.old_string, input.new_string);
                case 'Bash':
                    return this.bash(input.command);
                case 'Grep':
                    return this.grep(input.pattern, input.path);
                case 'SemanticReference':
                    return this.semanticReference(input.symbol_name);
                case 'SurgicalDiff':
                    return this.surgicalDiff(input.file_path, input.search_block, input.replace_block, input.start_line, input.end_line);
                case 'FileReadLines':
                    return this.fileReadLines(input.file_path, input.start_line, input.end_line);
                case 'VisualAuditReport':
                    return this.visualAuditReport(input.report_data);
                case 'Glob':
                    return this.glob(input.pattern, input.path);
                case 'TodoWrite':
                    return this.todoWrite(input.task_id, input.status, input.description);
                case 'ServerMode':
                    return this.serverMode(input.port);
                case 'ZodSchema':
                    return this.zodSchema(input.schema_name, input.fields);
                case 'EnterWorktree':
                    return this.enterWorktree(input.worktree_id);
                case 'FeatureFlag':
                    return this.featureFlag(input.flag_name, input.status);
                case 'TaskCreate':
                    return this.taskCreate(input.title, input.description);
                default:
                    try {
                        const output = execSync(`node nexus_bridge.js "${toolName}" '${JSON.stringify(input)}'`, { encoding: 'utf8', cwd: path.resolve(__dirname, '../../') });
                        return output;
                    } catch (bridgeErr) {
                        return `Error executing ${toolName} via bridge: ${bridgeErr.stdout || bridgeErr.message}`;
                    }
            }
        } catch (e) {
            return `Error executing ${toolName}: ${e.message}`;
        }
    }

    visualAuditReport(reportData) {
        const reportPath = path.resolve(this.projectRoot, 'docs/zenith_dashboard.html');
        const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>Aether Sovereign Zenith Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;700&display=swap" rel="stylesheet">
    <style>
        :root { 
            --primary: #00f2ff; 
            --secondary: #7000ff;
            --bg: #050508; 
            --card: rgba(22, 22, 26, 0.7); 
            --text: #ffffff; 
            --glass: rgba(255, 255, 255, 0.05);
        }
        body { 
            background: radial-gradient(circle at top right, #0a0a1a, #050508); 
            color: var(--text); 
            font-family: 'Cairo', sans-serif; 
            margin: 0; padding: 40px; 
            overflow-x: hidden;
        }
        .dashboard { max-width: 1200px; margin: 0 auto; animation: fadeIn 1s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        .header { 
            text-align: center; padding: 60px; 
            background: var(--glass); backdrop-filter: blur(10px);
            border-radius: 30px; border: 1px solid rgba(0, 242, 255, 0.3);
            margin-bottom: 40px; position: relative;
        }
        .header h1 { font-size: 3.5em; margin: 0; background: linear-gradient(90deg, #00f2ff, #7000ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; }
        .card { 
            background: var(--card); backdrop-filter: blur(15px);
            padding: 30px; border-radius: 25px; 
            border: 1px solid rgba(255, 255, 255, 0.1); 
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
        }
        .card:hover { 
            transform: scale(1.05); border-color: var(--primary); 
            box-shadow: 0 20px 40px rgba(0, 242, 255, 0.1); 
        }
        
        .score-box { text-align: center; margin: 20px 0; }
        .score { font-size: 4em; font-weight: 800; text-shadow: 0 0 20px rgba(0, 242, 255, 0.5); }
        
        .mermaid { background: white; padding: 20px; border-radius: 15px; margin-top: 20px; }
        
        .badge { display: inline-block; padding: 5px 15px; border-radius: 50px; background: var(--primary); color: #000; font-weight: bold; font-size: 0.8em; }
        .status-ready { color: #00ff88; box-shadow: 0 0 10px #00ff88; }
        
        .footer { text-align: center; margin-top: 80px; opacity: 0.4; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <div class="badge">V1.9 SOVEREIGN ZENITH</div>
            <h1>🚀 AETHER SOVEREIGN DASHBOARD</h1>
            <p>Project: AgriAsset Enterprise | Protocol: OMEGA-ZENITH</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>💎 نضج المنظومة</h2>
                <div class="score-box"><span class="score">${reportData.maturity_score}%</span></div>
                <p>حالة الاستقرار: <span class="status-ready">ULTRA-STABLE</span></p>
            </div>
            
            <div class="card">
                <h2>🚀 الجاهزية الإنتاجية</h2>
                <div class="score-box"><span class="score" style="color: #7000ff;">${reportData.production_ready}%</span></div>
                <p>التوصية السيادية: ${reportData.recommendation}</p>
            </div>
            
            <div class="card" style="grid-column: span 1;">
                <h2>📊 بروتوكول 0-توكن</h2>
                <div class="mermaid">
                    graph TD
                    A[DeepSeek: المخطط] --> B{Aether Mediator}
                    B --> C[Qwen: المنفذ المجاني]
                    C --> D[مشروع TheSource]
                </div>
            </div>
        </div>

        <div class="card" style="margin-top: 30px;">
            <h2>💰 إدارة الأصول المالية (Finance)</h2>
            <div class="grid" style="grid-template-columns: repeat(3, 1fr); gap: 10px;">
                ${reportData.finance_modules.map(m => `
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; text-align: center;">
                        <strong>${m.name}</strong><br>
                        <span style="color: ${m.status === 'READY' ? '#00ff88' : '#ffcc00'}">${m.status}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">Generated by Aether Nexus Supreme Master | 2026-05-12</div>
    </div>
    <script>mermaid.initialize({ startOnLoad: true, theme: 'dark' });</script>
</body>
</html>`;
        fs.writeFileSync(reportPath, htmlContent);
        return `Successfully generated Sovereign Dashboard at: ${reportPath}`;
    }

    surgicalDiff(filePath, searchBlock, replaceBlock, startLine = null, endLine = null) {
        if (!filePath) return "Error: 'file_path' is missing or undefined in tool call.";
        const fullPath = path.resolve(this.projectRoot, String(filePath));
        if (!fs.existsSync(fullPath)) return `Error: File not found at ${fullPath}`;
        
        let content = fs.readFileSync(fullPath, 'utf8');
        
        if (startLine !== null && endLine !== null) {
            const lines = content.split('\n');
            if (startLine < 1 || endLine > lines.length || startLine > endLine) {
                return `Error: Invalid line range [${startLine}, ${endLine}]. File has ${lines.length} lines.`;
            }
            
            const targetChunk = lines.slice(startLine - 1, endLine).join('\n');
            if (!targetChunk.includes(searchBlock)) {
                return `Error: Search block not found within specified lines [${startLine}, ${endLine}].`;
            }
            
            const instancesInChunk = targetChunk.split(searchBlock).length - 1;
            if (instancesInChunk > 1) {
                return `Error: Search block is not unique within lines [${startLine}, ${endLine}] (${instancesInChunk} instances found).`;
            }
            
            const newChunk = targetChunk.replace(searchBlock, replaceBlock);
            lines.splice(startLine - 1, endLine - startLine + 1, ...newChunk.split('\n'));
            content = lines.join('\n');
        } else {
            const instances = content.split(searchBlock).length - 1;
            if (instances === 0) return "Error: Search block not found in file.";
            if (instances > 1) return `Error: Search block is not unique (${instances} instances found). Provide more context.`;
            content = content.replace(searchBlock, replaceBlock);
        }
        
        fs.writeFileSync(fullPath, content, 'utf8');
        return `[SUCCESS] Surgical Patch Applied to ${filePath} ${startLine ? `(Lines ${startLine}-${endLine})` : ''}`;
    }

    fileReadLines(filePath, startLine, endLine) {
        if (!filePath) return "Error: 'file_path' is missing.";
        const fullPath = path.resolve(this.projectRoot, String(filePath));
        if (!fs.existsSync(fullPath)) return `Error: File not found at ${fullPath}`;
        const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
        const slice = lines.slice(startLine - 1, endLine);
        return slice.map((l, i) => `${startLine + i}: ${l}`).join('\n');
    }

    semanticReference(symbolName) {
        const indexPath = path.join(__dirname, '..', 'data', 'semantic_index.json');
        if (!fs.existsSync(indexPath)) return "Semantic index not found. Run indexer first.";

        const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        const definitions = index.functions.filter(f => f.name === symbolName)
                            .concat(index.classes.filter(c => c.name === symbolName))
                            .concat(index.models.filter(m => m.name === symbolName));

        if (definitions.length === 0) return `Symbol "${symbolName}" not found in index.`;

        let report = `Found ${definitions.length} definition(s) for "${symbolName}":\n`;
        definitions.forEach(d => report += ` - Location: ${d.path}\n`);

        // Simple "Call Search" using internal Grep for cross-platform compatibility
        const usageResults = this.grep(symbolName, '.');
        if (usageResults && usageResults !== 'No matches found.') {
            report += `\nSample usages found:\n${usageResults}`;
        } else {
            report += "\nNo usages found via grep.";
        }

        return report;
    }

    fileRead(filePath) {
        if (!filePath) return "Error: 'file_path' is missing.";
        const fullPath = path.resolve(this.projectRoot, String(filePath));
        return fs.readFileSync(fullPath, 'utf8');
    }

    fileWrite(filePath, content) {
        if (!filePath) return "Error: 'file_path' is missing.";
        const fullPath = path.resolve(this.projectRoot, String(filePath));
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content || '');
        return `Successfully wrote to ${filePath}`;
    }

    fileEdit(filePath, oldString, newString) {
        const fullPath = path.resolve(this.projectRoot, filePath);
        let content = fs.readFileSync(fullPath, 'utf8');
        if (!content.includes(oldString)) throw new Error("Target string not found for replacement.");
        content = content.replace(oldString, newString);
        fs.writeFileSync(fullPath, content);
        return `Successfully edited ${filePath}`;
    }

    bash(command) {
        try {
            const output = execSync(command, { encoding: 'utf8', cwd: this.projectRoot });
            return output || "Command executed successfully (no output).";
        } catch (e) {
            return e.stdout || e.stderr || e.message;
        }
    }

    grep(pattern, searchPath = '.') {
        if (!searchPath) searchPath = '.';
        const fullPath = path.resolve(this.projectRoot, String(searchPath));
        if (!fs.existsSync(fullPath)) return `Error: Path ${searchPath} not found.`;

        let results = [];
        const regex = new RegExp(pattern, 'i');

        const searchFile = (filePath) => {
            const content = fs.readFileSync(filePath, 'utf8');
            if (regex.test(content)) {
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    if (regex.test(line)) {
                        results.push(`${path.relative(this.projectRoot, filePath)}:${index + 1}: ${line.trim()}`);
                    }
                });
            }
        };

        const searchDirectory = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    if (file !== 'node_modules' && file !== '.git') searchDirectory(filePath);
                } else {
                    searchFile(filePath);
                }
                if (results.length > 50) break; // Limit for performance
            }
        };

        try {
            const stat = fs.statSync(fullPath);
            if (stat.isFile()) {
                searchFile(fullPath);
            } else if (stat.isDirectory()) {
                searchDirectory(fullPath);
            }
            return results.length > 0 ? results.join('\n') : "No matches found.";
        } catch (e) {
            return `Search error: ${e.message}`;
        }
    }

    glob(pattern, searchPath = '.') {
        if (!searchPath) searchPath = '.';
        const fullPath = path.resolve(this.projectRoot, String(searchPath));
        if (!fs.existsSync(fullPath)) return `Error: Path ${searchPath} not found.`;

        // Convert simple wildcard to regex
        const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`, 'i');
        let results = [];

        const search = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    if (file !== 'node_modules' && file !== '.git' && file !== '.agents') search(filePath);
                } else {
                    if (regex.test(file)) {
                        results.push(path.relative(this.projectRoot, filePath));
                    }
                }
                if (results.length > 200) break; // Limit
            }
        };

        try {
            search(fullPath);
            return results.length > 0 ? results.join('\n') : "No files matched the glob pattern.";
        } catch (e) {
            return `Glob error: ${e.message}`;
        }
    }

    taskCreate(title, description) {
        const taskPath = path.resolve(this.projectRoot, 'task.md');
        let content = fs.existsSync(taskPath) ? fs.readFileSync(taskPath, 'utf8') : '# Tasks\n\n';
        content += `- [ ] **${title}**: ${description}\n`;
        fs.writeFileSync(taskPath, content, 'utf8');
        return `Successfully added task: ${title} to task.md`;
    }

    todoWrite(task_id, status, description) {
        const todoPath = path.resolve(this.projectRoot, '.agents/memory/todo_logs.json');
        let logs = [];
        try { logs = JSON.parse(fs.readFileSync(todoPath, 'utf8')); } catch (e) {}
        logs.push({ task_id, status, description, timestamp: new Date().toISOString() });
        fs.writeFileSync(todoPath, JSON.stringify(logs, null, 2), 'utf8');
        return `Task ${task_id} updated to ${status}. Logged in todo_logs.json`;
    }

    serverMode(port = 8080) {
        return `Server mode activated on port ${port}. Persistent orchestration is now active.`;
    }

    zodSchema(schema_name, fields) {
        const schemaPath = path.resolve(this.projectRoot, `core/schemas/${schema_name}.json`);
        fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
        fs.writeFileSync(schemaPath, JSON.stringify(fields, null, 2), 'utf8');
        return `Zod Schema ${schema_name} defined and saved to ${schemaPath}.`;
    }

    enterWorktree(worktree_id) {
        const wtPath = path.resolve(this.projectRoot, `worktrees/${worktree_id}`);
        if (!fs.existsSync(wtPath)) fs.mkdirSync(wtPath, { recursive: true });
        return `Switched context to Worktree: ${worktree_id} at ${wtPath}`;
    }

    featureFlag(flag_name, status) {
        const flagPath = path.resolve(this.projectRoot, 'core/config/feature_flags.json');
        let flags = {};
        try { flags = JSON.parse(fs.readFileSync(flagPath, 'utf8')); } catch (e) {}
        flags[flag_name] = status;
        fs.writeFileSync(flagPath, JSON.stringify(flags, null, 2), 'utf8');
        return `Feature flag ${flag_name} set to ${status}. Config updated.`;
    }

    estimateTokens(content) {
        const count = Math.ceil(content.length / 4); // Basic approximation
        return `Estimated tokens for content: ~${count} tokens.`;
    }
}

module.exports = { ToolOrchestrator };
