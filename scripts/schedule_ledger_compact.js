// schedule_ledger_compact.js
// Uses node-cron to run ledger_compact.js daily at midnight.
// Add "node-cron" to dependencies if not present.

const cron = require('node-cron');
const { exec } = require('child_process');

// Schedule: every day at 00:00
cron.schedule('0 0 * * *', () => {
  console.log('[Scheduler] Running ledger compact...');
  exec('npm run ledger:compact', (error, stdout, stderr) => {
    if (error) {
      console.error(`[Scheduler] Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`[Scheduler] Stderr: ${stderr}`);
    }
    console.log(`[Scheduler] Output: ${stdout}`);
  });
});

console.log('Ledger compact scheduler started.');
