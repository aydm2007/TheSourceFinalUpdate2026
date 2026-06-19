const sharedMcp = require('./core/mcp/shared_mcp_core.js');
const bridgeModule = require('./nexus_bridge.js');
const fs = require('fs');
const bridgeConfig = JSON.parse(fs.readFileSync('./bridge.json', 'utf8'));

const mcpTools = sharedMcp.loadAllBridgeTools(bridgeModule, bridgeConfig, true);
console.error('Total tools exposed by MCP Server:', mcpTools.length);
