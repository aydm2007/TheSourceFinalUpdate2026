require('dotenv').config();
const { RelayBridge } = require('./package/relay_bridge.js');
const fs = require('fs');

async function runRealSwarm() {
    console.log("🚀 [AgriAsset] Starting REAL 20-Agent LLM Swarm...");
    const relay = new RelayBridge(process.env.AETHER_RELAY_KEY_ALPHA);
    
    // We will launch them in waves to respect rate limits, but still test high concurrency.
    const agentsConfig = [
        { role: "Finance Auditor", count: 7 },
        { role: "Admin Governor", count: 7 },
        { role: "Quantum Debugger", count: 6 }
    ];

    let totalAgents = [];
    agentsConfig.forEach(conf => {
        for(let i=0; i<conf.count; i++) {
            totalAgents.push(conf.role);
        }
    });

    const waveSize = 5;
    const results = [];
    const startTime = Date.now();

    for (let i = 0; i < totalAgents.length; i += waveSize) {
        const wave = totalAgents.slice(i, i + waveSize);
        console.log(`🌊 Launching Wave ${Math.floor(i/waveSize) + 1} (${wave.length} Real Agents)...`);
        
        const wavePromises = wave.map(async (role, idx) => {
            const agentStart = Date.now();
            try {
                const response = await relay.createPulse({
                    model: process.env.AETHER_EXECUTOR_MODEL || "openai/gpt-4o-mini", // Fast model for testing
                    messages: [
                        { role: "system", content: `You are an AgriAsset ${role}. You are part of a 20-agent parallel stress test.` },
                        { role: "user", content: "Provide a very short 1-sentence diagnostic status of the AgriAsset vector database." }
                    ],
                    max_tokens: 50,
                    temperature: 0.7
                });
                return {
                    agent: role,
                    thread_id: i + idx + 1,
                    status: "success",
                    response: response.content[0].text,
                    duration_ms: Date.now() - agentStart
                };
            } catch (err) {
                return {
                    agent: role,
                    thread_id: i + idx + 1,
                    status: "failed",
                    error: err.message,
                    duration_ms: Date.now() - agentStart
                };
            }
        });

        const waveResults = await Promise.all(wavePromises);
        results.push(...waveResults);
        
        // Wait a small delay between waves to avoid massive 429 bursts on free tiers
        if (i + waveSize < totalAgents.length) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    const duration = Date.now() - startTime;
    const successful = results.filter(r => r.status === 'success').length;
    
    const finalReport = {
        test_type: "REAL_LLM_SWARM",
        total_agents: totalAgents.length,
        successful_agents: successful,
        failed_agents: totalAgents.length - successful,
        total_duration_ms: duration,
        agent_responses: results
    };

    if (!fs.existsSync('reports')) fs.mkdirSync('reports');
    fs.writeFileSync('reports/agri_real_stress_test.json', JSON.stringify(finalReport, null, 2));
    
    console.log(`✅ Real Swarm Test Completed in ${duration}ms!`);
    console.log(`📊 Success Rate: ${successful}/${totalAgents.length}`);
}

runRealSwarm().catch(e => console.error("Swarm failure:", e));
