const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const AGRI_WORKSPACE = 'C:\\tools\\workspace\\AgriAsset_YECO_Enterprise_Final2\\backend';
const DATA_DIR = path.join(__dirname, 'data');

const FORENSIC_SCRIPT = `from smart_agri.core.models.activity import Activity; from smart_agri.core.models.sardoud_ops import MachineryDailyOperation; from smart_agri.core.models.finance_ops import TrialBalanceLine, TrialBalance; import json; data = { 'total_activities': Activity.objects.count(), 'total_machinery_ops': MachineryDailyOperation.objects.count(), 'total_tb_lines': TrialBalanceLine.objects.count(), 'locked_tbs': TrialBalance.objects.filter(is_locked=True).count() if hasattr(TrialBalance, 'is_locked') else 0, 'orphaned_lines': TrialBalanceLine.objects.filter(trial_balance__isnull=True).count() }; print(json.dumps(data))`;

function runForensics() {
    return new Promise((resolve, reject) => {
        console.error('[Forensics] Executing DB Forensics on AgriAsset...');
        const pyScriptPath = path.join(AGRI_WORKSPACE, 'run_forensics_temp.py');
        fs.writeFileSync(pyScriptPath, `
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_agri.settings')
django.setup()

${FORENSIC_SCRIPT}
`, 'utf-8');
        
        const cmd = `cmd /c ".venv\\Scripts\\activate && python run_forensics_temp.py"`;
        const processEnv = { ...process.env, PYTHONIOENCODING: 'utf-8' };
        
        exec(cmd, { cwd: AGRI_WORKSPACE, env: processEnv }, (error, stdout, stderr) => {
            if (error && !stdout) {
                console.error(`[Forensics Error] ${stderr}`);
                reject(error);
                return;
            }
            try {
                // Find JSON output in stdout
                const match = stdout.match(/\{.*\}/);
                if (match) {
                    resolve(JSON.parse(match[0]));
                } else {
                    resolve({ raw: stdout });
                }
            } catch (e) {
                resolve({ raw: stdout, error: e.message });
            }
        });
    });
}

async function main() {
    console.error('=============================================');
    console.error('  AgriAsset DB Forensics (Nexus Swarm)       ');
    console.error('=============================================');

    const results = await runForensics();
    console.error('Forensic Results:', results);

    const reportPath = path.join(DATA_DIR, 'db_forensics_latest.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
    
    // Generate Markdown report
    const mdReport = `
# 🔍 تقرير التحليل الجنائي (DB Forensics) - AgriAsset V100

تم فحص سلامة البيانات المحاسبية والميدانية للتحقق من خلوها من أي تسرب للبيانات أو سجلات يتيمة.

## 📊 الإحصائيات الذرية
- إجمالي الأنشطة الميدانية: **${results.total_activities}**
- إجمالي عمليات الآليات: **${results.total_machinery_ops}**
- إجمالي خطوط دفتر الأستاذ (Trial Balance): **${results.total_tb_lines}**
- دفاتر الأستاذ المغلقة: **${results.locked_tbs}**

## 🛡️ النزاهة المالية
- السجلات المحاسبية اليتيمة (بدون ارتباط): **${results.orphaned_lines}**

> **النتيجة:** النظام ${results.orphaned_lines === 0 ? 'سليم تماماً وخالي من التناقضات 🟢' : 'يحتوي على سجلات يتيمة تحتاج لتدخل 🔴'}
`;

    const mdPath = path.join(DATA_DIR, 'db_forensics_report.md');
    fs.writeFileSync(mdPath, mdReport, 'utf-8');

    console.error(`\n✅ Forensics complete.`);
    console.error(`📊 JSON Telemetry: ${reportPath}`);
    console.error(`📄 Markdown Report: ${mdPath}`);
}

main().catch(err => console.error(err));
