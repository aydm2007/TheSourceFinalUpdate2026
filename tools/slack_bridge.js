// slack_bridge.js – يرسل إشعارات Slack مع تفاصيل التقارير
// يقرأ سجلات نائب التنسيق وتقرير VisualAudit، ثم يستخدم أداة MCP SendMessage لإرسالها إلى قناة Slack
const fs = require('fs');
const path = require('path');

// مسارات السجلات
const DEPUTY_LOG = path.join(process.cwd(), 'logs', 'deputy.log');
const VISUAL_LOG = path.join(process.cwd(), 'logs', 'visual_report.log');
let deputyPos = 0;
let visualPos = 0;

// Helper لتجميع رسالة وإرسالها عبر MCP
function sendSlack(message) {
  try {
    // أداة MCP SendMessage تُرسل إلى القناة المحددة (مثلاً chat-dev)
    const cmd = `mcp send-message --recipient slack --channel chat-dev --message "${message.replace(/"/g, '\\"')}"`;
    require('child_process').execSync(cmd, { stdio: 'ignore' });
  } catch (e) {
    console.error('Failed to send Slack message:', e.message);
  }
}

function checkDeputyLog() {
  if (!fs.existsSync(DEPUTY_LOG)) return;
  const stats = fs.statSync(DEPUTY_LOG);
  if (stats.size <= deputyPos) return;
  const data = fs.readFileSync(DEPUTY_LOG, { encoding: 'utf8', start: deputyPos, end: stats.size });
  deputyPos = stats.size;
  if (data.includes('Audit scheduled')) {
    sendSlack('🟢 Deputy: Audit scheduled – ShadowLedgerAudit & VisualAuditReport will run shortly.');
  }
  if (data.includes('ShadowLedgerAudit failed')) {
    sendSlack('⚠️ Deputy: ShadowLedgerAudit encountered an error. Check logs for details.');
  }
  if (data.includes('Visual Audit Report via MCP')) {
    // رسالة بسيطة لتأكيد بدء التقرير
    sendSlack('🟢 Deputy: VisualAuditReport execution started.');
  }
}

function checkVisualLog() {
  if (!fs.existsSync(VISUAL_LOG)) return;
  const stats = fs.statSync(VISUAL_LOG);
  if (stats.size <= visualPos) return;
  const data = fs.readFileSync(VISUAL_LOG, { encoding: 'utf8', start: visualPos, end: stats.size });
  visualPos = stats.size;
  // عندما يكتمل التقرير عادةً يكتب سطر يحتوي على "Report generated" أو ما شابه
  if (data.toLowerCase().includes('report generated')) {
    sendSlack('✅ VisualAuditReport: Report generated successfully. Check the reports directory for "Deputy-Run".');
  }
  if (data.toLowerCase().includes('error')) {
    sendSlack('⚠️ VisualAuditReport encountered an error. Review visual_report.log for details.');
  }
}

// فحص السجلات كل 30 ثانية
setInterval(() => {
  checkDeputyLog();
  checkVisualLog();
}, 30_000);
