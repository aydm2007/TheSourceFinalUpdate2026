/**
 * 🛡️ Security Redactor (SRE v2.0)
 * Scans generated reports and diagnostic output to redact API keys, tokens, and credentials before writing to disk or transmitting.
 */

const SECRET_PATTERNS = [
    /Authorization\s*:\s*Bearer\s+[^\s'"]+/gi,
    /Bearer\s+[A-Za-z0-9._~+/=-]{12,}/g,
    /\b(?:sk-ant-[A-Za-z0-9._-]{12,}|sk-proj-[A-Za-z0-9._-]{12,}|sk-[A-Za-z0-9._-]{20,}|xai-[A-Za-z0-9._-]{12,}|ghp_[A-Za-z0-9_]{20,}|gsk_[A-Za-z0-9._-]{12,}|AIza[A-Za-z0-9._-]{20,})\b/g,
    /((?:AETHER_MCP_API_KEY|NEXUS_API_KEY|MCP_API_KEY|API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY)\s*=\s*)[^\s]+/gi
];

class SecurityRedactor {
    /**
     * Scrubs all sensitive data from a string.
     * @param {string} text The target text to redact.
     * @returns {string} The sanitized text.
     */
    static redact(text) {
        if (!text || typeof text !== 'string') return text;
        let sanitized = text;
        
        SECRET_PATTERNS.forEach(pattern => {
            sanitized = sanitized.replace(pattern, (match, p1) => {
                // If it's a key-value assignment, preserve the key but redact the value
                if (p1) {
                    return `${p1}[REDACTED_SECRET]`;
                }
                return '[REDACTED_SECRET]';
            });
        });
        
        return sanitized;
    }
}

module.exports = SecurityRedactor;
