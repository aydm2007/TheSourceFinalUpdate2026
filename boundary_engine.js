const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const AGRI_WORKSPACE = 'C:\\tools\\workspace\\AgriAsset_YECO_Enterprise_Final2\\backend';

const BOUNDARY_SCRIPT = `
import os
import django
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_agri.settings')
django.setup()

from django.conf import settings
settings.ALLOWED_HOSTS = ['*']

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework.test import APIClient
from smart_agri.accounts.models import FarmMembership
from smart_agri.core.models import Farm

print("==================================================")
print(" 🛡️ INITIATING BOUNDARY & PENETRATION ENGINE")
print("==================================================")

User = get_user_model()
client = APIClient()

# 1. Setup a HACKER user (Field Role Only)
hacker_username = "hacker_simple_user"
user, created = User.objects.get_or_create(username=hacker_username)
user.is_superuser = False
user.save()

# Assign to Field Simple Role ONLY
simple_group, _ = Group.objects.get_or_create(name="مشرف ميداني")
user.groups.clear()
user.groups.add(simple_group)

# Assign to a Farm
target_farm = Farm.objects.first()
if not target_farm:
    print("No farms found.")
    import sys; sys.exit(1)

FarmMembership.objects.get_or_create(user=user, farm=target_farm, role="مشرف ميداني")

# Authenticate the hacker
client.force_authenticate(user=user)

print(f"\\n[HACKER IDENTITY] Username: {user.username} | Superuser: {user.is_superuser}")
print(f"[HACKER ROLE] Assigned to '{target_farm.name}' as 'مشرف ميداني'")

print("\\n--------------------------------------------------")
print(" ⚔️ ATTACK 1: PRIVILEGE ESCALATION (STRICT BYPASS)")
print("--------------------------------------------------")
# A field user tries to access a STRICT mode endpoint (Monthly Clearance)
print("[!] Attempting to generate a financial Monthly Clearance (Requires Chief Accountant)...")
clearance_payload = {
    "farm_id": target_farm.pk,
    "year": 2026,
    "month": 5
}
resp_escalation = client.post(
    '/api/v1/clearance/generate/', 
    clearance_payload, 
    format='json',
    HTTP_X_REQUEST_ID=str(uuid.uuid4()),
    HTTP_X_API_KEY='chaos',
    HTTP_X_IDEMPOTENCY_KEY=str(uuid.uuid4())
)
print(f"[>] HTTP Response: {resp_escalation.status_code}")

if resp_escalation.status_code in [403, 401]:
    print("✅ SUCCESS: The RBAC Wall held! Hacker was denied access.")
elif resp_escalation.status_code == 400:
    print(f"❌ BREACH (Or Data Error): Status 400. Details: {resp_escalation.content}")
    import sys; sys.exit(1)
else:
    print(f"❌ BREACH: System allowed unauthorized access! Status: {resp_escalation.status_code}")
    import sys; sys.exit(1)


print("\\n--------------------------------------------------")
print(" ⚔️ ATTACK 2: CROSS-TENANT HIJACKING")
print("--------------------------------------------------")
# Hacker creates a fake farm to try and post data to it
fake_farm, _ = Farm.objects.get_or_create(name="Target Enterprise Farm", slug="hack_01")
# Ensure the hacker does NOT have membership in fake_farm
FarmMembership.objects.filter(user=user, farm=fake_farm).delete()

print(f"[!] Attempting to submit SIMPLE Sync Envelope to unauthorized farm '{fake_farm.name}'...")
sync_payload = {
    "operation_type": "machinery",
    "farm_id": fake_farm.pk,
    "idempotency_key": str(uuid.uuid4()),
    "device_id": "hacker-device-001",
    "submit": True,
    "payload": {
        "asset_id": "1",
        "task_id": "1",
        "operation_date": "2026-06-03"
    }
}
resp_tenant = client.post(
    '/api/v1/sync/envelope/', 
    sync_payload, 
    format='json',
    HTTP_X_REQUEST_ID=str(uuid.uuid4()),
    HTTP_X_API_KEY='chaos',
    HTTP_X_IDEMPOTENCY_KEY=str(uuid.uuid4())
)

print(f"[>] HTTP Response: {resp_tenant.status_code}")

if resp_tenant.status_code in [403, 401]:
    print("✅ SUCCESS: The Cross-Tenant Boundary Wall held! Hacker was denied access to another farm.")
else:
    print(f"❌ BREACH: Cross-Tenant Violation! System allowed data insertion for unauthorized farm! Status: {resp_tenant.status_code}")
    if resp_tenant.status_code == 400:
        # If it's a 400 validation error, it means it bypassed permissions and hit the serializer!
        print(f"   [!] Detailed Error: {resp_tenant.content}")
        print("   [!] This is a BREACH because RBAC should have stopped it before Validation (403 expected).")
    import sys; sys.exit(1)

print("\\n==================================================")
print(" 🛡️ FINAL FORENSIC STATUS: 100% SECURE & SOVEREIGN")
print("==================================================")
`;

function runBoundaryTest() {
    return new Promise((resolve, reject) => {
        console.error('[BoundaryEngine] Initializing Penetration Sequence...');
        const pyScriptPath = path.join(AGRI_WORKSPACE, 'run_boundary_temp.py');
        fs.writeFileSync(pyScriptPath, BOUNDARY_SCRIPT, 'utf-8');
        
        const processEnv = { ...process.env, PYTHONIOENCODING: 'utf-8' };
        const cmd = `cmd /c ".venv\\Scripts\\activate && python run_boundary_temp.py"`;
        
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
            else reject(new Error('Penetration test failed or encountered a breach! Exit code: ' + code));
        });
    });
}

async function main() {
    try {
        await runBoundaryTest();
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

main();
