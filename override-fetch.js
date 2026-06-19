// override-fetch.js — DEPRECATED: Scheduled for removal in V10
// Migration: Use `siliconflow_adapter.js` directly or `preload.js` for SDK interception
// This file exists ONLY for backward compatibility with legacy imports.
console.warn('[Nexus-Omega] ⚠️ override-fetch.js is DEPRECATED. Use siliconflow_adapter.js directly.');
const { SiliconFlowAdapter } = require('./siliconflow_adapter.js');
module.exports = { SiliconFlowAdapter };
