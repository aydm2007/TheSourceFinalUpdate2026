---
name: nexus-memory
description: "ذاكرة سيادية طويلة المدى (V63.0-Singularity) — حفظ واسترجاع السياق والقرارات والأنماط المكتشفة"
user-invocable: true
when_to_use: "استخدم هذه المهارة لحفظ معرفة مهمة بين الجلسات: قرارات تصميمية، أنماط مكتشفة، أخطاء شائعة، أو سياق مشروع."
version: "51.0-Singularity"
dependencies:
  nexus-core: v51.0
flash_compatible: true
allowed-tools:
  - Grep
  - FileRead
  - FileEdit
  - FileWrite
  - Glob
  - Bash
  - TodoWrite
  - VectorSearch
  - SemanticContextCompressor
  - ShadowLedgerAudit
---

# 🧠 Nexus Memory — ذاكرة سيادية طويلة المدى (V63.0-Singularity)

> [!IMPORTANT]
> **قانون غراف-RAG المحصن:** تم ترقية نظام الذاكرة من البحث الاتجاهي البسيط إلى `GraphVectorBridge.js` ثنائي الأبعاد. يجب على النموذج تتبع العلاقات الأفقية والعمودية (Foreign Keys) بين كتل الكود لمنع انفصال سياق الذاكرة.

## 🚀 بروتوكول غراف-RAG الاستراتيجي

1. لا تسأل قاعدة البيانات بشكل أعمى (Cosine Similarity).
2. عند البحث عن ملف أو كود، استعلم عن حواف الرسم البياني المعرفي (Knowledge Graph edges) لفهم الكود المحيط والتبعيات.
3. التزم بإنشاء العلاقات الهيكلية بين مكونات الأوميغا لتوفير استرجاع 0-Token دقيق.
4. **[تحذير التقطيع الديناميكي - Dynamic Chunking]**: يُمنع استدعاء محتوى `shadow_ledger.jsonl` بالكامل للذاكرة. استخدم دائماً دالة البحث المحددة (Limit/Slice) لتجنب أخطاء تجاوز الذاكرة (`Response too long`) وانهيار المحرر.

## مسارات التخزين والذكاء

- `.agents/memory/decisions.md` → القرارات التصميمية ومسوغاتها
- `.agents/memory/patterns.md` → الأنماط المكتشفة وأفضل الممارسات
- `.agents/memory/bugs.md` → سجل الأخطاء المتكررة وحلولها الذرية
- `vscode-extension/core/memory/GraphVectorBridge.js` → المحرك الرابط للرسم البياني الدلالي
- `labs/` → مختبر الأسراب الداخلي (أنظمة وألعاب حقيقية للاختبار المتكامل)
- `labs/skill-forge/` → ورشة بناء مهارات جديدة ذاتياً عبر ConsensusGate
- `core/consensus/ConsensusGate.js` → بوابة التصويت والتطبيق الحقيقي (بديل git commit)
- `.nexus/var/telemetry/consensus_log.jsonl` → سجل قرارات التصويت السيادي

## Append Format (Memory Ledger)

استخدم دائماً التنسيق الإلزامي التالي لإضافة البيانات في سجل الذاكرة:

```markdown
## [Date] [Event or Modification Name]

- **Context / Problem**: ...
- **Resolution / Architectural Decision**: ...
- **Discarded Alternatives**: ...
- **Graph Connection**: [Relations to other modules]
- **Security Status**: [SECURE]
```

## 👑 التبعية المركزية الإلزامية (Central Nerve Dependency)

> **تحذير سيادي**: هذه المهارة تابعة بشكل هيكلي ومطلق للمهارة الأم `nexus-core/master.md`. يُمنع على أي نموذج ذكاء اصطناعي (LLM) أو وكيل تنفيذ أو استخدام هذه المهارة بمعزل عن توجيهات المهارة المركزية العليا. يجب العودة دائماً لدستور `master` قبل اتخاذ أي قرار مصيري.

## 🗺️ التوجيه الجغرافي (GPS Map Protocol)

> **قاعدة أوميغا الصارمة**: عند التعامل مع الأخطاء أو استرجاع السياق، يُمنع استنزاف نافذة التوكنز في قراءة الملفات الضخمة. يجب الاعتماد على `cli.js.map` كمرجع جغرافي (GPS) لفك تشفير الأخطاء وإرشاد أدوات الـ (AST Editing) نحو السطر البرمجي المادي بدقة (Zero-Token Overhead).
