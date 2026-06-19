/**
 * fullRepairLoop.js — Sovereign Sigma V12.0
 * -------------------------------------------
 * محرك الشفاء الذاتي الذي يحول أخطاء التشغيل إلى مدخلات إصلاح.
 */
const ParallelTestRunner = require('./ParallelTestRunner.js');

class FullRepairLoop {
    constructor(coordinator) {
        this.coordinator = coordinator;
        this.testRunner = new ParallelTestRunner();
        this.maxRetries = 3;
    }

    async executeWithRepair(workspaceRoot, taskData) {
        let currentRetry = 0;
        
        while (currentRetry < this.maxRetries) {
            console.log(`[fullRepairLoop] Execution Cycle ${currentRetry + 1}...`);
            
            // 1. Run Tests
            const testResult = await this.testRunner.runAll(workspaceRoot);
            
            if (testResult.success) {
                console.log("[fullRepairLoop] Verification successful. Zero Exit achieved.");
                return { status: "SUCCESS" };
            }

            // 2. Capture Errors and Request Fix
            const failedSuites = testResult.details.filter(d => !d.success);
            const errorReport = failedSuites.map(d => `[${d.name}] ERROR: ${d.error}`).join('\n---\n');
            
            console.error(`[fullRepairLoop] Failures in: ${failedSuites.map(d => d.name).join(', ')}`);
            
            // Outputting a standard "REPAIR_REQUIRED" signal for the agent
            console.log("<<< REPAIR_REQUIRED_SIGNAL >>>");
            console.log(JSON.stringify({
                attempt: currentRetry + 1,
                errors: errorReport,
                suggestion: "Analyze stderr and apply targeted AST patch via astAutoPatch.js"
            }, null, 2));
            
            return { status: "REPAIR_REQUIRED", attempt: currentRetry + 1, errors: errorReport };
        }

        return { status: "FAILED_MAX_RETRIES", retries: currentRetry };
    }
}

module.exports = FullRepairLoop;
