# 🏗️ معمارية مشروع TheSource (Nexus Engine V9.0-Omega)

---

## Architecture Maturity Gate

Current architecture documentation cannot claim 100 percent unless these checks pass:

- `bridge.json` declares the same tool count as its `allowed_tools` length.
- `mcp_remote_server.js` exposes documented MCP, admin, wallet, metrics, health, RBAC, and project-isolation paths.
- `config/database.db` schema is documented by table names and row counts only, with secrets redacted.
- `.agents/skills/nexus-core/master.md` is the single entry point for remote model onboarding.
- `npm run docs:audit` returns 100/100 for documentation and skill governance.

> آخر تحديث: 2026-05-09 | النسخة: V9.0-Omega (Sovereign Edition)

---

## نظرة عامة

**TheSource** (Nexus Engine V) هو محرك ذكاء اصطناعي سيادي مستقل ومتطور مصمم لإدارة قواعد الكود الكبيرة وتحسين الأنظمة. مبني على معمارية **المصفوفة التشغيلية** مع دعم متعدد الموفرين ونظام شفاء ذاتي.

### القدرات الجوهرية

- ✅ **تنسيق Nexus-Prime** — تنسيق رئيسي لوكلاء فرعيين ومهارات متخصصة
- ✅ **تدفق Aether-Flow** — دورات ذرية (مسح → تنقيح → تحقق) للتحسين المستمر
- ✅ **رسم المصفوفة الجنائية** — دقة 100% في تعديلات الكود باستخدام بيانات وصفية تشغيلية متقدمة
- ✅ **التتبع الإدراكي (Sigma V11.0)** — تسجيل كل فكرة واستدلال في الذاكرة الظلية
- ✅ **نظام إضافات سيادي** — بنية قابلة للتوسيع بالكامل للعقد والمهارات الاستراتيجية
- ✅ **الشفاء الذاتي** — بروتوكول مستقل لاكتشاف وإصلاح الأعطال تلقائياً
- ✅ **ذكاء هجين** — Gemini Flash 3 + Qwen 2.5-72B عبر SiliconFlow

---

## 📁 هيكل المشروع

```
TheSource/
├── 📦 package/                    # النواة التشغيلية (مُجمّعة)
│   ├── cli.js                     # Runtime مُجمّع (13 MB)
│   ├── cli.js.map                 # Source Map (60 MB)
│   ├── preload.js                 # V7 Unified Interceptor
│   ├── sdk-tools.d.ts             # تعريفات TypeScript (117 KB)
│   ├── siliconflow_adapter.js     # نسخة الـ Adapter داخل الحزمة
│   └── vendor/                    # وحدات أصلية (native binaries)
│
├── 📂 src/                        # مصدر الكود الكامل (TypeScript)
│   ├── main.tsx                   # نقطة الدخول الرئيسية (809 KB)
│   ├── tools/                     # 42 أداة (FileRead, Grep, Agent, LSP, ...)
│   ├── skills/                    # نظام المهارات
│   │   ├── bundled/               # 17 مهارة مُضمّنة
│   │   ├── bundledSkills.ts       # تسجيل المهارات
│   │   └── loadSkillsDir.ts       # محمّل المهارات من المشاريع
│   ├── services/                  # خدمات النظام
│   │   ├── api/                   # عميل API (Anthropic + SiliconFlow)
│   │   ├── analytics/             # تتبع الاستخدام
│   │   ├── mcp/                   # Model Context Protocol
│   │   ├── autoDream/             # Idle Consolidation (Gated)
│   │   └── SessionMemory/         # ذاكرة الجلسة
│   ├── utils/                     # 298 ملف أدوات مساعدة
│   │   ├── teleport/              # Context Transfer (Active)
│   │   ├── swarm/                 # Agent Swarm Orchestration
│   │   ├── ultraplan/             # CCR Sessions (On-Demand)
│   │   ├── computerUse/           # Visual Control (Strictly Gated)
│   │   └── memory/               # Memory Utilities
│   └── types/                     # تعريفات TypeScript
│
├── 🔌 plugins/                    # 13 Plugin قابل للتوسيع
│   ├── code-review/               # مراجعة الكود
│   ├── frontend-design/           # تصميم الواجهات
│   ├── security-guidance/         # إرشادات أمنية
│   ├── commit-commands/           # أوامر Git
│   ├── pr-review-toolkit/         # مراجعة PR
│   └── ...                        # 8 إضافات أخرى
│
├── 🎯 .agents/                    # المنظومة السيادية
│   ├── skills/                    # 7 مهارات مخصصة
│   │   ├── nexus-core/master.md   # المهارة الرئيسية (V9.0-Omega)
│   │   ├── django-doctor/SKILL.md # تشخيص Django ORM + Views
│   │   ├── react-surgeon/SKILL.md # إصلاح React Components
│   │   ├── flutter-fixer/SKILL.md # تشخيص Flutter/Dart
│   │   ├── security-audit/SKILL.md # فحص أمني شامل
│   │   ├── db-forensics/SKILL.md  # تحليل جنائي للبيانات
│   │   └── nexus-memory/SKILL.md  # الذاكرة بين الجلسات
│   ├── memory/                    # الذاكرة السيادية
│   │   ├── decisions.md           # القرارات التصميمية
│   │   ├── patterns.md            # الأنماط المكتشفة
│   │   ├── bugs.md                # سجل الأخطاء
│   │   ├── audit_ledger.md        # سجل التدقيق
│   │   └── vector_index.json      # فهرس ناقلي (222 chunk)
│   └── scripts/                   # أدوات أتمتة
│
├── 🔧 Integration Layer
│   ├── siliconflow_adapter.js     # المحول الموحّد (SSOT)
│   ├── cli-wrapper.js             # اعتراض Anthropic SDK
│   ├── index.js                   # نقطة دخول بديلة
│   ├── sf-settings.json           # إعدادات SiliconFlow
│   └── .env                       # متغيرات البيئة (محمي)
│
├── 🧪 Tests
│   ├── test_siliconflow_adapter.js # 15 اختبار وحدة
│   ├── test_behavior.js           # 19 اختبار سلوكي (Mock-Injected)
│   └── test_integration.js        # اختبارات تكامل
│
└── 📝 Documentation
    ├── README.md                  # التوثيق الرئيسي (عربي)
    ├── README.en.md               # التوثيق (إنجليزي)
    ├── CHANGELOG.md               # سجل التغييرات (192 KB)
    └── docs/ARCHITECTURE.md       # هذا الملف
```

