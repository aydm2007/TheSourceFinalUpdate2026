// openrouter_adapter.js — Compatibility Bridge for Aether Engine
// Redirects legacy imports to the new RelayBridge logic.

const { RelayBridge } = require('./relay_bridge.js');

class OpenRouterAdapter extends RelayBridge {
    constructor(apiKey) {
        // Force provider to openrouter
        process.env.AETHER_PROVIDER = 'openrouter';
        super(apiKey);
        console.log('[Aether-Bridge] OpenRouterAdapter initialized via RelayBridge.');
    }
}

module.exports = {
    OpenRouterAdapter,
    RelayBridge
};
