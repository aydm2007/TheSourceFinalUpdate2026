const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const AGRI_WORKSPACE = 'C:\\tools\\workspace\\AgriAsset_YECO_Enterprise_Final2\\backend';
const VAULT_DIR = path.join(__dirname, 'vault');

if (!fs.existsSync(VAULT_DIR)) {
    fs.mkdirSync(VAULT_DIR);
}

const VAULT_SCRIPT = `
import os
import json
import hashlib
from datetime import datetime
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_agri.settings')
django.setup()

from smart_agri.core.models.finance_ops import TrialBalance, TrialBalanceLine, PeriodLock

print("==================================================")
print(" 🏛️ INITIATING SOVEREIGN VAULT ARCHIVER")
print("==================================================")

archive_data = {
    "generated_at": datetime.utcnow().isoformat(),
    "trial_balances": [],
    "period_locks": []
}

# 1. Fetch Trial Balances
tbs = TrialBalance.objects.all()
for tb in tbs:
    tb_data = {
        "id": str(tb.id),
        "farm_id": str(tb.farm_id),
        "farm_name": tb.farm.name if tb.farm else "UNKNOWN",
        "year": tb.year,
        "month": tb.month,
        "status": tb.status,
        "total_debit": str(tb.total_debit),
        "total_credit": str(tb.total_credit),
        "lines": []
    }
    
    lines = TrialBalanceLine.objects.filter(trial_balance=tb)
    for line in lines:
        tb_data["lines"].append({
            "account_code": line.account_code,
            "account_name": line.account_name,
            "opening_debit": str(line.opening_debit),
            "opening_credit": str(line.opening_credit),
            "period_debit": str(line.period_debit),
            "period_credit": str(line.period_credit),
            "closing_debit": str(line.closing_debit),
            "closing_credit": str(line.closing_credit)
        })
    archive_data["trial_balances"].append(tb_data)

# 2. Fetch Period Locks
locks = PeriodLock.objects.all()
for lock in locks:
    archive_data["period_locks"].append({
        "id": str(lock.id),
        "farm_id": str(lock.farm_id),
        "year": lock.year,
        "month": lock.month,
        "status": lock.status,
        "locked_at": lock.locked_at.isoformat() if lock.locked_at else None,
        "locked_by": lock.locked_by.username if lock.locked_by else "SYSTEM"
    })

# 3. Generate JSON and Seal
raw_json = json.dumps(archive_data, ensure_ascii=False, indent=4)
seal_hash = hashlib.sha256(raw_json.encode('utf-8')).hexdigest()

final_output = {
    "SOVEREIGN_SEAL": seal_hash,
    "ARCHIVE": archive_data
}

# 4. Write directly to file
timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H-%M-%S")
filename = os.path.join(r"${VAULT_DIR}", f"SovereignArchive_{timestamp}.json")
with open(filename, 'w', encoding='utf-8') as f:
    json.dump(final_output, f, ensure_ascii=False, indent=4)

print(f"\\n✅ SUCCESS: Financial Ledger Extracted and Sealed.")
print(f"🔒 SEAL HASH: {seal_hash}")
print(f"📦 SAVED TO: {filename}")
print("==================================================")
`;

function runVaultArchiver() {
    return new Promise((resolve, reject) => {
        console.error('[VaultArchiver] Initializing Extraction Sequence...');
        const pyScriptPath = path.join(AGRI_WORKSPACE, 'run_vault_temp.py');
        fs.writeFileSync(pyScriptPath, VAULT_SCRIPT, 'utf-8');
        
        const processEnv = { ...process.env, PYTHONIOENCODING: 'utf-8' };
        const cmd = `cmd /c ".venv\\Scripts\\activate && python run_vault_temp.py"`;
        
        const child = exec(cmd, { cwd: AGRI_WORKSPACE, env: processEnv });
        
        child.stdout.on('data', (data) => process.stdout.write(data));
        child.stderr.on('data', (data) => process.stderr.write(data));
        
        child.on('close', (code) => {
            if (code !== 0) reject(new Error('Vault archiver failed! Exit code: ' + code));
            else resolve();
        });
    });
}

async function main() {
    try {
        await runVaultArchiver();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

main();
