/**
 * ParallelTestRunner.js — Sovereign Sigma V12.0
 * ----------------------------------------------
 * محرك التشغيل المتوازي للاختبارات لضمان السرعة والنزاهة.
 */
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class ParallelTestRunner {
    async runAll(workspaceRoot) {
        console.error("[ParallelTestRunner] Initiating parallel validation suites...");
        
        const suites = [
            { name: "Linting", command: "npm run lint" },
            { name: "Type Check", command: "npx tsc --noEmit" },
            { name: "Unit Tests", command: "npm test -- --watchAll=false" }
        ];

        const results = await Promise.allSettled(suites.map(s => {
            return execPromise(s.command, { cwd: workspaceRoot })
                .then(() => ({ name: s.name, success: true }))
                .catch(err => ({ name: s.name, success: false, error: err.stderr || err.stdout }));
        }));

        const summary = results.map(r => r.value);
        const allSuccess = summary.every(s => s.success);
        
        return {
            success: allSuccess,
            details: summary
        };
    }
}

module.exports = ParallelTestRunner;
