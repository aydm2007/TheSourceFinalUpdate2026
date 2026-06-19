---
name: security-audit
description: "فحص أمني شامل للمشروع — مفاتيح مكشوفة، ثغرات، وأفضل ممارسات الأمان"
user-invocable: true
when_to_use: "استخدم هذه المهارة لإجراء فحص أمني شامل: البحث عن مفاتيح مكشوفة، ثغرات حقن، وإعدادات أمان ضعيفة."
version: "52.0-AntiHallucination"
flash_compatible: true
allowed-tools:
  - Grep
  - FileRead
  - FileReadLines
  - Glob
  - Bash
  - TodoWrite
  - RealtimeScan
  - ForensicAudit
  - ShadowLedgerAudit
  - VectorSearch
---

# 🛡️ Security Audit — فحص أمني سيادي (V63.0-Singularity)

> هذه المهارة جزء من منظومة **AETHER-ZENITH V63.0-Singularity** وتعمل بنمط **Zero-Trust**.

<!-- FLASH_COMPATIBILITY_MODE -->

<flash_rules>
<rule id="1">استخدم `Grep` للبحث عن أنماط كلمات المرور (`password`, `secret`, `api_key`) في الكود المصدري.</rule>
<rule id="2">إذا وجدت مفتاحاً مكشوفاً، استخدم `FileEdit` لاستبداله بقراءة من متغيرات البيئة (مثال: `os.getenv('API_KEY')`).</rule>
<rule id="3">لا تقم بإظهار المفاتيح المكشوفة في مخرجاتك أو تقاريرك، استبدلها بـ `[REDACTED]`.</rule>
<rule id="4">لا تستخدم أدوات خارجية غير موثوقة للفحص الأمني.</rule>
</flash_rules>

<execution_pattern>
<step order="1">مسح الملفات النشطة بحثاً عن معلومات حساسة صلبة (Hardcoded).</step>
<step order="2">مسح قواعد البيانات (إن وجدت) للتأكد من تشفير كلمات المرور.</step>
<step order="3">تحليل ملفات البيئة `.env.example` لضمان عدم احتوائها على مفاتيح حقيقية.</step>
<step order="4">تطبيق تعديلات تصحيحية مباشرة على الكود المصدري.</step>
</execution_pattern>

## 🚀 بروتوكول التهيئة الأولية (Bootstrap Protocol)

لضمان عمل الفحص الأمني بكفاءة، يجب التأكد من توفر أدوات البحث أو تجهيز تقرير فارغ للنتائج:

```bash
# bootstrap_security_audit.sh
if [ ! -f "security_audit_report.md" ]; then
  echo "# 🔒 تقرير الفحص الأمني (Aether-Zenith)" > security_audit_report.md
  echo "✅ تم تهيئة ملف التقرير الأمني."
fi
```

## 🛡️ بروتوكول القفل القسري (Production Killswitch Protocol)

يُمنع تجاوز الصلاحيات في بيئة الإنتاج. عند الفحص، تأكد من:

1. وجود القيد الصلب: `if (process.env.NODE_ENV === 'production') return false;` في كافة دوال تجاوز الأمان.
2. تفعيل الحماية في `bypassPermissionsKillswitch.ts`.
3. غلق كافة الـ Debug modes والـ Trace logs الحساسة.

## 🧱 بروتوكول بوابة الحضانة (Sandboxing Gatekeeper Protocol - Level 6 Autonomy)

عند قيام `evolution-replicator` بتوليد وكيل جديد ذاتياً عبر الويب:

1. **العزل (Quarantine):** يُحفظ ملف الـ `SKILL.md` الجديد في مجلد افتراضي معزول.
2. **المسح الصارم (Rigorous Scan):** استخدم `ZeroTrustMerkleLedger` و `PredictiveImmunization` لفحص الكود المولد آلياً والتأكد من:
   - عدم وجود أدوات تدميرية غير مصرح بها (`Bash` مع `rm -rf` أو صلاحيات `sudo`).
   - توافقه مع دستور `master.md`.
