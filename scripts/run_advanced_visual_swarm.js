const fs = require('fs');
const path = require('path');
const { ParallelSwarmCoordinator } = require('../core/bridge/handlers/swarm_handlers.js');

async function runAdvancedVisualSwarm() {
    console.log("🌌 Starting Advanced Visual-Adversarial Swarm (Set-of-Mark & MCTS) for TheSource...");
    const startTime = Date.now();

    const agents = [
        { name: 'visual-semantic-tester', description: 'Evaluates UI layouts and 3D scenes using nvidia/nemotron-nano-12b-v2-vl:free with overlaid coordinate markings (Set-of-Mark).', type: 'Visual' },
        { name: 'opponent-critic', description: 'Acts as the adversarial validator using openai/gpt-oss-120b:free-opponent to audit code quality, matrix math, and contrast levels.', type: 'Adversary' },
        { name: 'game3d-architect', description: 'Generates robust WebGL, canvas rendering loops, and physics collision logic via Three.js.', type: 'Developer' },
        { name: 'mcts-path-solver', description: 'Executes Monte Carlo Tree Search paths over code variations to find optimal rendering calculations.', type: 'Architect' },
        { name: 'dynamic-tool-synthesizer', description: 'Compiles and sandboxes temporary MCP tools to perform file-level parsing and AST optimizations.', type: 'Integrator' }
    ];

    const context = {
        __dirname: path.resolve(__dirname, '..'),
        FEATURE_FLAGS: { SWARM_MODE: true },
        logShadow: (entry) => {
            const auditPath = path.join(path.resolve(__dirname, '..'), '.nexus/var/telemetry/shadow_ledger.jsonl');
            const dir = path.dirname(auditPath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.appendFileSync(auditPath, JSON.stringify({
                timestamp: new Date().toISOString(),
                ...entry
            }) + '\n');
        }
    };

    const args = {
        task_id: 'ADVANCED_VISUAL_SWARM_' + Date.now(),
        agents: agents,
        wave_size: 5,
        maxConcurrency: 5,
        dry_run: false
    };

    console.log(`⏳ Mobilizing ${agents.length} specialized visual-adversarial agents across waves...`);

    try {
        const resultString = await ParallelSwarmCoordinator(args, context);
        const result = JSON.parse(resultString);
        const duration = Date.now() - startTime;

        console.log(`\n✅ Advanced Visual Swarm coordination completed in ${duration}ms.`);
        console.log(`Total agents launched: ${result.total_agents}`);
        console.log(`Waves executed: ${result.waves}`);
        
        result.tasks.forEach(task => {
            console.log(`  Wave ${task.wave}:`);
            task.launched.forEach(msg => console.log(`    - ${msg}`));
        });

        const report = {
            status: "SUCCESS",
            duration_ms: duration,
            timestamp: new Date().toISOString(),
            swarm_result: result
        };

        const reportDir = path.join(path.resolve(__dirname, '..'), 'reports');
        if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
        
        fs.writeFileSync(path.join(reportDir, 'advanced_visual_swarm_execution.json'), JSON.stringify(report, null, 2));
        console.log(`\n📝 Advanced visual swarm report written to reports/advanced_visual_swarm_execution.json`);

    } catch (err) {
        console.error(`❌ Advanced Visual Swarm execution failed:`, err);
        process.exit(1);
    }
}

runAdvancedVisualSwarm();
