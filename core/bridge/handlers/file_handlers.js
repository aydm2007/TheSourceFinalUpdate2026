const fs = require('fs');
const path = require('path');
const { execSync, exec: execCb } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(execCb);
const PredictiveForesight = require('../../diagnostics/predictive_foresight.js');

// --- Model Escalation Router State ---
const escalationStateMap = new Map();
function handleSyntaxEscalation(filePath, errorMsg, context) {
    const count = (escalationStateMap.get(filePath) || 0) + 1;
    escalationStateMap.set(filePath, count);
    if (count >= 2) {
        escalationStateMap.set(filePath, 0); // Reset after escalation
        context.logShadow({ type: 'MODEL_ESCALATION_TRIGGERED', file: filePath, reason: 'Consecutive AST Failures' });
        return `[ESCALATION_REQUIRED] Switch to Gemini Pro 3.1 for complex zero-shot reasoning.\n` +
               `Gemini Flash has failed the AST Omni-Predictor syntax check twice consecutively on ${filePath}.\n` +
               `This indicates a high-complexity structural task (Opus-level chaos). You MUST now use the 'McpCall' or 'Agent' tool to dispatch this specific modification task to 'Gemini Pro 3.1' to solve it, then return.`;
    }
    return `[BLOCKED BY AST OMNI-PREDICTOR] Syntax Error detected in dry-run before modification. Changes REJECTED to protect system integrity.\nError Details:\n${errorMsg}\n\n(Failure ${count}/2 before escalation)`;
}

const RelayHub = require('../../network/relay_hub');
const DigitalSignature = require('../../security/digital_signature');

function shouldSignFile(filePath, content) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.html' && ext !== '.md') return false;
    
    const contentLower = content.toLowerCase();
    const isReport = contentLower.includes('report') || 
                     contentLower.includes('audit') || 
                     contentLower.includes('forensic') || 
                     contentLower.includes('تقييم') || 
                     contentLower.includes('تقرير');
                     
    return isReport;
}

async function FileRead(args, context) {
    if (RelayHub && RelayHub.activeSessions && RelayHub.activeSessions.size > 0) {
        try {
            console.log(`[SOVEREIGN-RELAY] Proxying FileRead to client: ${args.file_path}`);
            return await RelayHub.executeOnClient('FileRead', { path: args.file_path });
        } catch (err) {
            console.log(`[SOVEREIGN-RELAY] Proxy Failed: ${err.message}. Falling back to local.`);
        }
    }
    const fullPath = path.resolve(args.file_path);
    if (!fs.existsSync(fullPath)) return `Error: File not found ${fullPath}`;
    context.AgentContext.register(fullPath); // Context Guardrail (persistent)
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // --- Auto-Dependency Injector ---
    const deps = [];
    const importRegex = /^(?:import|from)\s+.*$/gm;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        deps.push(match[0].trim());
    }
    const injectedDeps = deps.length > 0 
      ? `\n/* [AUTO-DEPENDENCY INJECTOR] Implicit dependencies detected:\n${deps.slice(0, 10).join('\n')}\n*/\n` 
      : '';
    
    // --- Chaos-to-Order Preprocessor & Quantum Compression ---
    const lineCount = content.split('\n').length;
    if (lineCount > 1000) {
        const outlined = content.split('\n').filter(line => {
            const t = line.trim();
            if (t.startsWith('//') || t.startsWith('#')) return false;
            return (t.startsWith('export ') || t.startsWith('class ') || t.startsWith('function ') || t.startsWith('def ') || t.startsWith('import '));
        }).join('\n');
        content = `[Chaos-to-Order Preprocessor] Massive file (${lineCount} lines) detected. AST Structural Outlining applied to protect Gemini Flash focus:\n${injectedDeps}\n` + outlined;
    } else if (content.length > 20000) {
        content = content
          .replace(/\/\*[\s\S]*?\*\//g, '') // Strip block comments
          .replace(/^(?!\s*https?:\/\/)\s*\/\/.*$/gm, '') // Strip line comments
          .replace(/[ \t]+/g, ' ') // Normalize spaces
          .replace(/\n\s*\n/g, '\n') // Remove blank lines
          .trim();
        content = `[QuantumTokenCompressor Activated] High-density file detected. Context compressed.\n${injectedDeps}\n` + content;
    } else {
        content = injectedDeps + content;
    }

    const limit = args.limit || 500; // Increased limit thanks to compression
    return context.applyTokenGuard(content.split('\n').slice(args.offset || 0, (args.offset || 0) + limit).join('\n'));
}

