const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function runMcpCleanAndEvaluate() {
  console.error('[MCP-Action] Starting Stdio Client for Sovereign Cleanup & Evaluation...');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['mcp_bridge_server.js'],
    env: { ...process.env, NODE_ENV: 'development' }
  });

  const client = new Client(
    { name: "clean-eval-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  try {
    await client.connect(transport);
    console.error('✅ Connected to Sovereign MCP Server.');

    // 1. Cleaning Project using MCP PowerShell Tool
    console.error('\n[MCP-Action] 🧹 Executing nexus_PowerShell to clean AgriAsset project (__pycache__)...');
    const cleanCmd = `Get-ChildItem -Path c:\\tools\\workspace\\AgriAsset_YECO_Enterprise_Final2 -Include __pycache__ -Recurse -Directory -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force`;
    const cleanResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'nexus_PowerShell',
        arguments: { command: cleanCmd }
      }
    }, require('@modelcontextprotocol/sdk/types.js').CallToolResultSchema);

    if (cleanResult.isError) {
       console.error('❌ Clean Error:', cleanResult.content);
    } else {
       console.error('✅ Project clean complete. Stale caches eliminated.');
    }

    // 2. Compacting Telemetry via MCP MemoryCompactor
    console.error('\n[MCP-Action] 🧹 Executing nexus_MemoryCompactor to clean telemetry bloat...');
    const memResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'nexus_MemoryCompactor',
        arguments: { memory_directory: 'c:\\tools\\workspace\\TheSource\\.nexus\\var\\telemetry', compaction_ratio: 0.8 }
      }
    }, require('@modelcontextprotocol/sdk/types.js').CallToolResultSchema);
    
    if (memResult.isError) {
        console.error('❌ MemoryCompactor Error:', memResult.content);
    } else {
        console.error('✅ Telemetry compacted successfully.');
    }

    // 3. Atomical Evaluation via OmegaDiagnostic
    console.error('\n[MCP-Action] 📊 Executing nexus_OmegaDiagnostic for 100/100 Evaluation...');
    const diagResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'nexus_OmegaDiagnostic',
        arguments: { target: 'AgriAsset_YECO_Enterprise_Final2' }
      }
    }, require('@modelcontextprotocol/sdk/types.js').CallToolResultSchema);

    if (diagResult.isError) {
       console.error('❌ OmegaDiagnostic Error:', diagResult.content);
    } else {
       console.error('\n--- 🌟 OmegaDiagnostic Atomic Score Output ---');
       console.error(diagResult.content[0].text);
    }

  } catch (error) {
    console.error('❌ MCP Execution Failed:', error);
  } finally {
    try {
        await transport.close();
    } catch(e) {}
  }
}

runMcpCleanAndEvaluate();
