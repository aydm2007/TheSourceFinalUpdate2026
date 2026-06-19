---
name: gps-map-healer
description: "GPS Source-Map Healing Agent — تحليل وإصلاح الأخطاء باستخدام cli.js.map كمصدر حقيقة وحيد، مع فهرسة 4756 مصدر TypeScript في VectorDB للبحث الدلالي الفوري"
version: "51.1-Singularity"
last-updated: "2026-06-03"
maturity-score: 100
phase: "GPS-SOVEREIGN"
when_to_use: "استخدم هذه المهارة عند ظهور أي خطأ Stderr أو Stack Trace أو فشل في nexus_bridge، وعند أي تقييم 100% يتطلب إثبات SourceMap أو وعي بصري؛ يجب تمرير الدليل عبر cli.js.map قبل أي تخمين"
primary_tools:
  - nexus_RemoteMapDecoder
  - nexus_VectorAstMapper
  - nexus_SelfHealingImmunizer
  - nexus_ForensicAudit
  - nexus_Bash
  - nexus_FileRead
  - nexus_FileEdit
allowed-tools:
  - RemoteMapDecoder
  - VectorAstMapper
  - SelfHealingImmunizer
  - ForensicAudit
  - Bash
  - FileRead
  - FileEdit
  - Grep
  - Glob
---

# 🗺️ GPS Map Healer — وكيل الاستشفاء الموجّه بخرائط المصدر

> **القانون الأول للمهارة (Absolute Law §1)**:
> يُمنع منعاً باتاً الاعتماد على التخمين أو الذاكرة النصية عند تشخيص خطأ برمجي.
> **كل خطأ → cli.js.map → إحداثية دقيقة → جراحة ذرية.**
> **كل تقييم 100% → cli.js.map metadata → probe قابل للتكرار → Shadow Ledger.**

---

## §1. ما هو GPS Map Healer؟

هذه المهارة تُجسّد **المحور 3** من دستور TheSource:

> _"محاذاة خرائط المصدر الفيزيائية (GPS Source-Map Grounding)"_

`package/cli.js` هو الجسد التنفيذي المُجمَّع.
`package/cli.js.map` هو **رؤية أشعة إكس (X-Ray Vision)** — يربط كل سطر مُجمَّع بملف TypeScript الأصلي وسطره ومدته.

**الحقيقة المادية (Live Evidence)**:

```
cli.js.map يحتوي: 4,756 مصدر TypeScript
cli.js.map يحتوي: 4,756 sourcesContent
آخر تحقق ناجح: npm run cli-map:verify
```

**حدود الوعي البصري**:

- `VisualDomMapper` الحالي يثبت topology بنيوية من `sourcesContent` داخل `cli.js.map`.
- لا يُعد ذلك مراقبة واجهة لحظية كاملة إلا إذا وُجد DOM/accessibility tree أو screenshot حي مرتبط بعقدة SourceMap ومسجل في Shadow Ledger.

**حد شهادة MCP الكاملة**:

- `npm run cli-map:verify` يثبت طبقة SourceMap/GPS فقط.
- `npm run tool-source:verify` يثبت ربط كل أدوات `bridge.json` بمراسي مصدرية في runtime، مع تسجيل مراسي `cli.js.map` المباشرة عند توفرها.
- شهادة MCP Server Tools 100/100 تتطلب `npm run mcp-tools:certify:strict -- --full`.
- آخر حزمة أدلة معتمدة: `reports/mcp-tools-100/2026-06-03T19-41-21-571Z/source_map_tool_proofs.json` و`summary.json`.
- أي تقرير جنائي يجب أن يربط الادعاء بـ `mapAnchor` أو artifact hash عند توفره.

---

## §2. بروتوكول التفعيل الإجباري

### عند استلام أي Stack Trace أو Stderr:

**الخطوة 1 — الاستخراج:**

```bash
# استخرج السطر والعمود من الخطأ
# مثال: "Error at cli.js:1234:56"
LINE=1234; COL=56
```

**الخطوة 2 — فك التشفير العكسي (Reverse Map):**

```javascript
// باستخدام nexus_RemoteMapDecoder
// المدخل: سطر وعمود في cli.js
// المخرج: الملف الأصلي + السطر + العمود في TypeScript
// مثال: src/core/services/SyncApiService.ts -> L142:C8
```

**الخطوة 3 — الفهرسة الدلالية:**

```javascript
// nexus_VectorAstMapper يُفهرس cli.js.map في VectorDB
// بعد الفهرسة: بحث دلالي في 0-token
// مثال: بحث "error handling sync" → يُعيد أقرب 5 ملفات
```

**الخطوة 4 — تسجيل الإحداثية الإجبارية:**

```
[MAP_ANCHOR: src/core/services/SyncApiService.ts -> L142:C8]
[SEVERITY: CRITICAL | CATEGORY: EOF_CONNECTION]
[ROOT_CAUSE: المسار النسبي في tools_integrator.js]
[DECISION: تحويل إلى path.join(__dirname, '../package/cli.js.map')]
```