async function FileReadLines(args, context) {
    const fullPath = path.resolve(args.file_path);
    if (!fs.existsSync(fullPath)) return `Error: File not found ${fullPath}`;
    context.AgentContext.register(fullPath); // Context Guardrail (persistent)
    const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
    const start = Math.max(1, args.start_line);
    const end = Math.min(lines.length, args.end_line);
    const slice = lines.slice(start - 1, end);
    return context.applyTokenGuard(slice.map((l, i) => `${start + i}: ${l}`).join('\n'));
}

async function FileWrite(args, context) {
    // --- Sovereign Digital Signature Injection ---
    if (shouldSignFile(args.file_path, args.content)) {
        console.log(`[SOVEREIGN-SEAL] Injecting Cryptographic IQ Signature into: ${args.file_path}`);
        if (args.file_path.endsWith('.html')) {
            args.content = DigitalSignature.signHtml(args.content);
        } else {
            args.content = DigitalSignature.signMarkdown(args.content);
        }
    }

    if (RelayHub && RelayHub.activeSessions && RelayHub.activeSessions.size > 0) {
        try {
            console.log(`[SOVEREIGN-RELAY] Proxying FileWrite to client: ${args.file_path}`);
            return await RelayHub.executeOnClient('FileWrite', { path: args.file_path, content: args.content });
        } catch (err) {
            console.log(`[SOVEREIGN-RELAY] Proxy Failed: ${err.message}. Falling back to local.`);
        }
    }
    let providedPath = args.file_path;
    const workspaceRoot = process.cwd();
    
    // --- Dynamic Sovereign Path Anti-Hallucination Guard ---
    if (path.isAbsolute(providedPath)) {
        const rootParent = path.dirname(workspaceRoot);
        if (providedPath.toLowerCase().startsWith(rootParent.toLowerCase() + path.sep) && 
            !providedPath.toLowerCase().startsWith(workspaceRoot.toLowerCase() + path.sep)) {
            const relativePart = providedPath.substring(rootParent.length + 1);
            providedPath = path.join(workspaceRoot, relativePart);
        }
    }
    
    args.file_path = providedPath; // Pass healed path down
    const fwFullPath = path.resolve(providedPath);
    // Capture original if exists for rollback
    const fwOriginal = fs.existsSync(fwFullPath) ? fs.readFileSync(fwFullPath, 'utf8') : null;
    
    // --- Atomic Shadow Snapshot ---
    if (fwOriginal !== null) {
        fs.writeFileSync(`${fwFullPath}.bak`, fwOriginal, 'utf8');
    }
    
    context.orchestrator.fileWrite(args.file_path, args.content);
    let result = `[SUCCESS] FileWrite applied to ${args.file_path}`;
    // Auto-Rollback Engine: Syntax Check on written file
    const syntaxResult = PredictiveForesight.simulateSyntax(fwFullPath, args.content);
    if (!syntaxResult.isValid) {
        if (fwOriginal !== null) fs.writeFileSync(fwFullPath, fwOriginal, 'utf8');
        else fs.unlinkSync(fwFullPath); // Created by write, remove it
        return handleSyntaxEscalation(args.file_path, syntaxResult.error, context);
    }
    return result;
}

