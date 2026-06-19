const crypto = require('crypto');

const SECRET_KEY = process.env.AETHER_MCP_API_KEY || 'PLACEHOLDER_SECRET_KEY';

class DigitalSignature {
    /**
     * Generate a deterministic hash for the content
     */
    static generateHash(content, timestamp) {
        return crypto.createHmac('sha256', SECRET_KEY)
            .update(content)
            .update(timestamp.toString())
            .digest('hex');
    }

    /**
     * Inject the signature into an HTML string
     */
    static signHtml(content) {
        const timestamp = new Date().toISOString();
        const hash = this.generateHash(content, timestamp);
        const shortHash = hash.substring(0, 16);

        const signatureBlock = `
<!-- ========================================== -->
<!-- 🛡️ SOVEREIGN DIGITAL SIGNATURE (IQ SEAL)   -->
<!-- ========================================== -->
<div style="margin-top: 50px; padding: 20px; background: rgba(10, 15, 25, 0.8); border: 1px solid rgba(0, 255, 170, 0.3); border-radius: 12px; font-family: monospace; color: #a0aec0; display: flex; align-items: center; justify-content: space-between; backdrop-filter: blur(10px); box-shadow: 0 0 20px rgba(0, 255, 170, 0.05);">
    <div>
        <div style="color: #00ffaa; font-weight: bold; font-size: 1.1em; margin-bottom: 5px;">
            <svg style="width: 16px; height: 16px; vertical-align: middle; margin-right: 5px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            CERTIFIED BY THESOURCE (V17.0 OMEGA)
        </div>
        <div style="font-size: 0.9em; opacity: 0.8;">Sovereign Swarm Remote Execution Node</div>
        <div style="font-size: 0.8em; opacity: 0.6; margin-top: 5px;">Timestamp: ${timestamp}</div>
    </div>
    <div style="text-align: right;">
        <div style="font-size: 0.7em; color: rgba(255,255,255,0.4); margin-bottom: 3px;">CRYPTOGRAPHIC IQ HASH (SHA-256)</div>
        <div style="background: rgba(0,0,0,0.5); padding: 5px 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); color: #00ffaa; letter-spacing: 1px;">
            ${shortHash}...
        </div>
        <meta name="sovereign-hash" content="${hash}">
        <meta name="sovereign-timestamp" content="${timestamp}">
    </div>
</div>
<!-- ========================================== -->
`;

        // Attempt to inject right before </body>, else just append
        if (content.includes('</body>')) {
            return content.replace('</body>', `${signatureBlock}\n</body>`);
        } else {
            return content + '\n' + signatureBlock;
        }
    }

    /**
     * Inject the signature into a Markdown string
     */
    static signMarkdown(content) {
        const timestamp = new Date().toISOString();
        const hash = this.generateHash(content, timestamp);
        const shortHash = hash.substring(0, 16);

        const signatureBlock = `

---
> **🛡️ CERTIFIED BY THESOURCE (V17.0 OMEGA)**
> Sovereign Swarm Remote Execution Node
> **Timestamp:** \`${timestamp}\`
> **Cryptographic IQ Hash:** \`${shortHash}...\`
<!-- SOV_HASH:${hash} -->
`;
        return content + signatureBlock;
    }
}

module.exports = DigitalSignature;
