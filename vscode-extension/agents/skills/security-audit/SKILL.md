---
name: security-audit
description: "فحص أمني شامل للمشروع — مفاتيح مكشوفة، ثغرات، وأفضل ممارسات الأمان"
user-invocable: true
when_to_use: "استخدم هذه المهارة لإجراء فحص أمني شامل: البحث عن مفاتيح مكشوفة، ثغرات حقن، وإعدادات أمان ضعيفة."
version: 15.0-Apex
allowed-tools:
  - Grep
  - FileRead
  - FileEdit
  - FileWrite
  - Glob
  - Bash
  - Agent
  - TodoWrite
  - WebFetch
  - WebSearch
  - Mcp
---

# Security Audit — فحص أمني سيادي (Hardened GRP)

> هذه المهارة جزء من منظومة **AETHER-ZENITH V15.0-Apex** وتعمل داخل **بيئة Antigravity (Google)**.
> 📌 للتفعيل الكامل: أشِر إلى المهارة الرئيسية `@[.agents/skills/nexus-core/master.md]`

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

### ٨. التقرير
```
FileWrite(file_path: "security_audit_report.md", content: "# 🔒 تقرير الفحص الأمني\n...")
```

نموذج التقرير:
```markdown
# 🔒 تقرير الفحص الأمني
| # | المشكلة | الخطورة | الملف:السطر | التوصية |
|---|---------|---------|-------------|---------|
| 1 | مفتاح API مكشوف | 🔴 حرج | config.py:45 | نقل لـ .env |
| 2 | DEBUG=True | ⚠️ عالية | settings.py:12 | تغيير لـ False |
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
*Security Audit — 15.0-Apex Certified. Zero-Trust Enabled.*

