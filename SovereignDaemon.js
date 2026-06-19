const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const SHADOW_LEDGER_PATH = path.join(__dirname, '.agents', 'shadow_ledger.jsonl');
const PORT = 9998;

console.error("==================================================");
console.error("👁️ SOVEREIGN DAEMON (INFINITE LOOP) INITIATED");
console.error("==================================================");
console.error(`[Daemon] Listening for Nexus Brain Telemetry on port ${PORT}...`);

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', function connection(ws) {
  console.error('[Daemon] Sovereign VSCode Client connected. Infinite Loop Active.');
  
  ws.on('message', function incoming(message) {
    try {
      const payload = JSON.parse(message);
      
      if (payload.type === 'SCROLL_SYNC') {
        console.error(`[Cognitive Sync] User is reading: ${payload.file}`);
        // Log to shadow ledger
        logToLedger('COGNITIVE_SYNC', `User reading ${payload.file} at ranges ${JSON.stringify(payload.ranges)}`);
      } 
      else if (payload.type === 'GHOST_TEXT_REQUEST') {
        console.error(`[Prediction] Ghost Text requested for line ${payload.line} in ${payload.file}`);
      }
      else if (payload.type === 'CONTEXT_MENU') {
        console.error(`[Action] Swarm invoked via GUI context menu: ${payload.action}`);
        if (payload.action === 'optimize') {
          console.error(`[Swarm] Parallel optimization started...`);
          setTimeout(() => console.error(`[Swarm] Optimization completed silently.`), 1500);
        }
      }
    } catch(e) {
      console.error('[Daemon] Error processing telemetry', e);
    }
  });
});

function logToLedger(action, details) {
  if (!fs.existsSync(path.dirname(SHADOW_LEDGER_PATH))) {
    fs.mkdirSync(path.dirname(SHADOW_LEDGER_PATH), { recursive: true });
  }
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    agent: "ShadowSentinel",
    action: action,
    details: details
  }) + '\n';
  
  fs.appendFileSync(SHADOW_LEDGER_PATH, entry);
}
