const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const AGRI_WORKSPACE = 'C:\\tools\\workspace\\AgriAsset_YECO_Enterprise_Final2\\backend';
const DATA_DIR = path.join(__dirname, 'data');

const CHAOS_SCRIPT = `
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_agri.settings')
django.setup()
from django.conf import settings
settings.ALLOWED_HOSTS = ['*']

import uuid
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from smart_agri.core.models.sardoud_ops import MachineryDailyOperation

print("======================================")
print(" 🌪️ INITIATING CHAOS ENGINE STRIKE")
print("======================================")

User = get_user_model()
user = User.objects.first()
if user:
    user.is_superuser = True
    user.save()

client = APIClient()
client.force_authenticate(user=user)

# Generate a deterministic unique key for the attack
target_idempotency_key = str(uuid.uuid4())
envelope_id = str(uuid.uuid4())

from smart_agri.core.models import Asset, Task, LandParcel, Season, Crop
real_asset = Asset.objects.filter(category='MACHINERY').first() or Asset.objects.first()
real_task = Task.objects.first()
real_parcel = LandParcel.objects.first()
real_season = Season.objects.first()
real_crop = Crop.objects.first()

payload = {
    "operation_type": "machinery",
    "farm_id": str(real_parcel.farm_id) if real_parcel else "1",
    "idempotency_key": target_idempotency_key,
    "device_id": "chaos-device-001",
    "submit": True,
    "payload": {
        "asset_id": str(real_asset.pk) if real_asset else "1",
        "task_id": str(real_task.pk) if real_task else "1",
        "land_parcel_id": str(real_parcel.pk) if real_parcel else "1",
        "season_id": str(real_season.pk) if real_season else "1",
        "crop_id": str(real_crop.pk) if real_crop else "1",
        "start_time": "2026-06-03T08:00:00Z",
        "end_time": "2026-06-03T12:00:00Z",
        "morning_hours": "4.00",
        "afternoon_hours": "0.00",
        "diesel_liters": "40.00",
        "operation_date": "2026-06-03"
    }
}

# STRIKE 1: Client sends the envelope but simulates a lost connection
print(f"\\n[!] Executing STRIKE 1 (Original Payload): Envelope {envelope_id}")
response1 = client.post('/api/v1/sync/envelope/', payload, format='json', HTTP_X_IDEMPOTENCY_KEY=envelope_id, HTTP_X_REQUEST_ID=str(uuid.uuid4()), HTTP_X_API_KEY='chaos')
print(f"[>] HTTP Response: {response1.status_code}")
if response1.status_code == 400:
    print(f"[>] Error Details: {response1.content}")

# STRIKE 2: Client thinks the server didn't get it, retries immediately
print(f"\\n[!] Executing STRIKE 2 (Duplicate Retry Attack)")
response2 = client.post('/api/v1/sync/envelope/', payload, format='json', HTTP_X_IDEMPOTENCY_KEY=envelope_id, HTTP_X_REQUEST_ID=str(uuid.uuid4()), HTTP_X_API_KEY='chaos')
print(f"[>] HTTP Response: {response2.status_code}")

# FORENSIC VALIDATION
print("\\n======================================")
print(" 🔍 FORENSIC VALIDATION")
print("======================================")
ops_count = MachineryDailyOperation.objects.filter(idempotency_key=target_idempotency_key).count()
print(f"Operations stored in DB with this key: {ops_count}")

if ops_count == 1:
    print("\\n🛡️  STATUS: SECURE! Idempotency Wall held perfectly. No double accounting.")
    import sys; sys.exit(0)
elif ops_count > 1:
    print("\\n🚨  STATUS: BREACHED! Duplicate operations found!")
    import sys; sys.exit(1)
else:
    print("\\n⚠️  STATUS: ERROR! Payload rejected completely.")
    import sys; sys.exit(2)
`;

function runChaos() {
    return new Promise((resolve, reject) => {
        console.error('[ChaosEngine] Initializing Chaos Sequence...');
        const pyScriptPath = path.join(AGRI_WORKSPACE, 'run_chaos_temp.py');
        fs.writeFileSync(pyScriptPath, CHAOS_SCRIPT, 'utf-8');
        
        const processEnv = { ...process.env, PYTHONIOENCODING: 'utf-8' };
        const cmd = `cmd /c ".venv\\Scripts\\activate && python run_chaos_temp.py"`;
        
        const child = exec(cmd, { cwd: AGRI_WORKSPACE, env: processEnv });
        
        let output = '';
        child.stdout.on('data', (data) => {
            process.stdout.write(data);
            output += data;
        });
        
        child.stderr.on('data', (data) => {
            process.stderr.write(data);
            output += data;
        });
        
        child.on('close', (code) => {
            if (code === 0) resolve(output);
            else reject(new Error('Chaos test failed or encountered a breach! Exit code: ' + code));
        });
    });
}

async function main() {
    try {
        await runChaos();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

main();
