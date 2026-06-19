// siliconflow_adapter.js — Compatibility Bridge for Aether Engine
// Redirects legacy imports to the new RelayBridge logic.

const { RelayBridge } = require('./relay_bridge.js');

// Standard Adapter Export for legacy support
class SiliconFlowAdapter extends RelayBridge {
    constructor(apiKey) {
        super(apiKey);
        console.log('[Aether-Bridge] Legacy SiliconFlowAdapter initialized via RelayBridge.');
    }
}

module.exports = {
    SiliconFlowAdapter,
    RelayBridge
};