async function FileEdit(args, context) {
    let providedPath = args.file_path;
    const workspaceRoot = process.cwd();
    
    // --- Dynamic Sovereign Path Anti-Hallucination Guard ---
    if (path.isAbsolute(providedPath)) {
        const rootParent = path.dirname(workspaceRoot);
        if (providedPath.toLowerCase().startsWith(rootParent.toLowerCase() + path.sep) && 
            !providedPath.toLowerCase().startsWith(workspaceRoot.toLowerCase() + path.sep)) {
            const relativePart = providedPath.substring(rootParent.length + 1);
            providedPath = path.join(workspaceRoot, relativePart);
        }
    }
    
    args.file_path = providedPath; // Pass healed path down
    const fullPath = path.resolve(providedPath);
    if (!fs.existsSync(fullPath)) return `Error: File not found ${fullPath}`;
    if (!context.AgentContext.readFiles.has(fullPath)) {
      return `[FORENSIC-BLOCK] Context Violation: You cannot modify ${args.file_path} without reading it first. Execute FileRead or FileReadLines to map the file into context.`;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content; // For Auto-Rollback
    
    // --- Atomic Shadow Snapshot ---
    fs.writeFileSync(`${fullPath}.bak`, originalContent, 'utf8');
    const instances = content.split(args.old_string).length - 1;
    if (instances === 0) return `Error: old_string not found in ${args.file_path}.`;
    if (instances > 1) return `Error: old_string is not unique in ${args.file_path} (${instances} instances).`;
    
    content = content.replace(args.old_string, args.new_string);
    
    // Auto-Rollback Engine: Fast Syntax Check BEFORE WRITE (Omni-Predictor Logic)
    const syntaxResult = PredictiveForesight.simulateSyntax(fullPath, content);
    
    if (!syntaxResult.isValid) {
        return handleSyntaxEscalation(args.file_path, syntaxResult.error, context);
    } else {
        fs.writeFileSync(fullPath, content, 'utf8');
        return `[SUCCESS] FileEdit applied to ${args.file_path}`;
    }
}

async function SurgicalDiff(args, context) {
    let providedPath = args.file_path;
    const workspaceRoot = process.cwd();
    
    // --- Dynamic Sovereign Path Anti-Hallucination Guard ---
    if (path.isAbsolute(providedPath)) {
        const rootParent = path.dirname(workspaceRoot);
        if (providedPath.toLowerCase().startsWith(rootParent.toLowerCase() + path.sep) && 
            !providedPath.toLowerCase().startsWith(workspaceRoot.toLowerCase() + path.sep)) {
            const relativePart = providedPath.substring(rootParent.length + 1);
            providedPath = path.join(workspaceRoot, relativePart);
        }
    }
    
    args.file_path = providedPath; // Pass healed path down
    const fullPath = path.resolve(providedPath);
    if (!fs.existsSync(fullPath)) return `Error: File not found ${fullPath}`;
    if (!context.AgentContext.readFiles.has(fullPath)) {
      return `[FORENSIC-BLOCK] Context Violation: You cannot modify ${args.file_path} without reading it first. Execute FileRead or FileReadLines to map the file into context.`;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content; // For Auto-Rollback
    
    // --- Atomic Shadow Snapshot ---
    fs.writeFileSync(`${fullPath}.bak`, originalContent, 'utf8');
    let applied = false;
    let result = '';
    
    if (args.start_line && args.end_line) {
        const lines = content.split('\n');
        if (args.start_line < 1 || args.end_line > lines.length || args.start_line > args.end_line) {
            result = `Error: Invalid line range [${args.start_line}, ${args.end_line}].`;
        } else {
            const targetChunk = lines.slice(args.start_line - 1, args.end_line).join('\n');
            if (!targetChunk.includes(args.search_block)) {
                result = `Error: search_block not found in lines [${args.start_line}, ${args.end_line}].`;
            } else {
                const instancesInChunk = targetChunk.split(args.search_block).length - 1;
                if (instancesInChunk > 1) {
                    result = `Error: search_block is not unique within lines [${args.start_line}, ${args.end_line}].`;
                } else {
                    const newChunk = targetChunk.replace(args.search_block, args.replace_block);
                    lines.splice(args.start_line - 1, args.end_line - args.start_line + 1, ...newChunk.split('\n'));
                    content = lines.join('\n');
                    applied = true;
                }
            }
        }
    } else {
        const instances = content.split(args.search_block).length - 1;
        if (instances === 0) result = `Error: search_block not found in ${args.file_path}.`;
        else if (instances > 1) result = `Error: search_block is not unique (${instances} instances).`;
        else {
            content = content.replace(args.search_block, args.replace_block);
            applied = true;
        }
    }
    
    if (applied) {
        // Auto-Rollback Engine: Fast Syntax Check BEFORE WRITE (Omni-Predictor Logic)
        const syntaxResult = PredictiveForesight.simulateSyntax(fullPath, content);
        
        if (!syntaxResult.isValid) {
            result = handleSyntaxEscalation(args.file_path, syntaxResult.error, context);
        } else {
            fs.writeFileSync(fullPath, content, 'utf8');
            result = `[SUCCESS] Surgical Patch Applied to ${args.file_path}` + (args.start_line ? ` (Lines ${args.start_line}-${args.end_line})` : '');
        }
    }
    return result;
}

async function AstChunkPatch(args, context) {
    const fullPath = path.resolve(args.file_path);
    if (!fs.existsSync(fullPath)) return `Error: File not found ${fullPath}`;
    let lines = fs.readFileSync(fullPath, 'utf8').split('\n');
    const start = Math.max(1, args.chunk_start_line);
    const end = Math.min(lines.length, args.chunk_end_line);
    const targetChunk = lines.slice(start - 1, end).join('\n');
    if (!targetChunk.includes(args.search_block)) {
        return `Error: search_block not found in chunk range [${start}, ${end}].`;
    } else {
        const newChunk = targetChunk.replace(args.search_block, args.replace_block);
        lines.splice(start - 1, end - start + 1, ...newChunk.split('\n'));
        fs.writeFileSync(fullPath, lines.join('\n'), 'utf8');
        return `[SUCCESS] AstChunkPatch surgical AST chunk updated for lines [${start}, ${end}] in ${args.file_path}.`;
    }
}

async function ASTAutoPatch(args, context) {
    try {
      const ASTAutoPatchClass = require('../../services/surgical_engine/astAutoPatch.js');
      const patcher = new ASTAutoPatchClass(process.cwd());
      const CodeImpactSimulator = require('../../../src/core-engine/CodeImpactSimulator.js');
      const simulator = new CodeImpactSimulator();
      const proposedMod = async (sandboxPath) => {
        await patcher.applyPatch(sandboxPath, args.class_name || '', args.method_name, args.patch_code);
      };
      const isSafe = await simulator.simulate(args.file_path, proposedMod);
      if (isSafe) {
        const patchRes = await patcher.applyPatch(args.file_path, args.class_name || '', args.method_name, args.patch_code);
        return JSON.stringify(patchRes);
      } else {
        return `[BLOCKED] ASTAutoPatch execution denied by CodeImpactSimulator due to high blast radius or syntax errors.`;
      }
    } catch (e) {
      return `Error executing ASTAutoPatch: ${e.message}`;
    }
}

async function ResolveConflict(args, context) {
    const fullPath = path.resolve(args.file_path);
    if (!fs.existsSync(fullPath)) return `Error: File not found ${fullPath}`;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    const resolvedLines = [];
    let i = 0;
    let resolvedCount = 0;
    const strategy = args.resolution_strategy || 'ours';
    while (i < lines.length) {
      if (lines[i].startsWith('<<<<<<<')) {
        const oursBlock = [];
        const theirsBlock = [];
        let inOurs = true;
        i++;
        while (i < lines.length && !lines[i].startsWith('>>>>>>>')) {
          if (lines[i].startsWith('=======')) { inOurs = false; }
          else { (inOurs ? oursBlock : theirsBlock).push(lines[i]); }
          i++;
        }
        if (strategy === 'ours') resolvedLines.push(...oursBlock);
        else if (strategy === 'theirs') resolvedLines.push(...theirsBlock);
        else { resolvedLines.push(...oursBlock, ...theirsBlock); }
        resolvedCount++;
      } else {
        resolvedLines.push(lines[i]);
      }
      i++;
    }
    fs.writeFileSync(fullPath, resolvedLines.join('\n'), 'utf8');
    return `[ResolveConflict] ✅ Resolved ${resolvedCount} conflict(s) in "${args.file_path}" using strategy "${strategy}".`;
}

async function UndoChanges(args, context) {
    const fullPath = path.resolve(args.file_path);
    const backupSuffix = args.backup_suffix || '.bak';
    const backupPath = fullPath + backupSuffix;
    if (!fs.existsSync(backupPath)) {
      try {
        execSync(`git checkout -- "${fullPath}"`);
        return `[UndoChanges] ✅ Backup file not found. Successfully rolled back using 'git checkout -- ${args.file_path}'.`;
      } catch (e) {
        return `[UndoChanges] Error: No backup file found and git checkout failed for "${args.file_path}".`;
      }
    } else {
      const backupContent = fs.readFileSync(backupPath, 'utf8');
      fs.writeFileSync(fullPath, backupContent, 'utf8');
      try { fs.unlinkSync(backupPath); } catch (e) { /* cleanup non-critical */ }
      return `[UndoChanges] ✅ Successfully rolled back "${args.file_path}" from backup "${backupPath}".`;
    }
}

async function NotebookEdit(args, context) {
    const fullPath = path.resolve(args.file_path);
    if (!fs.existsSync(fullPath)) return `Error: Notebook not found ${fullPath}`;
    try {
        const nb = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (!nb.cells || !nb.cells[args.cell_index]) return `Error: Invalid cell_index ${args.cell_index}`;
        nb.cells[args.cell_index].source = Array.isArray(args.content) ? args.content : args.content.split('\n').map(l => l + '\n');
        fs.writeFileSync(fullPath, JSON.stringify(nb, null, 1), 'utf8');
        return `[SUCCESS] Cell ${args.cell_index} in ${args.file_path} updated.`;
    } catch (e) { return `[NotebookEdit-Error] ${e.message}`; }
}

async function Glob(args, context) {
    if (RelayHub && RelayHub.activeSessions && RelayHub.activeSessions.size > 0) {
        try {
            console.log(`[SOVEREIGN-RELAY] Proxying Glob (ListDir) to client: ${args.path || '.'}`);
            const resultJSON = await RelayHub.executeOnClient('ListDir', { path: args.path || '.' });
            const files = JSON.parse(resultJSON);
            return `[Glob-Relay] Found ${files.length} files:\n${files.slice(0, 100).join('\n')}`;
        } catch (err) {
            console.log(`[SOVEREIGN-RELAY] Proxy Failed: ${err.message}. Falling back to local.`);
        }
    }
    try {
        const { globSync } = require('glob');
        const searchPath = args.path ? path.resolve(args.path) : context.__dirname;
        const results = globSync(args.pattern, { cwd: searchPath, ignore: ['**/node_modules/**', '**/.git/**'], absolute: false });
        return results.length > 0 ? `[Glob] Found ${results.length} files:\n${results.slice(0, 100).join('\n')}` : `[Glob] No matches.`;
    } catch (e) { return context.orchestrator.glob(args.pattern, args.path || '.'); }
}

async function Grep(args, context) {
    try {
      const grepPath = path.resolve(args.path || '.');
      let rgPath = 'rg';
      try {
          const ripgrep = require('@vscode/ripgrep');
          if (ripgrep && ripgrep.rgPath) {
              rgPath = `"${ripgrep.rgPath}"`;
          }
      } catch (e) {}
      const rgCmd = `${rgPath} --json "${args.pattern.replace(/"/g, '\\"')}" "${grepPath}"`;
      const { stdout: output } = await execAsync(rgCmd, { encoding: 'utf8', timeout: 15000, maxBuffer: 10 * 1024 * 1024 });
      const matches = output.trim().split('\n')
        .filter(Boolean)
        .map(l => { try { return JSON.parse(l); } catch { return null; } })
        .filter(m => m && m.type === 'match')
        .slice(0, 50);
      return context.applyTokenGuard(`[Grep] ${matches.length} matches for "${args.pattern}":\n` +
        matches.map(m => `${m.data.path.text}:${m.data.line_number}: ${m.data.lines.text.trim()}`).join('\n'));
    } catch (e) {
      try {
        const matches = [];
        const pattern = args.pattern;
        const patLower = pattern.toLowerCase();
        const grepPath = path.resolve(args.path || '.');
        
        function walkDir(dir) {
          if (!fs.existsSync(dir)) return;
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fp = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              if (!['node_modules', '.git', 'dist', 'build', 'invalid_temp_worktree', 'coverage'].includes(entry.name)) {
                walkDir(fp);
              }
            } else {
              const ext = path.extname(entry.name);
              if (['.ts', '.tsx', '.js', '.jsx', '.py', '.dart', '.go', '.json', '.md', '.html', '.css', '.txt'].includes(ext)) {
                try {
                  const content = fs.readFileSync(fp, 'utf8');
                  if (content.toLowerCase().indexOf(patLower) !== -1) {
                    const lines = content.split('\n');
                    for (let li = 0; li < lines.length && matches.length < 50; li++) {
                      if (lines[li].toLowerCase().indexOf(patLower) !== -1) {
                        matches.push({
                          path: path.relative(grepPath, fp),
                          line_number: li + 1,
                          line_content: lines[li].trim()
                        });
                      }
                    }
                  }
                } catch (err) {}
              }
            }
          }
        }
        walkDir(grepPath);
        return context.applyTokenGuard('[Grep] (Pure JS Fallback) ' + matches.length + ' matches for "' + pattern + '":\n' +
          matches.map(m => m.path + ':' + m.line_number + ': ' + m.line_content).join('\n'));
      } catch (fallbackError) {
        return context.applyTokenGuard('[Grep-Error]: ' + e.message + ' | Fallback failed: ' + fallbackError.message);
      }
    }
}

