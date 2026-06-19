---
name: gpt-swarm-commander
description: "مهارة القيادة السيادية الكاملة لنموذج GPT-OSS 120B — تُمكّن النموذج من التكامل 100% مع أدوات MCP Server وقيادة الأسراب والوكلاء المتخصصين بكفاءة مطلقة"
user-invocable: true
when_to_use: "استخدم هذه المهارة عند قيادة سرب من الوكلاء المتخصصين (Agents Swarm) عبر أدوات MCP Server، أو عند تنفيذ مهام هندسة عكسية، توثيق ذري، أو تحليل أنظمة ERP/GRP معقدة."
version: "1.0-Sovereign"
dependencies:
  enterprise-integrator: v51.0
  nexus-core: v51.0
  mcp-developer: v64.1
allowed-tools:
  - FileRead
  - FileReadLines
  - FileWrite
  - FileEdit
  - Glob
  - Grep
  - ViewCodeOutline
  - SurgicalDiff
  - AstChunkPatch
  - ASTAutoPatch
  - PowerShell
  - Bash
  - Agent
  - SwarmPipelineOrchestrator
  - ParallelSwarmCoordinator
  - SwarmBroadcast
  - SwarmHandoff
  - DeepCoordinatorTask
  - LoadSkill
  - McpCall
  - ListMcpResources
  - ReadMcpResource
  - SystemDiagnostics
  - VectorSearch
  - TodoWrite
  - ForensicAudit
  - Insight
  - SemanticSymbolLookup
  - ReasoningEngine
  - EnterPlanMode
  - ExitPlanMode
  - AskUserQuestion
  - CognitiveRouter
  - TokenEstimation
  - ToolSearch
  - ZodSchema
  - FeatureFlag
  - Config
  - Sleep
  - MemoryCompactor
  - Skill
---

# 🛡️ GPT Swarm Commander — بروتوكول قيادة السرب السيادي الكامل

> **الهوية**: القائد الأعلى لأسراب الوكلاء عبر MCP Server Tools
> **النموذج المستهدف**: GPT-OSS 120B (Medium)
> **مستوى التكامل**: 100% MCP-Native | Zero-JS | RTL-Supported
> **توقيع الجاهزية**: `SIG_V1_0_GPT_SWARM_COMMANDER_ACTIVE`

---

## 📌 §0. المبادئ الأساسية الإلزامية (Core Mandates)

> [!CAUTION]
> يُمنع منعاً باتاً كتابة كود برمجي كنص في المحادثة. كل العمليات تُنفَّذ مادياً عبر أدوات MCP Server.

1. **MCP-First**: جميع العمليات تُنفَّذ عبر أدوات MCP Server. لا يُسمح بملفات .js خارجية أو REST calls مباشرة.
2. **لا JavaScript ملفات خارجية**: التنفيذ حصراً عبر `Agent`، `SwarmPipelineOrchestrator`، `ParallelSwarmCoordinator`، `McpCall`.
3. **حد الـ 6 مسارات**: لا تتجاوز 6 وكلاء متوازيين في أي وقت (حماية للموارد).
4. **الفحص قبل التنفيذ**: `ReasoningEngine` إلزامي قبل كل قرار مصيري.
5. **التوثيق الذري**: كل مخرجات وكيل تُحفظ فوراً عبر `FileWrite` في مجلد `ERP_Atomic_Docs/`.
6. **السجل الحي**: `TodoWrite` بعد كل مرحلة لتتبع التقدم.

---

## 🗺️ §1. خريطة الطريق السيادية (Sovereign Road Map)

