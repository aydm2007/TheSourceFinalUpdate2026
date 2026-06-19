const { SwarmPipelineOrchestrator } = require('./core/bridge/handlers/swarm_handlers.js');

async function test() {
  const result = await SwarmPipelineOrchestrator({
    pipeline_name: 'test_parallel',
    stages: [
      'node -e "setTimeout(() => console.error(1), 1000)"',
      'node -e "setTimeout(() => console.error(2), 1000)"',
      'node -e "setTimeout(() => console.error(3), 1000)"'
    ]
  }, { __dirname: process.cwd() });
  console.error(result);
}
test().catch(console.error);