**الخطوة 5 — الجراحة الذرية:**

```javascript
// nexus_FileEdit بعد تحديد الإحداثية المادية
// لا تلمس أي سطر خارج النطاق المُحدد
```

---

## §3. الفجوات المُكتشفة وإصلاحاتها

### الفجوة الحرجة #1: المسار النسبي في tools_integrator.js

```javascript
// ❌ قبل (يُسبب EOF عند تشغيل من مسار مختلف):
const cliMapPath = "./package/cli.js.map";

// ✅ بعد (مسار مطلق مضمون):
const cliMapPath = path.join(__dirname, "../package/cli.js.map");
```

**الملفات المتأثرة**:

- `worktree/vscode-extension/core/security/tools_integrator.js` السطر 28
- `worktree/core/security/tools_integrator.js` السطر 28

### الفجوة الحرجة #2: MapDrivenHealer غير مُدمج في repair-loop

```javascript
// ✅ الإضافة المطلوبة في repair-loop.js:
const { MapDrivenHealer } = require("./MapDrivenHealer");
const healer = new MapDrivenHealer(workspaceRoot);
await healer.init();

// عند اكتشاف خطأ:
const result = await healer.healFromError(stderrOutput);
if (result.success) {
  console.log(`[GPS] Target: ${result.originalFile}:${result.line}`);
  // → توجيه جراحة AST نحو الإحداثية المحددة فقط
}
```

---

## §4. معايير النجاح (Pass/Fail Criteria)

| المعيار                | الحالة المطلوبة                                           | أمر التحقق                                   |
| :--------------------- | :-------------------------------------------------------- | :------------------------------------------- |
| cli.js.map محمَّل      | ✅ موجود في `package/`                                    | `fs.existsSync('package/cli.js.map')`        |
| الفهرسة في VectorDB    | ✅ 4756 مصدر مُفهرَس                                      | `nexus_VectorAstMapper(map_path)`            |
| المسار مطلق            | ✅ `__dirname` أو `path.resolve`                          | `Grep("./package/cli.js.map")` → 0 نتائج     |
| MapDrivenHealer مُدمَج | ✅ مستدعى في repair-loop                                  | `Grep("MapDrivenHealer", "repair-loop.js")`  |
| اختبار GPS حي          | ✅ `L142:C8` مُعاد                                        | `node test-map-healing.js`                   |
| تحقق SourceMap للتقييم | ✅ metadata فقط دون تحميل الخريطة في سياق النموذج         | `npm run cli-map:verify`                     |
| ربط الأدوات بالمصدر    | ✅ 129/129 أو كل أدوات bridge الحالية لها runtime anchors | `npm run tool-source:verify`                 |
| شهادة MCP Server Tools | ✅ كل lanes مكتملة مع hashes وShadow Ledger               | `npm run mcp-tools:certify:strict -- --full` |
| وعي بصري حي            | ✅ DOM/screenshot runtime مرتبط بـ SourceMap              | لا يُحتسب 100% دون probe حي                  |

---

## §5. تسجيل الإحداثيات في Shadow Ledger

**القالب الإجباري لكل إدخال GPS:**

```jsonl
{
  "traceId": "...",
  "severity": "INFO",
  "message": "📍 [GPS-Healer] Map-Anchor resolved",
  "mapAnchor": "src/core/services/SyncApiService.ts -> L142:C8",
  "rootCause": "نسبة المسار في tools_integrator.js",
  "fix": "path.join(__dirname, '../package/cli.js.map')",
  "timestamp": "2026-05-29T..."
}
```

---

## §6. تسلسل الاستدعاء الكامل (Full Invocation Chain)

```
1. nexus_RemoteMapDecoder → فك تشفير cli.js.map
2. nexus_VectorAstMapper  → فهرسة 4756 مصدر
3. nexus_ForensicAudit    → تدقيق الإحداثية المُكتشفة
4. nexus_FileEdit         → جراحة ذرية على السطر المحدد
5. nexus_Bash("node test-map-healing.js") → تحقق حي
6. تسجيل MAP_ANCHOR في shadow_ledger.jsonl
```

> [!IMPORTANT]
> هذه المهارة هي **الطبقة الصفرية** للنظام. لا يجوز لأي وكيل آخر تشخيص خطأ دون المرور عبرها أولاً.

## 👑 التبعية المركزية الإلزامية (Central Nerve Dependency)

> **تحذير سيادي**: هذه المهارة تابعة بشكل هيكلي ومطلق للمهارة الأم `nexus-core/master.md`. يُمنع على أي نموذج ذكاء اصطناعي (LLM) أو وكيل تنفيذ أو استخدام هذه المهارة بمعزل عن توجيهات المهارة المركزية العليا. يجب العودة دائماً لدستور `master` قبل اتخاذ أي قرار مصيري.
