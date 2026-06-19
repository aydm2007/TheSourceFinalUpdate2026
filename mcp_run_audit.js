const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function runMcpAudit() {
  console.error('[MCP-Audit] Starting Stdio Client for Sovereign Diagnostics...');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['mcp_bridge_server.js'],
    env: { ...process.env, NODE_ENV: 'development' }
  });

  const client = new Client(
    { name: "audit-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  try {
    await client.connect(transport);
    console.error('✅ Connected to Sovereign MCP Server.');

    // Execute OmegaDiagnostic
    console.error('\n[MCP-Audit] Executing OmegaDiagnostic tool...');
    const diagResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'nexus_OmegaDiagnostic',
        arguments: { target: 'AgriAsset_YECO_Enterprise_Final2' }
      }
    }, require('@modelcontextprotocol/sdk/types.js').CallToolResultSchema);

    if (diagResult.isError) {
       console.error('OmegaDiagnostic Error:', diagResult.content);
    } else {
       console.error('\n--- OmegaDiagnostic Output ---');
       console.error(diagResult.content[0].text);
    }

    // Execute VisualAuditReport
    console.error('\n[MCP-Audit] Executing VisualAuditReport tool...');
    const auditResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'nexus_VisualAuditReport',
        arguments: { format: 'markdown', level: 'atomic' }
      }
    }, require('@modelcontextprotocol/sdk/types.js').CallToolResultSchema);

    if (auditResult.isError) {
       console.error('VisualAuditReport Error:', auditResult.content);
    } else {
       console.error('\n--- VisualAuditReport Output ---');
       console.error(auditResult.content[0].text);
    }

  } catch (error) {
    console.error('❌ MCP Audit Failed:', error);
  } finally {
    try {
        await transport.close();
    } catch(e) {}
  }
}

runMcpAudit();
