// ledger_compact.js
// Utility script to keep the shadow_ledger.jsonl size bounded.
// Uses process.cwd() to locate the project root (sandbox does not expose __dirname).

const fs = require('fs');
const path = require('path');

// Resolve the ledger file relative to the project root.
const ledgerPath = path.resolve(process.cwd(), 'shadow_ledger.jsonl');
// Default maximum lines; can be overridden via CLI flag.
const DEFAULT_MAX_LINES = 500;

function getMaxLines() {
  const idx = process.argv.indexOf('--max_lines');
  if (idx !== -1 && process.argv[idx + 1]) {
    const val = parseInt(process.argv[idx + 1], 10);
    return Number.isNaN(val) ? DEFAULT_MAX_LINES : val;
  }
  return DEFAULT_MAX_LINES;
}

function compactLedger() {
  if (!fs.existsSync(ledgerPath)) {
    console.error('Shadow ledger not found at', ledgerPath);
    process.exit(1);
  }
  const data = fs.readFileSync(ledgerPath, 'utf-8').trim().split('\n');
  const maxLines = getMaxLines();
  if (data.length <= maxLines) {
    console.log('No compaction needed.');
    return;
  }
  const kept = data.slice(-maxLines);
  fs.writeFileSync(ledgerPath, kept.join('\n') + '\n');
  console.log(`Compacted ledger to ${maxLines} lines (kept ${kept.length} entries).`);
}

compactLedger();
