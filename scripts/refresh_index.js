const fs = require('fs');
const path = require('path');

console.error('[Indexer] Refreshing semantic index...');
const indexPath = path.join(__dirname, '..', 'data', 'vector_index.json');
if (!fs.existsSync(path.dirname(indexPath))) {
    fs.mkdirSync(path.dirname(indexPath), { recursive: true });
}

// Basic semantic map for LSPTool fallback
const indexData = {
    version: '1.0',
    last_updated: new Date().toISOString(),
    functions: [
        { name: 'executeTool', path: 'nexus_bridge.js' },
        { name: 'applyTokenGuard', path: 'nexus_bridge.js' },
        { name: 'runAgent', path: 'nexus_bridge.js' }
    ],
    classes: [
        { name: 'ToolOrchestrator', path: 'core/utils/tool_orchestrator.js' },
        { name: 'SiliconFlowAdapter', path: 'package/siliconflow_adapter.js' }
    ],
    models: []
};

fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2), 'utf8');
console.error(`[Indexer] Done. Updated ${indexPath}`);
