// audit_bridge.js — فحص جنائي لـ nexus_bridge.js و cli.js
const fs = require('fs');
const path = require('path');

const bridge = fs.readFileSync('nexus_bridge.js', 'utf8');
const cli = fs.readFileSync('package/cli.js', 'utf8');

// عد الأدوات
const toolNames = [...new Set((bridge.match(/name:\s*["'](\w+)["']/g) || [])
  .map(x => x.replace(/name:\s*["']/, '').replace(/["']$/, '')))];
console.error('\n=== BRIDGE TOOLS ===');
console.error('Total unique tool names:', toolNames.length);

const swarmTools = toolNames.filter(t => /swarm|broadcast|telepat|consensus|reloc/i.test(t));
const vecTools = toolNames.filter(t => /vector|embed|semantic/i.test(t));
const memTools = toolNames.filter(t => /memory|ledger|cache|persist/i.test(t));
const ipcTools = toolNames.filter(t => /ipc|bridge|channel|process/i.test(t));
console.error('Swarm tools:', swarmTools.length, swarmTools.join(', '));
console.error('Vector tools:', vecTools.length, vecTools.join(', '));
console.error('Memory tools:', memTools.length, memTools.join(', '));
console.error('IPC tools:', ipcTools.length, ipcTools.join(', '));

// فحص cli.js للوظائف الحقيقية
console.error('\n=== CLI.JS REAL IMPLEMENTATIONS ===');
const features = {
  'VectorDB (real)': cli.includes('cosine') || cli.includes('dot product') || cli.includes('Float32Array'),
  'SQLite/Persist': cli.includes('better-sqlite3') || cli.includes('sqlite3') || cli.includes('.db'),
  'IPC Channel': cli.includes('ipcRenderer') || cli.includes('ipcMain') || cli.includes('MessageChannel'),
  'Swarm Broadcast': cli.includes('swarm:') || cli.includes('broadcast') && cli.includes('agent'),
  'Consensus Voting': cli.includes('vote') && cli.includes('consensus'),
  'Persistent Cache': cli.includes('localStorage') || cli.includes('indexedDB') || cli.includes('cache.set'),
  'WebSocket IPC': cli.includes('WebSocket') || cli.includes('ws.send'),
  'Worker Threads': cli.includes('worker_threads') || cli.includes('new Worker('),
};
Object.entries(features).forEach(([k, v]) => {
  console.error(`  ${v ? '✅' : '❌'} ${k}`);
});

// الثغرات الحقيقية في التقييم
console.error('\n=== SCORE VALIDITY VERDICT ===');
const realGaps = Object.values(features).filter(v => !v).length;
console.error('Missing real implementations:', realGaps, '/', Object.keys(features).length);
const actualScore = Math.round(((Object.keys(features).length - realGaps) / Object.keys(features).length) * 100);
console.error('Actual implementation score (Gemini Pro):', actualScore + '/100');
console.error('Claimed score in report (Gemini Pro): 89.4/100');
console.error('Gap (overstatement):', Math.max(0, 89 - actualScore), 'points');