---

## تدفق البيانات

```
┌─────────────────────────────────────────────────┐
│                  المستخدم                        │
│            (طلب / أمر / مهارة)                   │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│              CLI / main.tsx                       │
│  ├── تحليل الإدخال                               │
│  ├── تحميل المهارات (loadSkillsDir.ts)           │
│  │   ├── policySettings → managed/skills/        │
│  │   ├── userSettings   → user/skills/           │
│  │   ├── projectSettings → .agents/skills/       │
│  │   ├── bundled        → src/skills/bundled/    │
│  │   └── legacy         → commands/              │
│  └── اختيار الأدوات المناسبة (42 أداة)           │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│            preload.js (V7 Interceptor)            │
│  ├── اعتراض globalThis.fetch                     │
│  ├── تحويل Anthropic → OpenAI format             │
│  ├── تمرير لـ SiliconFlowAdapter                 │
│  └── إعادة النتيجة بصيغة Anthropic               │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│        SiliconFlowAdapter (siliconflow_adapter.js)│
│  ├── Node A (ayman) → أولوية أعلى                │
│  ├── Node B (ccc)   → احتياطي                    │
│  ├── Retry: 3× + Exponential Backoff             │
│  ├── Streaming: SSE for long responses           │
│  └── Format: OpenAI response → Anthropic format  │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│         SiliconFlow API                           │
│  ├── deepseek-ai/DeepSeek-V3 (مجاني)          │
│  ├── Endpoint: api.siliconflow.com               │
│  └── Max: 4096 tokens / Temperature: 0.7         │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│              تنفيذ الأدوات (42 Tool)              │
│  ├── 👁️ القراءة: FileRead · Grep · Glob · WebFetch│
│  ├── ✋ الكتابة: FileEdit · FileWrite · Notebook  │
│  ├── 🦿 التنفيذ: Bash · PowerShell               │
│  ├── 🤖 الوكلاء: Agent (sub-agents + swarm)      │
│  ├── 🔌 التكامل: MCP · ListMcpResources          │
│  └── 📝 الإدارة: TodoWrite · TaskOutput · TaskStop│
└─────────────────────────────────────────────────┘
```

---

## نموذج الذكاء الهجين