3. **التصريح (Clearance):** فقط إذا حصل الوكيل على درجة `100/100` في الأمان، يتم إضافة أدواته إلى `bridge.json` وتوقيعه تشفيرياً وإضافته لـ `shadow_ledger.jsonl`.

## الفحص الأمني الشامل (نفّذ بالتوازي)

### ١. المفاتيح والأسرار المكشوفة

```
Grep(pattern: "sk-[a-zA-Z0-9]{20,}", output_mode: "content", -n: true)
‖ Grep(pattern: "password\\s*=\\s*['\"]", glob: "*.{py,js,ts,json}", output_mode: "content", -i: true)
‖ Grep(pattern: "api_key|apiKey|API_KEY|secret", glob: "*.{py,js,ts,json,yaml}", output_mode: "content", -i: true)
‖ Grep(pattern: "BEGIN RSA|BEGIN PRIVATE|BEGIN CERTIFICATE", output_mode: "files_with_matches")
```

### ٢. التحقق من .gitignore

```
FileRead(file_path: ".gitignore")
→ تحقق من وجود:
  .env / .env.local / *.key / *.pem / *.p12 / secrets/
```

### ٣. ثغرات الحقن

```
بالتوازي:
Grep(pattern: "\\.raw\\(|execute\\(|cursor\\(", glob: "*.py", output_mode: "content", -C: 3) → SQL Injection
‖ Grep(pattern: "dangerouslySetInnerHTML|innerHTML", glob: "*.{jsx,tsx}", output_mode: "content", -C: 3) → XSS
‖ Grep(pattern: "eval\\(|exec\\(", glob: "*.{py,js}", output_mode: "content", -C: 3) → Code Injection
‖ Grep(pattern: "subprocess\\.call|os\\.system|os\\.popen", glob: "*.py", output_mode: "content", -C: 3) → Command Injection
```

### ٤. إعدادات Django

```
بالتوازي:
Grep(pattern: "DEBUG\\s*=\\s*True", glob: "settings*.py", output_mode: "content") → يجب أن يكون False في الإنتاج
‖ Grep(pattern: "ALLOWED_HOSTS.*\\*", glob: "settings*.py", output_mode: "content") → يجب تقييده
‖ Grep(pattern: "CORS_ALLOW_ALL|CORS_ORIGIN_ALLOW_ALL", glob: "settings*.py", output_mode: "content")
‖ Grep(pattern: "SECRET_KEY\\s*=\\s*['\"]", glob: "settings*.py", output_mode: "content") → يجب نقله لـ .env
```

### ٥. فحص التبعيات

```
Bash(command: "pip list --outdated 2>/dev/null | head -20", description: "Check outdated Python packages")
Bash(command: "npm audit --json 2>/dev/null | head -50", description: "Check npm vulnerabilities")
```

### ٦. CSRF & Session Security

```
بالتوازي:
Grep(pattern: "csrf_exempt|@csrf_exempt", glob: "*.py", output_mode: "content", -C: 3) → يجب تبرير كل إعفاء
‖ Grep(pattern: "SESSION_COOKIE_SECURE|SESSION_COOKIE_HTTPONLY|CSRF_COOKIE_SECURE", glob: "settings*.py", output_mode: "content")
‖ Grep(pattern: "SESSION_ENGINE|SESSION_EXPIRE", glob: "settings*.py", output_mode: "content")
```

### ٧. JWT & Token Validation

```
بالتوازي:
Grep(pattern: "JWT_SECRET|jwt\\.decode|jwt\\.encode|SimpleJWT", glob: "*.py", output_mode: "content", -C: 3)
‖ Grep(pattern: "ACCESS_TOKEN_LIFETIME|REFRESH_TOKEN_LIFETIME|ROTATE_REFRESH", glob: "settings*.py", output_mode: "content")
‖ Grep(pattern: "TokenObtainPairView|TokenRefreshView", glob: "urls*.py", output_mode: "content")
→ تأكد من:
  - ACCESS_TOKEN_LIFETIME قصير (≤15 دقيقة)
  - ROTATE_REFRESH_TOKENS = True
  - BLACKLIST_AFTER_ROTATION = True
```

