const path = require('path');
const fs = require('fs');
const ParallelTestRunner = require('./ParallelTestRunner.js');

class FullRepairLoop {
    constructor(coordinator, patcher) {
        this.coordinator = coordinator;
        this.patcher = patcher || new (require('./astAutoPatch'))(process.cwd());
        this.testRunner = new ParallelTestRunner();
        this.maxRetries = 3;
    }

    async executeWithRepair(workspaceRoot, taskData) {
        let currentRetry = 0;
        
        while (currentRetry < this.maxRetries) {
            console.error(`[FullRepairLoop] Execution Cycle ${currentRetry + 1}/${this.maxRetries}...`);
            
            // 1. Run Tests
            const testResult = await this.testRunner.runAll(workspaceRoot);
            
            if (testResult.success) {
                console.error("[FullRepairLoop] ✅ Verification successful. Zero Exit achieved.");
                return { status: "SUCCESS", attempts: currentRetry + 1 };
            }

            // 2. Capture Errors and Attempt Auto-Repair
            const failedSuites = testResult.details.filter(d => !d.success);
            console.error(`[FullRepairLoop] ⚠️ Failures in: ${failedSuites.map(d => d.name).join(', ')}`);

            // 3. Auto-Repair: attempt AST patch based on error analysis
            for (const suite of failedSuites) {
                console.error(`[FullRepairLoop] 🔧 Auto-repairing: ${suite.name}`);
                try {
                    const errorMsg = suite.error || 'Unknown test failure';
                    
                    // Parse file and line number from stack trace if possible
                    let targetFile = suite.file || (taskData && taskData.file) || '';
                    let methodName = suite.method || (taskData && taskData.method) || '';
                    let suggestedFix = suite.suggestedFix || (taskData && taskData.suggestedFix) || '';
                    let parsedFile = '';

                    const fileLineMatch = errorMsg.match(/(?:at\s+.*?\(|at\s+)(?:([a-zA-Z]:[\\/][^:]+)|([^:]+)):(\d+)/);
                    if (fileLineMatch) {
                        const candidate = fileLineMatch[1] || fileLineMatch[2];
                        if (fs.existsSync(path.resolve(workspaceRoot, candidate))) {
                            parsedFile = path.resolve(workspaceRoot, candidate);
                        } else if (fs.existsSync(candidate)) {
                            parsedFile = path.resolve(candidate);
                        }
                    }

                    if (!targetFile && parsedFile) {
                        targetFile = parsedFile;
                    }

                    // Query Vector Database for similar historical errors and fixes
                    let vectorFixHint = '';
                    try {
                        const baseDir = (taskData && taskData.context && taskData.context.__dirname) ? taskData.context.__dirname : process.cwd();
                        const VectorEngine = require(path.join(baseDir, 'core/services/memory_engine/VectorEngine.js'));
                        const vEngine = new VectorEngine(baseDir);
                        
                        // Clean error message: take first line, remove non-alphanumeric/spaces, keep words > 2 chars, limit to 4 words
                        const firstLine = errorMsg.split('\n')[0] || '';
                        const cleanWords = firstLine.replace(/[^a-zA-Z0-9\s]/g, ' ')
                                                    .split(/\s+/)
                                                    .filter(w => w.length > 2)
                                                    .slice(0, 4);
                        const cleanQuery = cleanWords.join(' ');
                        
                        if (cleanQuery) {
                            console.error(`[FullRepairLoop] Querying Vector Database with: "${cleanQuery}"`);
                            const searchResults = vEngine.search(cleanQuery, [], 3);
                            if (searchResults && searchResults.length > 0) {
                                console.error(`[FullRepairLoop] Found ${searchResults.length} similar historical errors in Vector Index.`);
                                vectorFixHint = JSON.stringify(searchResults, null, 2);
                            }
                        }
                    } catch (vecErr) {
                        console.warn(`[FullRepairLoop] Vector Search failed: ${vecErr.message}`);
                    }

                    // Structured logging of the complete stack trace to the Shadow Ledger
                    if (taskData && taskData.context && typeof taskData.context.logShadow === 'function') {
                        taskData.context.logShadow({
                            type: 'STACK_TRACE_ERROR',
                            status: 'FAIL',
                            suite: suite.name,
                            error: errorMsg,
                            file: targetFile,
                            method: methodName,
                            vector_search_hint: vectorFixHint ? 'MATCH_FOUND' : 'NO_MATCH',
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        // Fallback: direct serialization to the shadow ledger file if context is missing
                        try {
                            const ledgerPath = path.resolve(workspaceRoot, '.nexus/var/telemetry/shadow_ledger.jsonl');
                            const dir = path.dirname(ledgerPath);
                            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                            fs.appendFileSync(ledgerPath, JSON.stringify({
                                timestamp: new Date().toISOString(),
                                type: 'STACK_TRACE_ERROR',
                                status: 'FAIL',
                                suite: suite.name,
                                error: errorMsg,
                                file: targetFile
                            }) + '\n');
                        } catch (eLedger) {}
                    }

                    // If suggestedFix is empty, we can try to derive or print the vector context
                    if (!suggestedFix && vectorFixHint) {
                        suggestedFix = `/* Derived from historical vector matching */\n// Hint: ${vectorFixHint.substring(0, 1000)}`;
                    }

                    if (targetFile && suggestedFix) {
                        await this.patcher.applyPatch(targetFile, '', methodName, suggestedFix);
                        console.error(`[FullRepairLoop] ✅ Patch applied for ${suite.name}`);
                    } else {
                        console.warn(`[FullRepairLoop] ⚠️ Insufficient data for auto-patch of ${suite.name}`);
                    }
                } catch (e) {
                    console.warn(`[FullRepairLoop] ❌ Auto-patch failed for ${suite.name}: ${e.message}`);
                }
            }

            currentRetry++;
        }

        console.error(`[FullRepairLoop] ❌ Max retries (${this.maxRetries}) exhausted.`);
        return { status: "FAILED_MAX_RETRIES", retries: currentRetry };
    }
}

module.exports = FullRepairLoop;