```
الأولوية:
1. Gemini Flash 3 (1M Token Context!)
   ├── التحليل الاستراتيجي والتخطيط العميق
   ├── قراءة مشاريع كاملة دفعة واحدة
   └── تنسيق المهارات وتوزيع العمل

2. Qwen 2.5-72B (مجاني عبر SiliconFlow)
   ├── Node A (ayman) ← أولوية أعلى
   ├── Node B (ccc)   ← احتياطي
   ├── Retry: 3× + Exponential Backoff
   ├── Streaming: SSE
   └── Context: 32K token

3. Claude Opus 4.6 (Thinking) ← للمهام المعقدة (مدفوع)

الملفات المعنية:
├── siliconflow_adapter.js — المحول الموحّد
├── preload.js             — اعتراض الطلبات
├── sf-settings.json       — إعدادات النموذج
└── .env                   — مفاتيح API
```

---

## نظام المهارات

```
تحميل المهارات (بالأولوية):
1. policySettings → ~/.nexus/managed/skills/
2. userSettings   → ~/.nexus/skills/
3. projectSettings → .agents/skills/ (أو .nexus/skills/)
4. bundled        → src/skills/bundled/
5. legacy         → .nexus/commands/
```

### المهارات المخصصة (7)

| المهارة                      | الإصدار     | الوصف                                            |
| ---------------------------- | ----------- | ------------------------------------------------ |
| `master` (nexus-core)        | V10.8-Sigma | النواة السيادية — التنسيق والتوجيه الاستراتيجي   |
| `architectural-constitution` | V1          | دستور المشروع: القواعد والحدود المعمارية         |
| `django-doctor`              | V2          | تشخيص Django: ORM, N+1, Decimal, Signals         |
| `react-surgeon`              | V2          | إصلاح React: State, Props, Hooks, RTL            |
| `flutter-fixer`              | V2          | تشخيص Flutter: Widgets, State, Navigation        |
| `security-audit`             | V2          | فحص أمني: Keys, Injection, CORS                  |
| `db-forensics`               | V2          | تحليل بيانات: Lost Data, Orphans, N+1            |
| `nexus-memory`               | V3          | الذاكرة السيادية: Decisions, Patterns, Bugs      |
| `shadow-memory`              | V11.0       | الذاكرة الظلية: التتبع الإدراكي والأنماط الفاشلة |
| `auto-dream`                 | V1          | تقطير الذاكرة وترسيخ الحالة المعرفية             |

### المهارات المُضمّنة (17)

| المهارة                | الوظيفة                |
| ---------------------- | ---------------------- |
| `verify`               | التحقق من التغييرات    |
| `debug`                | تشخيص الأعطال          |
| `stuck`                | تشخيص الجلسات المعلقة  |
| `batch`                | تنفيذ دفعي             |
| `remember`             | حفظ المعرفة            |
| `skillify`             | تحويل أوامر لمهارات    |
| `simplify`             | تبسيط الكود            |
| `loop`                 | تنفيذ تكراري           |
| `keybindings`          | اختصارات لوحة المفاتيح |
| `claudeApi`            | API Claude المباشر     |
| `claudeApiContent`     | محتوى API Claude       |
| `claudeInChrome`       | التشغيل في Chrome      |
| `scheduleRemoteAgents` | جدولة الوكلاء البعيدين |
| `updateConfig`         | تحديث الإعدادات        |
| `loremIpsum`           | توليد نص تجريبي        |
| `verifyContent`        | التحقق من المحتوى      |
| `index`                | فهرس المهارات          |

---

## الأمان

- مفاتيح API تُخزن في `.env` فقط (محمي بـ `.gitignore`)
- نظام أذونات متعدد الطبقات للأدوات
- كل أداة تحدد `SafeToAutoRun` بشكل منفصل
- Killswitch لبيئة الإنتاج لمنع التجاوزات
- الشفاء الذاتي عبر بروتوكول §8 في master.md

---

## الميزات التجريبية (Gated Features)

| الميزة              | الموقع                    | الحالة         | الوصف               |
| ------------------- | ------------------------- | -------------- | ------------------- |
| **Ultraplan**       | `src/utils/ultraplan/`    | On-Demand      | CCR sessions        |
| **AutoDream**       | `src/services/autoDream/` | Gated          | Idle consolidation  |
| **Computer Use**    | `src/utils/computerUse/`  | Strictly Gated | Visual control      |
| **Teleport**        | `src/utils/teleport/`     | Active         | Context transfer    |
| **Swarm**           | `src/utils/swarm/`        | Active         | Agent orchestration |
| **Model Migration** | `src/migrations/`         | Plug & Play    | Model evolution     |

---

_Nexus Engine V9.0-Omega — السيادة. الشفاء الذاتي. الحل الجذري._