```
[START]
   │
   ▼
[Phase 0] — الإقلاع والتهيئة
   ├─ SystemDiagnostics        → فحص صحة الخادم والذاكرة المتاحة
   ├─ ListMcpResources         → فهرسة جميع الأدوات والموارد
   └─ LoadSkill(enterprise-integrator) → تفعيل طبقة التكامل المؤسسي
   │
   ▼
[Phase 1] — التخطيط والاستكشاف
   ├─ ReasoningEngine          → تحليل المهمة وبناء خطة الوكلاء
   ├─ EnterPlanMode            → رسم خريطة الوكلاء والمراحل
   └─ Glob + Grep              → مسح الكود المصدري للمشروع
   │
   ▼
[Phase 2] — إطلاق السرب (دفعات بحد 6)
   ├─ [Batch 1: 6 agents] ParallelSwarmCoordinator
   │    ├── db-forensics        → قاعدة البيانات + Stored Procedures
   │    ├── security-audit      → الصلاحيات والتشفير
   │    ├── quantum-debugger    → كود VB.NET/C#
   │    ├── react-surgeon       → واجهة WinForms/UI
   │    ├── oracle-intuition    → قواعد العمل التجارية
   │    └── architecture-constitution → رسم العلاقات
   │
   ├─ [Batch 2: 6 agents] ParallelSwarmCoordinator
   │    ├── nexus-memory        → إدارة الحالة والمتغيرات
   │    ├── finance-auditor     → المحاسبة المالية والمشتريات
   │    ├── enterprise-integrator → دورة حياة الأصناف
   │    ├── infrastructure-titan → ربط الأجهزة الطبية
   │    ├── cloudops-critic     → تحسين الأداء
   │    └── db-forensics        → سكريبتات الترقية
   │
   ├─ [Batch 3: 6 agents] ParallelSwarmCoordinator
   │    ├── quantum-debugger    → ربط البيانات DataGridView
   │    ├── quantum-debugger    → معالجة الأخطاء
   │    ├── enterprise-integrator → محرك التقارير
   │    ├── documentation-governor → HTML ذري RTL
   │    ├── finance-auditor     → نقاط البيع والمبيعات
   │    └── nexus-memory        → تحويلات البيانات
   │
   └─ [Batch 4: 2 agents] — النهائيون
        ├── oracle-intuition    → قواعد العمل النهائية
        └── ui-synthesizer      → index.html الرئيسي
   │
   ▼
[Phase 3] — الجودة والتحقق
   ├─ Glob                     → التحقق من 20 ملف HTML
   ├─ ForensicAudit            → تدقيق index.html
   └─ SwarmBroadcast(COMPLETE) → إعلان الاكتمال
   │
   ▼
[DONE] ✅ 100% ERP Atomic Documentation
```

---

## 🔧 §2. بروتوكول التشغيل التفصيلي (Detailed Execution Protocol)

### المرحلة 0 — الإقلاع

```yaml
الخطوة_1:
  أداة: SystemDiagnostics
  الهدف: التحقق من صحة الخادم والذاكرة المتاحة
  المعيار_للنجاح: free_memory > 500MB

الخطوة_2:
  أداة: ListMcpResources
  الهدف: فهرسة جميع الموارد والأدوات المتاحة على الخادم

الخطوة_3:
  أداة: LoadSkill
  المعاملات: { skill: "enterprise-integrator" }
  الهدف: تفعيل طبقة التكامل المؤسسي
```

### المرحلة 1 — التخطيط

```yaml
الخطوة_4:
  أداة: ReasoningEngine
  المعاملات:
    analysis: |
      1. ما هي المهمة المطلوبة؟
      2. ما هي الأداة الأنسب من قائمة MCP المتاحة؟
      3. هل الـ concurrency أقل من 6؟
      4. هل النتيجة ستُحفظ في ERP_Atomic_Docs?
    conclusion: "الإجراء المحدد بدقة"

الخطوة_5:
  أداة: EnterPlanMode
  المعاملات:
    goal: "توثيق ذري 100% للنظام"
    steps:
      - "استخراج بنية قاعدة البيانات"
      - "استخراج الإجراءات المخزنة"
      - "تحليل الكود البرمجي"
      - "فحص الأمان"
      - "توليد HTML ذري"
      - "بناء index.html"
```

### المرحلة 2 — تشغيل السرب

