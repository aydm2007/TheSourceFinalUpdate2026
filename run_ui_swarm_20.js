require('dotenv').config();
const { RelayBridge } = require('./relay_bridge.js');
const fs = require('fs');
const path = require('path');
const { KAIROS_TOOLS } = require('./nexus_bridge');

async function runUISwarm() {
    console.log("🚀 [AgriAsset] Starting 20-Agent UI/UX Swarm (Waves)...");
    const relay = new RelayBridge(process.env.AETHER_RELAY_KEY_ALPHA);
    
    // Convert KAIROS_TOOLS to standard format
    const tools = KAIROS_TOOLS.map(t => ({
      type: 'function',
      function: { name: t.function.name, description: t.function.description, parameters: t.function.parameters }
    }));

    const roles = [
        "UX Hypnotist (Glassmorphism & Micro-animations)",
        "React Component Architect",
        "Tailwind CSS Layout Master",
        "Accessibility (A11y) Auditor",
        "Color Theory & Theme Specialist"
    ];

    let agents = [];
    for(let i = 0; i < 20; i++) {
        agents.push({
            id: i + 1,
            role: roles[i % roles.length],
            task: `You are Agent ${i+1}, specialized as: ${roles[i % roles.length]}. 
Your mission: Analyze the Sovereign Chat UI in 'chat-frontend/src/App.tsx'. 
Using your MCP tools, read the file and design a small, self-contained UI enhancement.
CRITICAL RULE: DO NOT overwrite 'App.tsx' directly to avoid race conditions. 
Instead, use 'FileWrite' to create a new component file in 'chat-frontend/src/components/Agent${i+1}_${roles[i % roles.length].replace(/[^a-zA-Z]/g, '')}.tsx' containing your stunning UI component (e.g., a glowing button, a sleek sidebar, a message bubble).
Write the React component using Tailwind classes. Return a short message when done.`
        });
    }

    const waveSize = 5;
    const startTime = Date.now();
    const results = [];

    // Ensure components directory exists
    const compDir = path.join(process.cwd(), 'chat-frontend/src/components');
    if (!fs.existsSync(compDir)) {
        fs.mkdirSync(compDir, { recursive: true });
    }

    for (let i = 0; i < agents.length; i += waveSize) {
        const wave = agents.slice(i, i + waveSize);
        console.log(`\n🌊 Launching Wave ${Math.floor(i/waveSize) + 1} (${wave.length} Agents in Parallel)...`);
        
        const wavePromises = wave.map(async (agent) => {
            const agentStart = Date.now();
            try {
                console.log(`  [Agent ${agent.id} | ${agent.role}] 🟢 Started`);
                
                // For safety and speed in this demo, we use a capable model that respects instructions
                const response = await relay.createPulse({
                    model: process.env.AETHER_EXECUTOR_MODEL || "openai/gpt-4o-mini",
                    messages: [
                        { role: "system", content: "You are a Sovereign Swarm UI Agent. You have access to all MCP tools. Use them to complete your task." },
                        { role: "user", content: agent.task }
                    ],
                    tools: tools,
                    temperature: 0.8,
                    max_tokens: 1500
                });

                // Simulate tool execution if the model requests it
                const contentArr = response.content || [];
                const toolCalls = contentArr.filter(c => c.type === 'tool_use');
                let outcome = "No tools used";
                
                if (toolCalls.length > 0) {
                    const { executeTool } = require('./nexus_bridge');
                    for (const tc of toolCalls) {
                        try {
                            await executeTool(tc.name, tc.input || tc.args || {}, { projectPath: process.cwd() });
                            outcome = `Successfully used ${tc.name}`;
                        } catch (err) {
                            outcome = `Tool ${tc.name} failed: ${err.message}`;
                        }
                    }
                }

                console.log(`  [Agent ${agent.id}] 🏁 Finished. Outcome: ${outcome}`);
                return { agent: agent.id, role: agent.role, status: 'success', time: Date.now() - agentStart };
            } catch (e) {
                console.error(`  [Agent ${agent.id}] ❌ Failed:`, e.message);
                return { agent: agent.id, role: agent.role, status: 'failed', time: Date.now() - agentStart };
            }
        });

        const waveResults = await Promise.all(wavePromises);
        results.push(...waveResults);
        
        console.log(`✅ Wave ${Math.floor(i/waveSize) + 1} complete. Waiting 3 seconds...`);
        if (i + waveSize < agents.length) {
            await new Promise(r => setTimeout(r, 3000));
        }
    }

    const duration = Date.now() - startTime;
    console.log(`\n🎉 All 20 UI/UX Swarm Agents Completed in ${duration}ms!`);
    console.log(`📁 Component proposals written to 'chat-frontend/src/components/'`);
}

runUISwarm().catch(e => console.error("Swarm failure:", e));
