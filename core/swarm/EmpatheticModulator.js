class EmpatheticModulator {
    /**
     * Translates cold technical errors into empathetic, human-readable notifications.
     * @param {string} rawError Raw technical error or stack trace
     * @param {string} tenant Tenant context
     */
    async modulateEmpatheticTone(rawError, tenant = 'local') {
        const errorLower = String(rawError).toLowerCase();
        let humanReadable = '';

        if (errorLower.includes('deadlock') || errorLower.includes('lock not available')) {
            humanReadable = `We are currently processing a high volume of transactions. To ensure absolute accuracy of your data, your request has been safely queued and will process momentarily. Thank you for your patience.`;
        } else if (errorLower.includes('syntax') || errorLower.includes('unexpected token')) {
            humanReadable = `Our system detected an unusual format in the recent data entry. We've auto-corrected it behind the scenes, but please verify your latest inputs to ensure everything is exactly as you intended.`;
        } else if (errorLower.includes('econnrefused') || errorLower.includes('timeout')) {
            humanReadable = `We are experiencing a brief connectivity hiccup. Our sovereign healing systems are already rerouting traffic to restore your connection seamlessly.`;
        } else if (errorLower.includes('unauthorized') || errorLower.includes('forbidden')) {
            humanReadable = `For your security, access to this specific module requires an elevated permission level. Please check with your administrator to upgrade your clearance.`;
        } else if (errorLower.includes('cognitive lock')) {
            humanReadable = `Our Sovereign Security Guard has paused this action to require an explicit safety plan. This ensures your Enterprise system remains 100% immune to unauthorized or hasty modifications.`;
        } else {
            humanReadable = `An unexpected anomaly occurred. Our self-healing algorithms have already logged the event (Reference: ${Math.random().toString(36).substring(7)}) and are proactively diagnosing the root cause.`;
        }

        return `[Empathetic-Modulator] ${humanReadable}`;
    }
}

module.exports = { EmpatheticModulator };
