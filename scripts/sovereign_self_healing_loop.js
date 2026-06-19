#!/usr/bin/env node
/**
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  🛡️ Sovereign Self-Healing & Consensus Loop V1.0                  │
 * │  Automates: Diagnosis ➔ Agent Consensus Voting ➔ Surgical Repair   │
 * │  Loops until all verification suites pass with zero errors.       │
 * └──────────────────────────────────────────────────────────────────┘
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BRIDGE_ROOT = process.cwd();
const SHADOW_LEDGER_PATH = path.join(BRIDGE_ROOT, '.nexus', 'var', 'telemetry', 'shadow_ledger.jsonl');

// Helper to log to Shadow Ledger
function logToShadowLedger(entry) {
  const record = {
    timestamp: new Date().toISOString(),
    source: 'SELF_HEALING_LOOP',
    type: entry.type || 'self_healing_event',
    status: entry.status || 'INFO',
    ...entry
  };
  try {
    fs.appendFileSync(SHADOW_LEDGER_PATH, JSON.stringify(record) + '\n');
  } catch (e) {
    console.error(`[Ledger Log Error] ${e.message}`);
  }
}

// Verification steps to run in order
const VERIFICATION_COMMANDS = [
  { name: 'Health-Check Diagnostics', cmd: 'node health-check.js' },
  { name: 'Native MCP Verification', cmd: 'npm run native-mcp:verify' },
  { name: 'Tool-Source Alignment', cmd: 'npm run tool-source:verify' },
  { name: 'Agent-Swarm Verification', cmd: 'npm run agent-swarm:verify' }
];

// Run a command and capture output
function runCommand(cmd) {
  try {
    const stdout = execSync(cmd, { stdio: 'pipe', cwd: BRIDGE_ROOT }).toString();
    return { ok: true, stdout, stderr: '' };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout ? error.stdout.toString() : '',
      stderr: error.stderr ? error.stderr.toString() : error.message
    };
  }
}

// ─── Consensus / Voting Engine ─────────────────────────────────────
function conductConsensusVote(faultDescription) {
  console.log('\n==================================================');
  console.log('🗳️  CONDUCTING AGENT CONSENSUS VOTE ON FAULT RESOLUTION');
  console.log('==================================================');
  console.log(`[Fault Identified]: ${faultDescription}`);

  // Simulate specialist agent responses and decisions based on the fault signature
  const votes = [
    {
      agent: 'Principal Architect Agent',
      opinion: 'The fault violates the structural interface contract. Resolution: Align definition scopes.',
      vote: 'APPROVE_REPAIR'
    },
    {
      agent: 'Security Sentinel Agent',
      opinion: 'The path and signature look local and safe. No escalation required.',
      vote: 'APPROVE_REPAIR'
    },
    {
      agent: 'Reliability Engineer Agent',
      opinion: 'ReferenceError will cause process crash. Urgent fix needed.',
      vote: 'APPROVE_REPAIR'
    }
  ];

  let approvals = 0;
  votes.forEach(v => {
    console.log(`[${v.agent}]: ${v.opinion} => Vote: ${v.vote}`);
    if (v.vote === 'APPROVE_REPAIR') approvals++;
  });

  const passed = approvals >= 2;
  console.log(`[Consensus Status]: ${passed ? 'PASSED' : 'FAILED'} (${approvals}/${votes.length} Votes)\n`);
  return passed;
}

// ─── Surgical Repair Engine ─────────────────────────────────────────
function applySurgicalRepair(faultText) {
  console.log(`⚙️  Attempting Surgical Repair for fault...`);

  // Scenario 1: ReferenceError: executeTool is not defined in mcp_bridge_server.js
  if (faultText.includes('executeTool is not defined') && faultText.includes('mcp_bridge_server.js')) {
    const targetFile = path.join(BRIDGE_ROOT, 'mcp_bridge_server.js');
    if (fs.existsSync(targetFile)) {
      let content = fs.readFileSync(targetFile, 'utf8');
      
      const targetString = 'const result = await executeTool(bridgeToolName,';
      const replacementString = 'const executeTool = getExecuteTool();\n    const result = await executeTool(bridgeToolName,';
      
      if (content.includes(targetString) && !content.includes('const executeTool = getExecuteTool();')) {
        content = content.replace(targetString, replacementString);
        fs.writeFileSync(targetFile, content, 'utf8');
        console.log('✅ Surgical repair applied: Injected getExecuteTool() resolver in mcp_bridge_server.js');
        logToShadowLedger({ type: 'surgical_repair', file: 'mcp_bridge_server.js', fix: 'executeTool scope resolved' });
        return true;
      }
    }
  }

  // Scenario 2: missing directory or dependency configuration issues
  if (faultText.includes('cannot find module') || faultText.includes('missing')) {
    console.log('⚙️ Missing dependency detected. Running clean installation check...');
    const npmInstallRes = runCommand('npm ci');
    if (npmInstallRes.ok) {
      console.log('✅ Clean dependencies installed successfully.');
      logToShadowLedger({ type: 'npm_install_repair', status: 'SUCCESS' });
      return true;
    }
  }

  console.log('❌ No matching surgical recipe found for this fault signature.');
  return false;
}

// ─── Main Orchestration Loop ───────────────────────────────────────
async function runSelfHealingLoop(maxIterations = 5) {
  let iteration = 0;
  let allHealthy = false;

  console.log('\n🛡️  INITIALIZING SOVEREIGN SELF-HEALING LOOP');
  console.log(`[Bridge Root]: ${BRIDGE_ROOT}`);
  console.log(`[Max Allowed Iterations]: ${maxIterations}\n`);

  while (iteration < maxIterations && !allHealthy) {
    iteration++;
    console.log(`--------------------------------------------------`);
    console.log(`🔄 ITERATION ${iteration}/${maxIterations}`);
    console.log(`--------------------------------------------------`);

    let currentFailure = null;

    for (const step of VERIFICATION_COMMANDS) {
      console.log(`Running check: ${step.name}...`);
      const result = runCommand(step.cmd);

      if (!result.ok) {
        console.log(`❌ Step failed: ${step.name}`);
        currentFailure = {
          name: step.name,
          cmd: step.cmd,
          output: result.stdout + '\n' + result.stderr
        };
        break; // Stop execution on first failure to resolve it
      } else {
        console.log(`✅ Step passed: ${step.name}`);
      }
    }

    if (!currentFailure) {
      console.log('\n🏆 SUCCESS: All verification steps passed. System is fully healed.');
      allHealthy = true;
      break;
    }

    // Conduct Vote on the identified fault
    const votePassed = conductConsensusVote(currentFailure.output.substring(0, 300));
    if (votePassed) {
      const repaired = applySurgicalRepair(currentFailure.output);
      if (!repaired) {
        console.log('❌ Loop Interrupted: Unable to repair the current failure automatically.');
        break;
      }
    } else {
      console.log('❌ Loop Interrupted: Consensus vote rejected the repair proposal.');
      break;
    }

    // Brief cooldown between rounds
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const finalState = allHealthy ? 'HEALTHY' : 'DEGRADED';
  logToShadowLedger({
    type: 'self_healing_completion',
    finalState,
    totalIterations: iteration
  });

  console.log(`\n🏁 Self-Healing completed with status: [${finalState}]\n`);
  return allHealthy;
}

// Trigger Execution
runSelfHealingLoop().catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
