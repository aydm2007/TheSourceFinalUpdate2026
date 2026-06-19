const sharedMcp = require('./core/mcp/shared_mcp_core.js');
const bridgeModule = require('./nexus_bridge.js');
const fs = require('fs');
const path = require('path');
const bridgeConfig = JSON.parse(fs.readFileSync('./bridge.json', 'utf8'));

const mcpTools = sharedMcp.loadAllBridgeTools(bridgeModule, bridgeConfig, true);
const rootDir = __dirname;
const filteredTools = sharedMcp.getFilteredToolsForClient(mcpTools, rootDir);

console.error('Total tools in bridge.json:', bridgeConfig.allowed_tools.length);
console.error('Total KAIROS_TOOLS raw:', bridgeModule.KAIROS_TOOLS.length);
console.error('Total MCP_TOOLS loaded:', mcpTools.length);
console.error('Total filtered tools exposed to client:', filteredTools.length);