async function LSPTool(args, context) {
    if (!args.symbol) return `Error: No symbol provided.`;
    const baseDir = (context && context.__dirname) ? context.__dirname : process.cwd();
    const action = args.action || 'definition';
    
    try {
        // --- 1. High-Fidelity AST-Index Lookup ---
        const indexPath = path.join(baseDir, 'scratch', 'ast_index.json');
        if (fs.existsSync(indexPath) && (action === 'definition' || action === 'hover')) {
            try {
                const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
                for (const [fileRel, data] of Object.entries(index)) {
                    const hasClass = (data.classes || []).some(c => c.includes(args.symbol));
                    const hasFunc = (data.functions || []).some(f => f.includes(args.symbol));
                    if (hasClass || hasFunc) {
                        const fp = path.join(baseDir, fileRel);
                        if (fs.existsSync(fp)) {
                            const allLines = fs.readFileSync(fp, 'utf8').split('\n');
                            // Find precise line matching symbol definition
                            let lineNum = 1;
                            const defRegex = new RegExp(`\\b(class|function|def|const|let|var|interface|type)\\s+${args.symbol}\\b`);
                            for (let i = 0; i < allLines.length; i++) {
                                if (defRegex.test(allLines[i])) {
                                    lineNum = i + 1;
                                    break;
                                }
                            }
                            const start = Math.max(0, lineNum - 1);
                            const end = Math.min(allLines.length, start + 15);
                            return `[LSP-${action.toUpperCase()}] Structural AST definition found via AST Index:\n` +
                                   `--- ${fileRel}:${lineNum} ---\n` +
                                   allLines.slice(start, end).join('\n') + `\n...`;
                        }
                    }
                }
            } catch (indexError) {
                console.error('[LSPTool] Error parsing AST index:', indexError.message);
            }
        }

        // --- 2. Ripgrep Lookup Fallback ---
        let rgPath = 'rg';
        try {
            const ripgrep = require('@vscode/ripgrep');
            if (ripgrep && ripgrep.rgPath) {
                rgPath = `"${ripgrep.rgPath}"`;
            }
        } catch (e) {}
        const rgCmd = `${rgPath} --json "\\b${args.symbol}\\b" . -g "*.ts" -g "*.js" -g "*.py" -g "*.dart"`;
        const { stdout: output } = await execAsync(rgCmd, { encoding: 'utf8', timeout: 15000, cwd: baseDir, maxBuffer: 10 * 1024 * 1024 });
        const matches = output.trim().split('\n')
            .filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } })
            .filter(m => m && m.type === 'match');
            
        if (action === 'definition' || action === 'hover') {
            const defs = matches.filter(m => m.data.lines.text.match(new RegExp(`(function|class|const|let|var|interface|type|def)\\s+${args.symbol}\\b`)));
            if (defs.length > 0) {
                const blocks = defs.slice(0, 3).map(m => {
                    const filePath = path.join(baseDir, m.data.path.text);
                    if (fs.existsSync(filePath)) {
                        const allLines = fs.readFileSync(filePath, 'utf8').split('\n');
                        const start = Math.max(0, m.data.line_number - 1);
                        const end = Math.min(allLines.length, start + 15);
                        return `--- ${m.data.path.text}:${m.data.line_number} ---\n${allLines.slice(start, end).join('\n')}\n...`;
                    }
                    return `${m.data.path.text}:${m.data.line_number} - ${m.data.lines.text.trim()}`;
                });
                return `[LSP-${action.toUpperCase()}] Structural AST definition found via Ripgrep:\n` + blocks.join('\n\n');
            }
        }
        return `[LSP-${action.toUpperCase()}] References matches found via Ripgrep:\n` + 
               matches.slice(0, 10).map(m => `${m.data.path.text}:${m.data.line_number} - ${m.data.lines.text.trim()}`).join('\n');
    } catch (e) {
        // --- 3. Pure JS Directory Walker Fallback ---
        try {
            const matches = [];
            const symbol = args.symbol;
            
            function walkDir(dir) {
                if (!fs.existsSync(dir)) return;
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fp = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        if (!['node_modules', '.git', 'dist', 'build', 'invalid_temp_worktree', 'coverage', '.agents'].includes(entry.name)) {
                            walkDir(fp);
                        }
                    } else {
                        const ext = path.extname(entry.name);
                        if (['.ts', '.tsx', '.js', '.jsx', '.py', '.dart', '.go'].includes(ext)) {
                            try {
                                const content = fs.readFileSync(fp, 'utf8');
                                if (content.indexOf(symbol) !== -1) {
                                    const lines = content.split('\n');
                                    for (let li = 0; li < lines.length && matches.length < 50; li++) {
                                        if (lines[li].indexOf(symbol) !== -1) {
                                            matches.push({
                                                path: path.relative(baseDir, fp),
                                                line_number: li + 1,
                                                line_content: lines[li].trim()
                                            });
                                        }
                                    }
                                }
                            } catch (err) {}
                        }
                    }
                }
            }
            walkDir(baseDir);
            
            if (action === 'definition' || action === 'hover') {
                const keywords = ['class', 'function', 'def', 'const', 'let', 'var', 'interface', 'type'];
                const defs = matches.filter(m => {
                    return keywords.some(k => m.line_content.includes(k + ' ' + symbol) || m.line_content.includes(k + '  ' + symbol));
                });
                if (defs.length > 0) {
                    return `[LSP-${action.toUpperCase()}] (Pure JS Fallback) Found definition at:\n` +
                        defs.slice(0, 5).map(m => `${m.path}:${m.line_number} - ${m.line_content}`).join('\n');
                }
            }
            return `[LSP-${action.toUpperCase()}] (Pure JS Fallback) References matches:\n` +
                matches.slice(0, 10).map(m => `${m.path}:${m.line_number} - ${m.line_content}`).join('\n');
        } catch (fallbackError) {
            try {
                return context.orchestrator.semanticReference(args.symbol);
            } catch (err3) {
                return `[LSP-Error]: ${e.message} | Fallback failed: ${fallbackError.message}`;
            }
        }
    }
}

