const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function runMcpTest() {
  console.error('[MCP-Test] Starting Stdio Client...');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['mcp_bridge_server.js'],
    env: { ...process.env, NODE_ENV: 'development' }
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  try {
    await client.connect(transport);
    console.error('✅ Connected to MCP Server via stdio.');

    // 1. Test List Tools
    const toolsResponse = await client.request({ method: 'tools/list' }, require('@modelcontextprotocol/sdk/types.js').ListToolsResultSchema);
    console.error(`✅ Tools Available: ${toolsResponse.tools.length}`);
    
    // Sample a few tools
    console.error('Sample Tools:');
    toolsResponse.tools.slice(0, 3).forEach(t => console.error(`  - ${t.name}`));

    // 2. Test Calling a Tool (e.g., SystemDiagnostics)
    console.error('\n[MCP-Test] Executing SystemDiagnostics tool...');
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'nexus_SystemDiagnostics',
        arguments: {}
      }
    }, require('@modelcontextprotocol/sdk/types.js').CallToolResultSchema);

    console.error('✅ Tool Execution Result:');
    if (result.isError) {
       console.error('Error:', result.content);
    } else {
       console.error(result.content[0].text);
    }

    // 3. Test a Facade tool
    console.error('\n[MCP-Test] Executing Facade Tool (TaskManager -> TaskList)...');
    const taskResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'nexus_TaskManager',
        arguments: { action: 'TaskList', payload: {} }
      }
    }, require('@modelcontextprotocol/sdk/types.js').CallToolResultSchema);

    console.error('✅ Facade Tool Execution Result:');
    if (taskResult.isError) {
       console.error('Error:', taskResult.content);
    } else {
       console.error(taskResult.content[0].text.substring(0, 200) + '...'); // Truncate output
    }

  } catch (error) {
    console.error('❌ MCP Test Failed:', error);
  } finally {
    try {
        await transport.close();
    } catch(e) {}
  }
}

runMcpTest();
