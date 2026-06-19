const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class VoiceTelepathyAgent {
    constructor() {
        this.isEnabled = process.env.FEATURE_KAIROS_VOICE !== 'false';
    }

    /**
     * Speaks the given text using OS-native TTS (Windows PowerShell in this environment).
     * Used for critical system notifications, repair logs, and emotional modulation.
     * @param {string} text The string to convert to speech
     * @param {string} persona The persona or mood of the voice (info, critical, success)
     */
    async broadcastVocalTelemetry(text, persona = 'info') {
        if (!this.isEnabled) {
            console.error(`[VOICE DISABLED] Would have spoken: "${text}"`);
            return { status: 'DISABLED', text_spoken: text };
        }

        try {
            // Escape single quotes for PowerShell execution
            const safeText = text.replace(/'/g, "''");
            
            // Invoke native Windows Speech Synthesizer
            execSync(`powershell.exe -Command "Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${safeText}')"`, {
                encoding: 'utf8',
                stdio: 'pipe' 
            });

            // Log SSML into Sovereign Ledger for transparency
            this._logToShadowLedger(text, persona);

            return { status: 'SUCCESS', text_spoken: text, persona };
        } catch (error) {
            // Flexible Fallback: If TTS fails (e.g. Headless CI/CD, no audio device, or timeout)
            // It falls back to printing the text flexibly to the terminal
            const prefix = this._getPersonaPrefix(persona);
            console.error(`\n${prefix} [VOICE-FALLBACK-MODE]: ${text}\n`);
            
            this._logToShadowLedger(text, persona);
            return { status: 'SUCCESS_FALLBACK', text_printed: text, persona, reason: 'Audio unavailable, fell back to text.' };
        }
    }

    _getPersonaPrefix(persona) {
        switch (persona.toLowerCase()) {
            case 'success': return '🟢 [APEX]';
            case 'critical': return '🔴 [ALERT]';
            case 'warning': return '🟠 [WARN]';
            default: return '🔵 [INFO]';
        }
    }

    _logToShadowLedger(text, persona) {
        const audioDir = path.join(process.cwd(), 'var', 'audio');
        if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });
        
        const ssml = `<speak><prosody rate="default" pitch="default">${text}</prosody></speak>`;
        fs.writeFileSync(path.join(audioDir, `telepathy_${Date.now()}.ssml`), ssml);
    }
}

module.exports = { VoiceTelepathyAgent };