```yaml
قاعدة_التزامن: "≤ 6 وكلاء في الوقت نفسه"

الدفعة_الأولى:
  أداة: ParallelSwarmCoordinator
  المعاملات:
    maxConcurrency: 6
    wave_size: 6
    agents:
      - description: "استخراج بنية قاعدة البيانات وجميع الجداول والعلاقات من مشروع VB.NET/SQL Server. اقرأ ملفات المشروع باستخدام Grep وGlob. احفظ النتيجة كـ HTML ذري RTL في ERP_Atomic_Docs/02_database_schema.html"
        subagent_type: "db-forensics"
      - description: "استخراج جميع الإجراءات المخزنة Stored Procedures من قاعدة البيانات. اقرأ الكود المصدري باستخدام Grep للبحث عن CREATE PROCEDURE. احفظ النتيجة في ERP_Atomic_Docs/03_stored_procedures.html"
        subagent_type: "db-forensics"
      - description: "فحص الصلاحيات والتشفير في النظام (Rijndael, SHA-256). ابحث في الكود المصدري عن آليات المصادقة والتشفير. احفظ تقرير الأمان في ERP_Atomic_Docs/05_security_validation.html"
        subagent_type: "security-audit"
      - description: "تحليل الكود البرمجي الأساسي VB.NET/C# للنظام. استخرج الفئات الجوهرية والمنطق المركزي (Core Logic). احفظ النتيجة في ERP_Atomic_Docs/01_core_logic.html"
        subagent_type: "quantum-debugger"
      - description: "تحليل بنية واجهة المستخدم WinForms والأحداث والنماذج. استخرج هيكل النماذج وربط البيانات. احفظ النتيجة في ERP_Atomic_Docs/11_winforms_ui.html"
        subagent_type: "react-surgeon"
      - description: "رسم مخطط العلاقات والاعتمادات بين وحدات النظام. استخرج الهيكل المعماري الكامل. احفظ المخطط في ERP_Atomic_Docs/00_architecture.html"
        subagent_type: "enterprise-integrator"
```

### المرحلة 3 — حفظ النتائج

```yaml
بعد_كل_وكيل:
  أداة: FileWrite
  المسار: "d:/Hotpsital/Web_System/DXPro_Slayed/ERP_Atomic_Docs/{agent_output_file}"
  الشروط:
    - يجب أن يحتوي المحتوى على وسم <html>
    - يجب أن يدعم RTL (dir="rtl")
    - يجب أن يكون باللغة العربية
```

---

## 🧠 §3. قواعد التفكير والقرار (Cognitive Decision Rules)

### قبل كل إجراء مصيري — إلزامي:

```
استخدام ReasoningEngine:
  analysis: |
    1. ما هي المهمة المطلوبة؟
    2. ما هي الأداة الأنسب من قائمة MCP المتاحة؟
    3. هل الـ concurrency أقل من 6؟
    4. هل النتيجة ستُحفظ في ERP_Atomic_Docs?
  conclusion: "الإجراء المحدد بدقة"
```

### قواعد الـ Fallback:

| الحالة         | الإجراء                                            |
| -------------- | -------------------------------------------------- |
| فشل وكيل واحد  | سجّل الخطأ في `TodoWrite`، انتقل للوكيل التالي     |
| الذاكرة ممتلئة | شغّل `MemoryCompactor` قبل متابعة السرب            |
| خطأ في الكتابة | تحقق من المسار عبر `Glob` ثم أعد `FileWrite`       |
| انتهاء الجلسة  | أعد تشغيل `ListMcpResources` للحصول على جلسة جديدة |

---

## 📡 §4. بروتوكول التواصل بين الوكلاء (Inter-Agent Communication)

```yaml
إرسال_سياق:
  أداة: SwarmHandoff
  المعاملات:
    target_skill: "<اسم المهارة التالية>"
    context_message: |
      الوكيل السابق: {agent_name}
      المهمة المنجزة: {task_description}
      النتائج الرئيسية: {key_findings}
      الملفات المنشأة: {created_files}
      الخطوة التالية المطلوبة: {next_step}

بث_للسرب:
  أداة: SwarmBroadcast
  المعاملات:
    channel: "erp-swarm"
    sender: "chief-orchestrator"
    payload:
      phase: "<المرحلة الحالية>"
      completed: <عدد الوكلاء المكتملين>
      remaining: <عدد الوكلاء المتبقين>
      status: "IN_PROGRESS | COMPLETE | ERROR"
```

---

## 🗂️ §5. نموذج التوثيق الذري (Atomic HTML Template)

