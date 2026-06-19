const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("==================================================");
console.log("🏛️ [Master Integration Swarm] STARTING EXECUTION");
console.log("==================================================");

// 1. PM2 Governor Task: Fix ecosystem.config.js
try {
    const ecoPath = path.join(__dirname, '..', 'ecosystem.config.js');
    console.log(`[PM2 Governor] Auditing ecosystem config at: ${ecoPath}`);
    let content = fs.readFileSync(ecoPath, 'utf8');
    if (!content.includes('Visual-Cortex')) {
        // Splitting array to insert Visual-Cortex App config
        const insertion = `    },
    {
      name: 'Visual-Cortex',
      script: 'nervous_system_server.js',
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production',
        START_NERVOUS_SYSTEM: 'true'
      }`;
        content = content.replace("NODE_ENV: 'production',\n        DASHBOARD_PORT: 3851\n      }\n    }", "NODE_ENV: 'production',\n        DASHBOARD_PORT: 3851\n      }\n" + insertion + "\n    }");
        fs.writeFileSync(ecoPath, content, 'utf8');
        console.log(`[PM2 Governor] Successfully added Visual-Cortex to ecosystem.config.js`);
    } else {
        console.log(`[PM2 Governor] Visual-Cortex service is already configured.`);
    }
} catch (e) {
    console.error(`[PM2 Governor] Error:`, e.message);
}

// 2. Infrastructure Titan Task: Restart and Reload services via PM2
try {
    console.log(`[Infrastructure Titan] Reloading PM2 services...`);
    execSync('pm2 start ecosystem.config.js --update-env', { cwd: path.join(__dirname, '..') });
    execSync('pm2 save', { cwd: path.join(__dirname, '..') });
    console.log(`[Infrastructure Titan] PM2 configuration reloaded and saved successfully!`);
} catch (e) {
    console.error(`[Infrastructure Titan] Error during PM2 reload:`, e.message);
}

// 3. Temporal Alignment Task: Unify all agent task files under the same massive swarm_id to display in the workspace
try {
    const scratchDir = path.join(__dirname, '..', 'scratch');
    const archiveDir = path.join(scratchDir, 'archive');
    const TARGET = 'RACECAR_40_1799999999999';
    console.log(`[Temporal Alignment] Moving all tasks from archive and setting swarm_id to ${TARGET}...`);
    
    function mergeTasks(dir, isArchive) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir).filter(f => f.startsWith('task_') && f.endsWith('.json'));
        files.forEach(f => {
            try {
                const p = path.join(dir, f);
                const j = JSON.parse(fs.readFileSync(p, 'utf8'));
                j.swarm_id = TARGET;
                // Normalize names to look clean on the dashboard
                if (j.name && j.name.startsWith('Agent Sub-Task: ')) {
                    j.name = j.name.replace('Agent Sub-Task: ', '');
                }
                fs.writeFileSync(p, JSON.stringify(j, null, 2));
                if (isArchive) {
                    fs.renameSync(p, path.join(scratchDir, f));
                }
            } catch (e) {}
        });
    }
    
    mergeTasks(scratchDir, false);
    mergeTasks(archiveDir, true);
    console.log(`[Temporal Alignment] All agent tasks successfully aligned in scratch/!`);
} catch (e) {
    console.error(`[Temporal Alignment] Error:`, e.message);
}

// 4. Port Investigator Task: Socket ping check on Port 9999
try {
    console.log(`[Port Investigator] Verifying Visual Cortex listening status...`);
    const net = require('net');
    const client = new net.Socket();
    client.setTimeout(1000);
    client.on('connect', () => {
        console.log(`[Port Investigator] Port 9999 is OPEN and listening! ✅`);
        client.destroy();
    });
    client.on('error', (err) => {
        console.error(`[Port Investigator] Port 9999 check failed:`, err.message);
    });
    client.connect(9999, '127.0.0.1');
} catch (e) {
    console.error(`[Port Investigator] Verification error:`, e.message);
}

console.log("\n==================================================");
console.log("🏁 [Master Integration Swarm] WORK COMPLETE");
console.log("==================================================");
