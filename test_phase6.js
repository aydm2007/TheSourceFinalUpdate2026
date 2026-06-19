const engine = require('./core/security/sovereign_engine.js');
(async () => {
  console.error('--- Phase 6 Test ---');
  const r1 = await engine.realHardwareAstMap('./package/cli.js.map');
  console.error(r1);
  const r2 = await engine.realTelepathicHiveMind('./package/cli.js.map');
  console.error(r2);
  const r3 = await engine.realEmpatheticModulator('./.agents/memory/shadow_ledger.jsonl');
  console.error(r3);
  const r4 = await engine.runParallelTasks([{name:'Render UI', fn: async()=>'UI Done'}, {name:'DB Query', fn: async()=>'DB Done'}]);
  console.error(r4);
  const r5 = await engine.realVisualDomMap('./package/cli.js.map');
  console.error(r5);
})();