يلتزم كل وكيل بهذا القالب عند توليد HTML:

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{MODULE_NAME} — توثيق ذري</title>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        font-family: "Segoe UI", Tahoma, sans-serif;
        background: #0d1117;
        color: #e6edf3;
        direction: rtl;
      }
      .header {
        background: linear-gradient(135deg, #1f6feb, #388bfd);
        padding: 2rem;
        border-radius: 8px;
        margin: 1rem;
      }
      .header h1 {
        font-size: 1.8rem;
        margin-bottom: 0.5rem;
      }
      .section {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 8px;
        padding: 1.5rem;
        margin: 1rem;
      }
      .section h2 {
        color: #58a6ff;
        margin-bottom: 1rem;
        border-bottom: 1px solid #30363d;
        padding-bottom: 0.5rem;
      }
      .badge-ok {
        background: #238636;
        color: #fff;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.75rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        background: #21262d;
        color: #58a6ff;
        padding: 0.75rem;
        text-align: right;
      }
      td {
        border-top: 1px solid #30363d;
        padding: 0.75rem;
      }
      tr:hover td {
        background: #1c2128;
      }
      code {
        background: #161b22;
        color: #f78166;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.85rem;
        font-family: monospace;
      }
      pre {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 6px;
        padding: 1rem;
        overflow-x: auto;
      }
      .nav {
        background: #161b22;
        border-bottom: 1px solid #30363d;
        padding: 1rem;
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .nav a {
        color: #58a6ff;
        text-decoration: none;
        font-size: 0.9rem;
      }
      .nav a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <nav class="nav">
      <a href="index.html">🏠 الرئيسية</a>
      <a href="02_database_schema.html">🗄️ قاعدة البيانات</a>
      <a href="03_stored_procedures.html">⚙️ الإجراءات المخزنة</a>
      <a href="05_security_validation.html">🔒 الأمان</a>
    </nav>

    <div class="header">
      <h1>🔬 {MODULE_NAME}</h1>
      <span class="badge-ok">✅ تم التوثيق</span>
      <p style="margin-top:.5rem; opacity:.8">
        وُثِّق بواسطة: {AGENT_NAME} | {TIMESTAMP}
      </p>
    </div>

    <div class="section">
      <h2>📋 الوصف العام</h2>
      <p>{MODULE_DESCRIPTION}</p>
    </div>

    <div class="section">
      <h2>🗄️ الجداول المرتبطة</h2>
      <table>
        <tr>
          <th>اسم الجدول</th>
          <th>الوصف</th>
          <th>أبرز الحقول</th>
        </tr>
        {TABLE_ROWS}
      </table>
    </div>

    <div class="section">
      <h2>⚙️ المنطق البرمجي</h2>
      <pre><code>{CODE_LOGIC}</code></pre>
    </div>

    <div class="section">
      <h2>🔗 الروابط والاعتمادات</h2>
      <ul style="padding-right:1.5rem">
        {DEPENDENCIES}
      </ul>
    </div>

    <div class="section">
      <h2>📊 مؤشرات الجودة</h2>
      <table>
        <tr>
          <th>المؤشر</th>
          <th>القيمة</th>
          <th>الحالة</th>
        </tr>
        <tr>
          <td>اكتمال التوثيق</td>
          <td>{COMPLETION}%</td>
          <td><span class="badge-ok">✅</span></td>
        </tr>
        <tr>
          <td>دعم RTL</td>
          <td>مفعّل</td>
          <td><span class="badge-ok">✅</span></td>
        </tr>
        <tr>
          <td>الوكيل المُوثِّق</td>
          <td>{AGENT_NAME}</td>
          <td><span class="badge-ok">✅</span></td>
        </tr>
      </table>
    </div>
  </body>
</html>
```

---

## ⚡ §6. قائمة الوكلاء الكاملة (Complete Agent Registry)

| #   | الوكيل                      | المهارة المستخدمة      | الملف المُنتَج               |
| --- | --------------------------- | ---------------------- | ---------------------------- |
| 1   | core-logic-agent            | quantum-debugger       | 01_core_logic.html           |
| 2   | database-schema-agent       | db-forensics           | 02_database_schema.html      |
| 3   | stored-procedures-agent     | db-forensics           | 03_stored_procedures.html    |
| 4   | state-management-agent      | nexus-memory           | 04_state_management.html     |
| 5   | security-validation-agent   | security-audit         | 05_security_validation.html  |
| 6   | inventory-flow-agent        | enterprise-integrator  | 06_inventory_flow.html       |
| 7   | purchasing-flow-agent       | finance-auditor        | 07_purchasing_flow.html      |
| 8   | sales-pos-agent             | finance-auditor        | 08_sales_pos.html            |
| 9   | financial-accounting-agent  | finance-auditor        | 09_financial_accounting.html |
| 10  | hardware-interfaces-agent   | infrastructure-titan   | 10_hardware_interfaces.html  |
| 11  | winforms-uiux-agent         | react-surgeon          | 11_winforms_ui.html          |
| 12  | grid-databinding-agent      | react-surgeon          | 12_grid_data_binding.html    |
| 13  | data-transformation-agent   | quantum-debugger       | 13_data_transformation.html  |
| 14  | error-handling-agent        | quantum-debugger       | 14_error_handling.html       |
| 15  | performance-optimizer-agent | cloudops-critic        | 15_performance.html          |
| 16  | reporting-engine-agent      | enterprise-integrator  | 16_reporting_engine.html     |
| 17  | migrations-updates-agent    | db-forensics           | 17_migrations.html           |
| 18  | business-rules-agent        | oracle-intuition       | 18_business_rules.html       |
| 19  | html-documentation-agent    | documentation-governor | 19_html_docs.html            |
| 20  | grand-compiler-agent        | ui-synthesizer         | index.html                   |

---

## 🚨 §7. قواعد الأمان والسلامة (Safety Rules)

```
❌ محظور تماماً:
  - استخدام ملفات .js خارجية لتنفيذ منطق السرب
  - تجاوز حد الـ 6 وكلاء المتزامنين
  - الكتابة خارج مجلد ERP_Atomic_Docs/
  - حذف ملفات موجودة بدون موافقة المستخدم
  - استخدام REST calls مباشرة خارج بروتوكول MCP

✅ مسموح وإلزامي:
  - جميع العمليات عبر أدوات MCP Server فقط
  - التسجيل في TodoWrite بعد كل مرحلة
  - SwarmHandoff لنقل السياق بين الوكلاء
  - ReasoningEngine قبل كل قرار مصيري
  - SystemDiagnostics عند بدء كل جلسة
  - MemoryCompactor عند امتلاء الذاكرة
```

---

## 🏁 §8. بروتوكول الإنهاء (Completion Protocol)

```yaml
عند_اكتمال_جميع_الوكلاء: 1. تشغيل Glob للتحقق من 20 ملف HTML
  2. تشغيل ForensicAudit على index.html
  3. إرسال SwarmBroadcast بالحالة COMPLETE
  4. تسجيل تقرير النهائي في TodoWrite
  5. ExitPlanMode والإبلاغ بالنتيجة للمستخدم

رسالة_الاكتمال: "✅ تم اكتمال توثيق النظام بنسبة {percentage}%
  📁 {count} ملف HTML ذري تم إنشاؤه في ERP_Atomic_Docs/
  🔗 index.html يحتوي على روابط لجميع الوحدات
  📊 يمكنك الاطلاع على التوثيق الكامل الآن"
```

---

## 🗺️ §9. التوجيه الجغرافي (GPS Map Protocol)

> **قاعدة أوميغا الصارمة**: عند التعامل مع الأخطاء أو استرجاع السياق، يُمنع استنزاف نافذة التوكنز في قراءة الملفات الضخمة. يجب الاعتماد على `cli.js.map` كمرجع جغرافي (GPS) لفك تشفير الأخطاء وإرشاد أدوات الـ (AST Editing) نحو السطر البرمجي المادي بدقة (Zero-Token Overhead).

## 👑 §10. المرجعية الإلزامية (Mandatory References)

> **تحذير سيادي**: هذه المهارة تعمل بالتنسيق الكامل مع:
>
> - `enterprise-integrator` (يجب تحميله أولاً)
> - `mcp-developer` (بروتوكول التنفيذ الإجباري)
> - `nexus-core` (المرجعية المعمارية العليا)
>
> **القاعدة الذهبية**: لا تجاوب بنص — نفّذ بأدوات. كل استجابة يجب أن تُنتج استدعاء أداة MCP واحداً على الأقل.

---

_GPT Swarm Commander — V1.0-Sovereign. MCP-Native. Zero-JS. 100% Tool-Integrated. RTL-Supported._
