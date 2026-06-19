/**
 * astAutoPatch.js — Sovereign Sigma V12.0
 * -----------------------------------------
 * الجسر الهيكلي بين أوامر الـ CLI وعمليات الجراحة الذرية.
 */
const JSSurgicalEngine = require('./js_surgeon.js');
const path = require('path');

class ASTAutoPatch {
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
        this.jsEngine = new JSSurgicalEngine(workspaceRoot);
    }

    async applyPatch(targetFile, className, methodName, patchCode) {
        const ext = path.extname(targetFile);
        console.log(`[astAutoPatch] Applying patch to ${targetFile} -> ${methodName}`);

        if (ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx') {
            this.jsEngine.loadToSandbox(targetFile);
            const res = this.jsEngine.simulateMethodPatch(targetFile, className, methodName, patchCode);
            if (res.success) {
                const blast = this.jsEngine.calculateBlastRadius(targetFile);
                return { success: true, engine: 'recast', blast };
            }
            return { success: false, reason: res.message };
        }
        
        // Python and other extensions handled via coordinator
        return { success: false, reason: "Unsupported extension for direct patch" };
    }
}

module.exports = ASTAutoPatch;
