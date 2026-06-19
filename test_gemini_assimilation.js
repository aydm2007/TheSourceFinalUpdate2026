const { DataAssimilator } = require('./core/swarm/DataAssimilator.js');
const { AbstractPhilosopher } = require('./core/agents/AbstractPhilosopher.js');

async function runTest() {
    console.error("Starting Sovereign Evolution Test...");
    
    // 1. Test Data Assimilator
    const assimilator = new DataAssimilator();
    console.error("\n[1] Assimilating Workspace...");
    const assimilationResult = await assimilator.assimilateWorkspace(['**/*.js', '**/*.md']);
    
    console.error(`Assimilation Success: ${assimilationResult.success}`);
    console.error(`Estimated Tokens: ${assimilationResult.estimated_tokens}`);
    console.error(`Context Length: ${assimilationResult.context_length} chars`);
    
    // 2. Test Abstract Philosopher
    const philosopher = new AbstractPhilosopher();
    console.error("\n[2] Testing Abstract Philosopher...");
    const problem = "Design a highly resilient, cross-platform architecture that scales to 1M requests per second.";
    const ideationResult = await philosopher.ideateArchitecture(problem, assimilationResult.context);
    
    console.error(`Ideation Success: ${ideationResult.success}`);
    console.error(`Model Used: ${ideationResult.model}`);
    console.error(`\nResult:\n${ideationResult.ideation_result}`);
}

runTest().catch(console.error);
