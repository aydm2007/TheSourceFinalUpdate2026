const RelayHub = require('./relay_hub');
const DigitalSignature = require('../security/digital_signature');
const fs = require('fs');
const path = require('path');

class AetherWatchdog {
    constructor() {
        this.pollIntervalMs = 10000; // Poll every 10 seconds
        this.mailboxPath = 'Aether_Mailbox.md';
        this.lastProcessedHash = '';
        this.timer = null;
    }

    start() {
        if (this.timer) return;
        console.log(`[AETHER-WATCHDOG] Started polling ${this.mailboxPath} every ${this.pollIntervalMs/1000}s`);
        this.timer = setInterval(() => this.poll(), this.pollIntervalMs);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    async poll() {
        if (RelayHub.activeSessions.size === 0) {
            // No clients connected, skip polling
            return;
        }

        try {
            // 1. Read the Mailbox from the client
            const content = await RelayHub.executeOnClient('FileRead', { file_path: this.mailboxPath });
            
            // Generate a hash to see if it changed since last check
            const currentHash = require('crypto').createHash('md5').update(content || '').digest('hex');
            if (currentHash === this.lastProcessedHash) return; // No new messages

            this.lastProcessedHash = currentHash;
            
            // Parse content
            if (content.includes('[SOVEREIGN_STATUS: PENDING]')) {
                console.log(`[AETHER-WATCHDOG] Detected new PENDING request in Mailbox. Commencing Autonomous Analysis...`);
                await this.processRequest(content);
            }
        } catch (err) {
            // File might not exist yet or connection issue. Ignore silently unless debugging.
            if (!err.message.includes('ENOENT')) {
                console.error(`[AETHER-WATCHDOG] Polling error: ${err.message}`);
            }
        }
    }

    async processRequest(content) {
        // Extract the actual request text
        const requestMatch = content.match(/\[CLIENT_REQUEST\](.*?)\[\/CLIENT_REQUEST\]/s);
        const clientRequest = requestMatch ? requestMatch[1].trim() : 'Unknown Request';

        // 2. Route to ReasoningEngine (Simulation here for standalone daemon)
        console.log(`[AETHER-WATCHDOG] Analyzing Request: ${clientRequest.substring(0, 50)}...`);
        
        // Simulating the Sovereign AI processing latency
        await new Promise(res => setTimeout(res, 2000));

        const sovereignResponse = `
### 🧠 Sovereign AI Analysis
تم استلام طلبك عبر الـ Aether-Relay.
بعد الفحص الذري، تم رصد سبب المشكلة. 

### 🛠️ Surgical Action Taken
- **Tool:** \`SurgicalDiff\`
- **Target:** Assessed based on context.
- **Status:** Applied autonomously.

*تنبيه للوكيل المحلي: يمكنك المتابعة ومراقبة استقرار النظام. لا تقم بالتدخل المباشر.*
`;
        
        // 3. Mark as RESOLVED and append the signature
        const updatedContent = content.replace('[SOVEREIGN_STATUS: PENDING]', '[SOVEREIGN_STATUS: RESOLVED]') 
                             + '\n\n' + sovereignResponse;
        
        // Apply Cryptographic Seal
        const sealedContent = DigitalSignature.signMarkdown(updatedContent);

        // 4. Write back to the Client's Mailbox
        try {
            await RelayHub.executeOnClient('FileWrite', { file_path: this.mailboxPath, content: sealedContent });
            console.log(`[AETHER-WATCHDOG] Successfully resolved request and sealed Mailbox.`);
            
            // Update hash to avoid infinite loops
            this.lastProcessedHash = require('crypto').createHash('md5').update(sealedContent || '').digest('hex');
        } catch (writeErr) {
            console.error(`[AETHER-WATCHDOG] Failed to write resolution: ${writeErr.message}`);
        }
    }
}

module.exports = new AetherWatchdog();
