// slack_notifier.js – يرسل إشعارات فورية عند أحداث نائب
const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(process.cwd(), 'logs', 'deputy.log');
const NOTIFY_PATH = path.join(process.cwd(), 'logs', 'slack_notify.txt');
let lastSize = 0;

function appendNotify(message){
  const line = new Date().toISOString() + ' | ' + message + '\n';
  fs.appendFileSync(NOTIFY_PATH, line);
}

function checkLog(){
  if (!fs.existsSync(LOG_PATH)) return;
  const stats = fs.statSync(LOG_PATH);
  if (stats.size <= lastSize) { return; }
  const data = fs.readFileSync(LOG_PATH, { encoding: 'utf8', start: lastSize, end: stats.size });
  lastSize = stats.size;
  if (data.includes('Generating Visual Audit Report')) {
    appendNotify('✅ Deputy completed Visual Audit Report');
  }
  if (data.includes('ShadowLedgerAudit failed')) {
    appendNotify('⚠️ Deputy encountered ShadowLedgerAudit error');
  }
}

setInterval(checkLog, 30_000);
