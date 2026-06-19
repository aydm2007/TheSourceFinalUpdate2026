const SelfSustainingProtocol = require('./src/core/self-sustaining.js');

async function sealLoop() {
  const protocol = new SelfSustainingProtocol(process.cwd());
  console.error("🚀 Initiating Sovereign Cycle Sealing...");
  const result = await protocol.distillSuccessfulOperation(
    "ApexArchitect",
    "SelfHealingInfrastructureDeployment",
    "Physical Integration of Native Repair and Evolution Modules",
    120
  );
  console.error("Final Result:", result);
}

sealLoop();
