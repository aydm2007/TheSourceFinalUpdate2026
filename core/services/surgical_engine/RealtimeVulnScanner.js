/**
 * RealtimeVulnScanner.js — Sovereign Sigma V12.0
 * ----------------------------------------------
 * الماسح الأمني اللحظي الذي يمنع التراجع الأمني (Security Regression).
 */
const recast = require('recast');

class RealtimeVulnScanner {
    scan(ast) {
        const findings = [];
        
        recast.visit(ast, {
            visitLiteral(path) {
                const val = String(path.node.value);
                // Check for hardcoded keys/secrets
                if (/([a-zA-Z0-9_-]{24,})/.test(val) && (val.includes('sk-') || val.includes('key-') || val.includes('PWD') || val.includes('SECRET'))) {
                    findings.push({ type: "CWE-798: HARDCODED_CREDENTIALS", detail: `Potential secret found in literal: ${val.substring(0, 4)}...` });
                }
                return false;
            },
            visitCallExpression(path) {
                const callee = path.node.callee;
                if (callee.name === 'dangerouslySetInnerHTML') {
                    findings.push({ type: "CWE-79: XSS_RISK", detail: "Usage of dangerouslySetInnerHTML detected." });
                }
                if (callee.name === 'eval') {
                    findings.push({ type: "CWE-95: CODE_INJECTION", detail: "Use of eval() is strictly prohibited in sovereign code." });
                }
                return false;
            },
            visitIdentifier(path) {
                if (path.node.name === 'password' || path.node.name === 'secret_key') {
                    findings.push({ type: "SENSITIVE_VARIABLE_NAMING", detail: `Variable name '${path.node.name}' suggests sensitive data handling without encryption.` });
                }
                return false;
            }
        });

        const riskScore = findings.length * 0.4;
        return {
            safe: findings.length === 0,
            riskScore: Math.min(riskScore, 1.0),
            findings
        };
    }
}

module.exports = RealtimeVulnScanner;
