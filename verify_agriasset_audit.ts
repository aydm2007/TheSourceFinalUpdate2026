import { SovereignForensicAuditTool } from './src/tools/nexus-tools/SovereignForensicAuditTool.js';
import { globalSemanticLock } from './src/core/swarm/SemanticLockManager.js';
import { globalSourceMapSharder } from './src/core/swarm/SourceMapSharder.js';

async function testAgriAssetSweep() {
  console.log('=== Initiating Massive Parallel Sweep on AgriAsset ===\n');

  // 1. Lock a critical AgriAsset file to simulate safe concurrency
  const resource = 'backend/smart_agri/core/services/variance_engine.py';
  console.log(`[Swarm] Agent-1 attempting to acquire Semantic Lock on: ${resource}`);
  const lockAcquired = globalSemanticLock.acquireLock(resource, 'agent-1');
  console.log(`[Swarm] Lock Status: ${lockAcquired ? 'SECURED 🔒' : 'FAILED'}`);

  // 2. Execute the Forensic Tool on AgriAsset
  console.log('\n[Swarm] Executing Sovereign Forensic Audit Tool on AgriAsset YECO...');
  const result = await SovereignForensicAuditTool.execute({
    projectPath: 'C:\\tools\\workspace\\AgriAsset_YECO_Enterprise_Final2',
    projectName: 'AgriAsset YECO Enterprise'
  });
  
  console.log('\n=== Tool Output ===');
  console.log(result.content[0].text);
}

testAgriAssetSweep().catch(console.error);
