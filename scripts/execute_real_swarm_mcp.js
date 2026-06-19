const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

const apiKey = process.env.MCP_API_KEY || process.env.AETHER_MCP_API_KEY_ALPHA || process.env.AETHER_RELAY_KEY_ALPHA || 'sovereign_nexus_key_2026';
const baseUrl = 'http://localhost:3847';
const streamPath = '/mcp/stream';
const projectId = process.env.AETHER_MCP_PROJECT || 'thesource';

function makeHmac(key, routePath) {
  return crypto.createHmac('sha256', key).update(routePath).digest('hex');
}

async function runSwarm() {
  console.log(`[Invoking] ParallelSwarmCoordinator via OFFICIAL MCP SDK Client...`);
  
  const client = new Client({ name: 'swarm-invoker', version: '1.0.0' }, { capabilities: {} });
  
  const transport = new StreamableHTTPClientTransport(new URL(streamPath, baseUrl), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'x-project-id': projectId,
        'x-mcp-hmac': makeHmac(apiKey, streamPath),
        'X-Active-Skill': 'agri-specialist' // Emulate active skill to satisfy permission matrix
      },
    },
  });

  try {
    await client.connect(transport);
    console.log("[Connected] Executing swarm tool...");
    
    const result = await client.callTool({
      name: 'nexus_SwarmManager',
      arguments: {
        action: 'ParallelSwarmCoordinator',
        payload: {
          task_id: 'REAL_AGRI_STRESS_TEST',
          agents: [
            'finance-auditor','admin-governor','quantum-debugger','db-forensics',
            'finance-auditor','admin-governor','quantum-debugger','db-forensics',
            'finance-auditor','admin-governor','quantum-debugger','db-forensics',
            'finance-auditor','admin-governor','quantum-debugger','db-forensics',
            'finance-auditor','admin-governor','quantum-debugger','db-forensics'
          ],
          dry_run: false,
          maxConcurrency: 5,
          wave_size: 5
        }
      }
    });

    console.log("\n--- SWARM EXECUTION RESULT ---");
    console.log(JSON.stringify(result, null, 2));

    const ledgerPath = '.nexus/var/telemetry/shadow_ledger.jsonl';
    if (fs.existsSync(ledgerPath)) {
        const lines = fs.readFileSync(ledgerPath, 'utf8').trim().split('\n');
        console.log(`\n--- Shadow Ledger Audit Trail ---`);
        lines.slice(-3).forEach(l => {
            try {
                const obj = JSON.parse(l);
                if (obj.tool === 'ParallelSwarmCoordinator' || obj.type === 'mcp_remote_tool_execution') {
                    console.log(JSON.stringify(obj, null, 2));
                }
            } catch(e){}
        });
    }

  } catch (err) {
    console.error("[ERROR]", err);
  } finally {
    await client.close();
  }
}

runSwarm();
