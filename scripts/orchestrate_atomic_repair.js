/**
 * Orchestrate Atomic Analysis & Repair
 * -----------------------------------
 * This script demonstrates how to use the MCP bridge tools to:
 *   1. Load the `nexus-core` master skill (which enables the `Agent` tool).
 *   2. Read the list of specialist agents from `AGENTS.md`.
 *   3. Invoke each agent with a standard payload that starts an
 *      "atomic analysis" routine.
 *   4. Collect the results, aggregate them, and report a readiness score.
 *
 * The script is intended to be run with Node.js inside the workspace:
 *   node scripts/orchestrate_atomic_repair.js
 *
 * Prerequisites
 *   - The MCP server must be running (default port 3847).
 *   - The active skill should be `nexus-core` (or a skill that allows the
 *     `Agent` tool). You can activate it with `LoadSkill("nexus-core")` via
 *     the MCP console before running this script.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const MCP_HOST = process.env.MCP_HOST || 'localhost';
const MCP_PORT = process.env.MCP_PORT || 3847;
const AGENTS_MD = path.resolve(__dirname, '..', 'AGENTS.md');

/** Helper to call an MCP tool via HTTP POST */
function callMcpTool(toolName, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ tool: toolName, args: payload });
    const options = {
      hostname: MCP_HOST,
      port: MCP_PORT,
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/** Parse AGENTS.md to extract agent identifiers.
 *  The file follows a markdown list; we take lines that start with "- " and
 *  capture the text before the first back‑tick or parenthesis.
 */
function extractAgentNames(content) {
  const lines = content.split(/\r?\n/);
  const agents = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      // Remove leading dash and any markdown formatting
      const name = trimmed.slice(2).split('`')[0].split('(')[0].trim();
      if (name) agents.push(name);
    }
  }
  return agents;
}

async function main() {
  console.error('🔧 Starting atomic analysis & repair orchestration');

  // 1. Load the master skill to ensure the Agent tool is available.
  try {
    await callMcpTool('LoadSkill', { skill: 'nexus-core' });
    console.error('✅ Loaded skill: nexus-core');
  } catch (e) {
    console.error('❌ Failed to load skill', e);
    process.exit(1);
  }

  // 2. Read AGENTS.md
  let agentsContent;
  try {
    agentsContent = fs.readFileSync(AGENTS_MD, 'utf-8');
  } catch (e) {
    console.error('❌ Unable to read AGENTS.md', e);
    process.exit(1);
  }
  const agentNames = extractAgentNames(agentsContent);
  console.error(`📋 Found ${agentNames.length} agent entries`);

  // 3. Invoke each agent with a standard payload.
  const results = [];
  for (const name of agentNames) {
    console.error(`🚀 Invoking agent: ${name}`);
    try {
      const res = await callMcpTool('Agent', {
        description: `تحليل ذري وإصلاح للوكيل ${name}`,
        prompt: `ابدأ تحليلًا ذريًا للمنظومة باستخدام مهاراتك المتخصصة ثم قدم توصيات إصلاحية.`,
        run_in_background: false,
        name,
      });
      results.push({ name, result: res });
    } catch (e) {
      console.error(`⚠️ Agent ${name} failed`, e);
      results.push({ name, error: e.message });
    }
  }

  // 4. Aggregate results and compute a simple readiness score.
  const successful = results.filter((r) => !r.error).length;
  const total = results.length;
  const readiness = ((successful / total) * 100).toFixed(2);

  const report = {
    timestamp: new Date().toISOString(),
    totalAgents: total,
    successfulAgents: successful,
    readinessScore: `${readiness}%`,
    details: results,
  };

  const reportPath = path.resolve(__dirname, '..', '.agents', 'reports', 'atomic_repair_report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.error(`📊 Report written to ${reportPath}`);
  console.error(`🚦 Final readiness: ${readiness}%`);
}

main();
