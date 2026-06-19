/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  👁️ PredictiveForesight (AST Omni-Predictor)               │
 * │  Dry-run simulator to prevent LLMs from saving syntactically│
 * │  broken code. Validates JavaScript/JSON syntax before save. │
 * └─────────────────────────────────────────────────────────────┘
 */
const vm = require('vm');
const path = require('path');

class PredictiveForesight {
    /**
     * Checks that all imported modules in a JS/TS file exist on disk.
     * Simple heuristic: parses lines starting with import/require and verifies path existence.
     * Returns {isValid:boolean,error:string|null}
     */
    static checkDependencies(filePath, sourceCode) {
        const dir = require('path').dirname(filePath);
        const lines = sourceCode.split('\n');
        const importRegex = /^(?:import\s+.*?\s+from\s+|const\s+.*?=\s+require\()['"](.+?)['"]\)?/;
        for (const line of lines) {
            const match = line.match(importRegex);
            if (match) {
                let dep = match[1];
                // Resolve relative paths
                if (dep.startsWith('.')) {
                    const resolved = require('path').resolve(dir, dep);
                    if (!require('fs').existsSync(resolved + '.js') && !require('fs').existsSync(resolved + '.ts') && !require('fs').existsSync(resolved + '/index.js')) {
                        return { isValid: false, error: `[Dependency Error] Missing module ${dep} referenced in ${filePath}` };
                    }
                }
            }
        }
        return { isValid: true, error: null };
    }

    /**
     * Verifies if a given source code string has valid syntax.
     * Supported contexts: JS, JSON. Other languages gracefully bypass.
     * @param {string} filePath - Target file path
     * @param {string} sourceCode - The proposed new code
     * @returns {{isValid: boolean, error: string|null}}
     */
    static simulateSyntax(filePath, sourceCode) {
        // ==== NEW: Dependency Graph Check (lightweight) ====
        // Extract simple import/require statements to ensure referenced modules exist.
        const depCheck = this.checkDependencies(filePath, sourceCode);
        if (!depCheck.isValid) {
            return { isValid: false, error: depCheck.error };
        }

        const ext = path.extname(filePath).toLowerCase();

        // 1. JavaScript / TypeScript
        if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
            try {
                if (ext === '.ts' || ext === '.tsx' || ext === '.d.ts') {
                    const recast = require('recast');
                    const babelParser = require('recast/parsers/babel-ts');
                    recast.parse(sourceCode, { parser: babelParser });
                    return { isValid: true, error: null };
                } else {
                    new vm.Script(sourceCode);
                    const runtimeCheck = this.simulateRuntime(filePath, sourceCode);
                    if (!runtimeCheck.isValid) return runtimeCheck;
                    return { isValid: true, error: null };
                }
            } catch (err) {
                const line = err.loc ? err.loc.line : (err.lineNumber || '?');
                return { 
                    isValid: false, 
                    error: `[AST Syntax Error] Line ${line}: ${err.message}` 
                };
            }
        }

        // 2. JSON
        if (ext === '.json') {
            try {
                JSON.parse(sourceCode);
                return { isValid: true, error: null };
            } catch (err) {
                return { 
                    isValid: false, 
                    error: `[JSON Syntax Error]: ${err.message}` 
                };
            }
        }

        // Future: Python (via ast), Dart (via dart analyzer) can be added here.
        // For unsupported extensions, we allow it (graceful fallback).
        return { isValid: true, error: null };
    }

    static simulateRuntime(filePath, sourceCode) {
        const ext = path.extname(filePath).toLowerCase();
        if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return { isValid: true, error: null };
        try {
            const createUniversalMock = () => {
                return new Proxy(function() {}, {
                    get: (target, prop) => {
                        if (prop === 'then') return undefined; // Avoid Promise issues
                        return createUniversalMock();
                    },
                    apply: () => createUniversalMock(),
                    construct: () => createUniversalMock()
                });
            };
            const sandbox = {
                require: createUniversalMock(),
                console: createUniversalMock(),
                process: createUniversalMock(),
                setTimeout: createUniversalMock(),
                setInterval: createUniversalMock(),
                clearTimeout: createUniversalMock(),
                clearInterval: createUniversalMock(),
                module: { exports: {} },
                exports: {},
                global: createUniversalMock(),
                Buffer: createUniversalMock(),
                // Browser mocks to prevent [AST Omni-Predictor Runtime Block] on frontend scripts
                window: createUniversalMock(),
                document: createUniversalMock(),
                navigator: createUniversalMock(),
                location: createUniversalMock(),
                localStorage: createUniversalMock(),
                sessionStorage: createUniversalMock(),
                HTMLElement: createUniversalMock(),
                Element: createUniversalMock(),
                Node: createUniversalMock(),
                self: createUniversalMock(),
                screen: createUniversalMock(),
                alert: createUniversalMock(),
                fetch: createUniversalMock()
            };
            const context = vm.createContext(sandbox);
            const script = new vm.Script(sourceCode, { filename: path.basename(filePath) });
            script.runInContext(context, { timeout: 500 });
            return { isValid: true, error: null };
        } catch (err) {
            if (err.message.includes('timeout') || err.message.includes('not defined')) {
                return { isValid: false, error: `[AST Omni-Predictor Runtime Block]: ${err.message}` };
            }
            return { isValid: true, error: null }; 
        }
    }

    /**
     * Applies a diff in-memory and validates the outcome.
     * @param {string} originalCode 
     * @param {string} searchBlock 
     * @param {string} replaceBlock 
     * @param {string} filePath 
     */
    static dryRunDiff(originalCode, searchBlock, replaceBlock, filePath) {
        if (!originalCode.includes(searchBlock)) {
            return { 
                isValid: false, 
                error: '[Diff Error] search_block not found in file. Ensure exact whitespace and line endings.' 
            };
        }

        // Apply diff in memory
        const proposedCode = originalCode.replace(searchBlock, replaceBlock);
        
        // Check syntax
        const syntaxResult = this.simulateSyntax(filePath, proposedCode);
        if (!syntaxResult.isValid) {
            return syntaxResult; // Reject with syntax error
        }

        return { isValid: true, proposedCode, error: null };
    }
}

module.exports = PredictiveForesight;