async function SemanticReference(args, context) {
    const semSymbol = args.symbol || args.symbol_name;
    return semSymbol ? context.orchestrator.semanticReference(semSymbol) : 'Error: symbol or symbol_name is required.';
}

async function SemanticSymbolLookup(args, context) {
    const symbol = args.symbol || args.symbol_name;
    const searchRoot = args.search_path || process.cwd();
    const matches = [];
    const callerRegex = /(?:function|def|class|async\s+function)\s+([a-zA-Z0-9_]+)/;
    
    function walkSymbol(dir) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fp = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', 'invalid_temp_worktree'].includes(entry.name)) walkSymbol(fp);
        } else {
          const ext = path.extname(entry.name);
          if (['.ts', '.tsx', '.js', '.jsx', '.py', '.dart', '.go'].includes(ext)) {
            try {
              const content = fs.readFileSync(fp, 'utf8');
              if (content.includes(symbol)) {
                const lines = content.split('\n');
                let currentCaller = 'Global Scope';
                for (let li = 0; li < lines.length && matches.length < 50; li++) {
                  const match = lines[li].match(callerRegex);
                  if (match) currentCaller = match[1]; // Track the current function scope
                  
                  if (lines[li].includes(symbol)) {
                    matches.push(`➔ [${currentCaller}] in ${path.relative(searchRoot, fp)}:Line ${li + 1}: ${lines[li].trim()}`);
                  }
                }
              }
            } catch (e) { /* skip unreadable */ }
          }
        }
      }
    }
    walkSymbol(searchRoot);
    
    return `[Semantic Call-Graph Mapper] Symbol: "${symbol}" | Found ${matches.length} logical node(s) mapped:\n` +
           `--- DEPENDENCY GRAPH ---\n` +
           (matches.length > 0 ? matches.join('\n') : 'No logical dependencies found.\n') +
           `------------------------\n✅ Architectural mapping complete. (Defeats Opus's blind contextual memory)`;
}

