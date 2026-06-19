// SleepTool - Proactive Mode Wait
// Part of: Aether Engine V11.0 - Zero-Token Orchestration
// Usage: node sleep_tool.js <milliseconds>
// Bridge: TELEPATHY: sleep 5000

var ms = parseInt(process.argv[2], 10);

if (!ms || ms < 0 || ms > 300000) {
  console.error('Usage: node sleep_tool.js <milliseconds> (max 300000 = 5min)');
  console.error('Bridge format: TELEPATHY: sleep <ms>');
  process.exit(1);
}

var start = Date.now();
console.log(JSON.stringify({ status: 'sleeping', duration_ms: ms, started: new Date().toISOString() }));

setTimeout(function() {
  var elapsed = Date.now() - start;
  console.log(JSON.stringify({ 
    status: 'awake', 
    duration_ms: ms, 
    actual_ms: elapsed,
    completed: new Date().toISOString() 
  }));
  process.exit(0);
}, ms);