### ٨. قالب التقرير الإلزامي (مبادئ منع الهلوسة)

لا تقم بتأليف أي ثغرة لم تجدها فعلياً عبر الأدوات المذكورة أعلاه. يجب أن يعتمد التقرير على أوامر حقيقية تم تنفيذها.

```markdown
## نتائج الفحص الأمني (Security Audit)

**وقت القياس:** [timestamp]

| نوع الفحص       | الأمر المستخدم      | النتيجة الفعلية | الحالة |
| --------------- | ------------------- | --------------- | ------ |
| ثغرات NPM       | `npm audit`         | X ثغرات وجدت    | ✅/❌  |
| مفاتيح حساسة    | `Grep`              | X مفاتيح مكشوفة | ✅/❌  |
| إعدادات الإنتاج | `Grep` على settings | DEBUG=[قيمة]    | ✅/❌  |

**التفاصيل والأدلة:**
[اكتب هنا مسارات الملفات والأسطر المعنية بناءً على مخرجات Grep فقط]
```

---

## 🧪 Test Suite — التحقق من صحة المهارة

```bash
#!/bin/bash
# test_security_audit.sh
echo "🔍 فحص بيئة Security Audit..."
grep --version > /dev/null 2>&1 && echo "✅ أداة grep متوفرة" || echo "❌ أداة grep غير متوفرة"
if [ -f "security_audit_report.md" ]; then
  echo "✅ ملف التقرير جاهز للتحديث"
else
  echo "⚠️ ملف التقرير غير موجود (يرجى تشغيل Bootstrap)"
fi
```

---

_Security Audit — 50.0-Singularity Certified. Zero-Trust Enabled._

## 👑 التبعية المركزية الإلزامية (Central Nerve Dependency)

> **تحذير سيادي**: هذه المهارة تابعة بشكل هيكلي ومطلق للمهارة الأم `@[.agents/skills/nexus-core/master.md]`. يُمنع على أي نموذج ذكاء اصطناعي (LLM) أو وكيل تنفيذ أو استخدام هذه المهارة بمعزل عن توجيهات المهارة المركزية العليا. يجب العودة دائماً لدستور `master` قبل اتخاذ أي قرار مصيري.

## 🔬 Zero-Token Real Tools (Phase 5 — 2026-05-29)

> **القاعدة**: جميع الأدوات التالية تستخدم `cli.js.map` كـ PATH فقط — 0 توكن في Context window

### الأدوات الحقيقية المُفعّلة في sovereign_engine.js:

| الأداة                         | الاستخدام في security-audit                                    |
| :----------------------------- | :------------------------------------------------------------- |
| `PredictiveImmunization`       | فحص 1479 ملف بحثاً عن أنماط الثغرات (XSS, SQL injection, eval) |
| `RealtimeScan`                 | مسح حقيقي للكود بأنماط regex متعددة                            |
| `SandboxedChaos`               | اختبار مرونة 20 ملف عبر تحليل التعقيد                          |
| `ZeroTrustMerkleLedger`        | توقيع Merkle Hash لـ 67 ملف مالي حساس                          |
| `LSPTool` (action=diagnostics) | كشف console.log والـ TODO والأسطر الطويلة                      |

### كيفية الاستدعاء الصحيح (Zero-Token):

```javascript
// ✅ صح — map كـ path فقط
PredictiveImmunization.handler({ client_map: './package/cli.js.map' })

// ❌ خطأ — لا تُمرر محتوى الـ map في الـ context
PredictiveImmunization.handler({ client_map: <JSON_CONTENT_10MB> })
```