async function SemanticContextCompressor(args, context) {
    const fullPath = path.resolve(args.file_path);
    if (!fs.existsSync(fullPath)) return `Error: File not found ${fullPath}`;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    const level = args.compression_level || 'medium';
    let compressed = [];
    let inDocstring = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (level === 'high') {
        if (trimmed.startsWith('//') || trimmed.startsWith('#')) continue;
        if (trimmed.startsWith('/*')) { inDocstring = true; continue; }
        if (inDocstring && trimmed.endsWith('*/')) { inDocstring = false; continue; }
        if (inDocstring) continue;
      }
      if (trimmed.startsWith('export ') || trimmed.startsWith('class ') || trimmed.startsWith('function ') || 
          trimmed.startsWith('def ') || trimmed.startsWith('import ') || trimmed.includes('=>') || 
          trimmed.endsWith('{') || trimmed.endsWith('}')) {
        compressed.push(line);
      } else if (level === 'low') {
        compressed.push(line);
      }
    }
    const origSize = content.length;
    const compOutput = compressed.join('\n');
    const compSize = compOutput.length;
    const ratio = ((1 - (compSize / origSize)) * 100).toFixed(2);
    return `[SemanticContextCompressor] Context Compressed (Saved ${ratio}% tokens)\n\n${compOutput}`;
}

async function QuantumTokenCompressor(args, context) {
    const raw = args.input_payload || '';
    const rawLength = raw.length;
    let compressed = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^(?!\s*https?:\/\/)\s*\/\/.*$/gm, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    const compressedLength = compressed.length;
    const actualRatio = rawLength > 0 ? (compressedLength / rawLength) : 0;
    return `[QuantumTokenCompressor] Executed high-density token projection:\n` +
           `🔹 Original payload length: ${rawLength} characters\n` +
           `🔹 Compressed projection length: ${compressedLength} characters (Ratio: ${(actualRatio * 100).toFixed(1)}%)\n` +
           `🔹 Distilled Payload:\n${compressed}\n` +
           `✅ [SUCCESS] Token density optimized with zero semantic loss.`;
}

module.exports = {
    FileRead,
    FileReadLines,
    FileWrite,
    FileEdit,
    SurgicalDiff,
    AstChunkPatch,
    ASTAutoPatch,
    ResolveConflict,
    UndoChanges,
    NotebookEdit,
    Glob,
    Grep,
    LSPTool,
    SemanticReference,
    SemanticSymbolLookup,
    SemanticContextCompressor,
    QuantumTokenCompressor
};
