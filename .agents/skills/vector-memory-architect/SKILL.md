---
name: vector-memory-architect
description: "Vector Memory Architect — تحويل shadow_ledger.jsonl من ملف نصي ثقيل (7.4MB) إلى قاعدة بيانات متجهات دلالية قابلة للاستعلام في 0-token، مع بناء شبكة معرفية تتعلم من الأخطاء السابقة"
version: "51.0-Singularity"
last-updated: "2026-05-29"
maturity-score: 100
phase: "MEMORY-SOVEREIGN"
when_to_use: "استخدم عند الحاجة لاسترجاع قرار سابق أو نمط جنائي — بدلاً من قراءة 7.4MB، استعلم VectorDB في 0-token"
primary_tools:
  - nexus_VectorAstMapper
  - nexus_VectorSync
  - nexus_VectorSearch
  - nexus_LedgerCompactor
  - nexus_MemoryGraphRefiner
  - nexus_MemoryLedgerForecaster
  - nexus_QuantumHologram
allowed-tools:
  - VectorAstMapper
  - VectorSync
  - VectorSearch
  - LedgerCompactor
  - MemoryGraphRefiner
  - MemoryLedgerForecaster
  - QuantumHologram
  - FileRead
  - Grep
  - Glob
---

# 🧠 Vector Memory Architect — مهندس الذاكرة الدلالية

> **قانون الذاكرة §1 (Zero-Token Law)**:
> أي استعلام عن قرار سابق يجب أن يمر عبر VectorDB أولاً.
> قراءة shadow_ledger.jsonl كاملاً (7.4MB) محظورة — عقوبة: تخفيض 20 نقطة من تقييم الوكيل.

---

## §1. المشكلة الجوهرية

`shadow_ledger.jsonl` بحجمه الحالي (7.4MB) يستهلك:

- **10,000+** توكن لكل قراءة كاملة
- **3-5 ثوانٍ** لكل بحث يدوي
- **0** فهرسة دلالية — كل بحث خطي O(n)

**الهدف**: قاعدة بيانات VectorDB تُجيب على أي استعلام في < 100ms بـ 0 توكن.

---

## §2. بروتوكول التحويل (Migration Protocol)

### المرحلة أ: الضغط والتنظيف

```javascript
// nexus_LedgerCompactor
// المدخل: shadow_ledger.jsonl (7.4MB, N سطر)
// المخرج: shadow_ledger_compact.jsonl (< 500 سطر, أهم القرارات)
// الاحتفاظ بـ: CRITICAL, ERROR, DECISION — حذف: DEBUG, VERBOSE
```

**معيار الضغط**:

- الاحتفاظ بكل سطر يحتوي `MAP_ANCHOR`
- الاحتفاظ بكل سطر يحتوي `DECISION` أو `severity: ERROR`
- حذف سجلات `GPS locked` المتكررة (تُكرَّر آلاف المرات)

### المرحلة ب: الفهرسة في VectorDB

```javascript
// nexus_VectorAstMapper → فهرسة cli.js.map (4756 مصدر)
// nexus_VectorSync → مزامنة القرارات الجنائية
// كل سجل يُحوَّل إلى:
{
  id: "decision_" + traceId,
  text: message + " " + mapAnchor,
  metadata: { severity, file, line, timestamp }
}
```

### المرحلة ج: بناء شبكة المعرفة

```javascript
// nexus_MemoryGraphRefiner (refinement_depth: 3)
// يربط القرارات بعلاقاتها:
// خطأ EOF → tools_integrator.js → مسار نسبي → الحل
// Memory Leak → SyncApiService.ts:L142 → MapDrivenHealer
```

---

## §3. نماذج الاستعلام (Query Patterns)

### استعلام 1: "ما سبب خطأ EOF؟"

```javascript
nexus_VectorSearch({ query: "EOF connection closed swarm agent" });
// النتيجة في < 100ms:
// → "المسار النسبي في tools_integrator.js L28"
// → "[MAP_ANCHOR: worktree/core/security/tools_integrator.js -> L28:C23]"
```

### استعلام 2: "ما الملفات التي تُسبب Memory Leaks؟"

```javascript
nexus_VectorSearch({ query: "memory leak unreleased resource" });
// → قائمة المصادر من cli.js.map مرتبة بالأهمية
```

### استعلام 3: "ما أكثر الأخطاء تكراراً؟"

```javascript
nexus_MemoryLedgerForecaster({
  ledger_file: "shadow_ledger_compact.jsonl",
  scan_depth: 200,
});
// → توقع الأنماط + توصيات تطعيم مناعي (Immunization)
```

---

## §4. الهولوغرام المعماري (QuantumHologram)

لتوليد خريطة مضغوطة للمشروع بـ 1% من حجمه:

```javascript
nexus_QuantumHologram({
  target_directory: "C:/tools/workspace/TheSource",
  compression_level: 7,
});
// الناتج: ملف hologram.json يُغني عن قراءة 2M توكن
```

---

## §5. القالب الإجباري لإدخالات الذاكرة الجديدة

كل قرار جنائي يُضاف للذاكرة يجب أن يتبع هذا القالب:

```jsonl
{
  "id": "decision_[timestamp]",
  "type": "FORENSIC_DECISION",
  "mapAnchor": "[FILE] -> [L:C]",
  "problem": "وصف المشكلة",
  "rootCause": "السبب الجذري",
  "solution": "الحل المُطبَّق",
  "preventionRule": "القاعدة التي تمنع تكراره",
  "severity": "CRITICAL|HIGH|MEDIUM",
  "timestamp": "ISO-8601"
}
```

---

## §6. معايير نجاح هذه المهارة

| المعيار              | قبل       | بعد                    |
| :------------------- | :-------- | :--------------------- |
| حجم shadow_ledger    | 7.4MB     | < 300KB                |
| زمن الاستعلام        | O(n) خطي  | < 100ms VectorDB       |
| استهلاك التوكن للبحث | 10,000+   | 0 (VectorDB)           |
| الأنماط المُستخرَجة  | 0         | 47+ نمط جنائي          |
| التنبؤ بالأخطاء      | غير موجود | MemoryLedgerForecaster |

> [!IMPORTANT]
> بعد كل جلسة عمل ناجحة، يجب استدعاء `nexus_AutoDream` لتقطير الجلسة في CLAUDE.md.
> القرارات في CLAUDE.md = ذاكرة دائمة لا تنتهي بنهاية الجلسة.

## 👑 التبعية المركزية الإلزامية (Central Nerve Dependency)

> **تحذير سيادي**: هذه المهارة تابعة بشكل هيكلي ومطلق للمهارة الأم `nexus-core/master.md`. يُمنع على أي نموذج ذكاء اصطناعي (LLM) أو وكيل تنفيذ أو استخدام هذه المهارة بمعزل عن توجيهات المهارة المركزية العليا. يجب العودة دائماً لدستور `master` قبل اتخاذ أي قرار مصيري.
