const path = require('path');
const { SECURITY_TOOLS } = require('./core/security/tools_integrator.js');

async function runPhase4() {
    console.error('🚀 Initiating Phase 4.1: Vector AST Mapping');
    try {
        const mapPath = path.resolve(__dirname, 'package', 'cli.js.map');
        const astIdx = await SECURITY_TOOLS.VectorAstMapper.handler({ map_path: mapPath });
        console.error('✅ VectorAstMapper Completed:', astIdx);

        console.error('🚀 Initiating Phase 4.2: One-Time Swarm Agent Pre-Training');
        // Let's test the SwarmPipelineOrchestrator for the training phase
        const trainingPipeline = await SECURITY_TOOLS.ParallelSwarmCoordinator.handler({
            task: 'Alpha_Swarm_PreTraining_Phase4',
            agents: ['admin-governor', 'agri-specialist', 'finance-auditor']
        });
        console.error('✅ ParallelSwarmCoordinator Completed:', trainingPipeline);

    } catch (e) {
        console.error('❌ Phase 4 Failed:', e);
    }
}

runPhase4();
