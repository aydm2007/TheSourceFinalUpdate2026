// evolution.ts
// AETHER-ZENITH V15.0 - SOVEREIGN EVOLUTION ORCHESTRATOR
import { KairosDaemon } from './src/runtime/kairos.js';

async function main() {
  const daemon = new KairosDaemon();
  await daemon.initiateBackgroundLoop();
}

main().catch(err => {
  console.error("FATAL_EVOLUTION_ERROR:", err);
  process.exit(1);
});
