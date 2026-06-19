const { SovereignKernel } = require('../package/SovereignKernel.js');
const fs = require('fs');
const path = require('path');

async function runSwarmSimulation() {
  console.log("🚀 Initializing SovereignKernel for Swarm Simulation...");
  const kernel = new SovereignKernel(__dirname);
  
  await kernel.boot();
  console.log("✅ Kernel booted successfully.");

  console.log("\n📡 Triggering AGRI_UPDATE event (simulating agri-specialist)...");
  kernel.swarmBus.emit('AGRI_UPDATE', { 
    asset: 'Wheat_Field_A', 
    yield_prediction: '+15%', 
    weather: 'Optimal' 
  });

  console.log("\n📡 Triggering FINANCE_EVENT event (simulating finance-auditor)...");
  kernel.swarmBus.emit('FINANCE_EVENT', { 
    transactionId: 'TX_99421', 
    status: 'CLEARED', 
    fraud_risk: 'LOW' 
  });

  // Give memory some time to write async files
  setTimeout(() => {
    console.log("\n✅ Swarm Simulation completed successfully.");
    process.exit(0);
  }, 1000);
}

runSwarmSimulation().catch(err => {
  console.error("❌ Simulation failed:", err);
  process.exit(1);
});
