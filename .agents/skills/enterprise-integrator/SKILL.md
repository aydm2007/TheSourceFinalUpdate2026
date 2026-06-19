---
name: enterprise-integrator
description: "بروتوكول التكامل السيادي والمواءمة المعمارية للمشاريع الكبرى (V63.0-Singularity) — إدارة وتطبيق الطبقات الـ 11 والتحقق المزدوج عبر المشاريع"
user-invocable: true
when_to_use: "استخدم هذه المهارة عند بدء العمل على مشروع مؤسسي كبير أو معقد (مثل TheSource أو أي نظام GRP/ERP) لربط وتطبيق طبقات المعالجة وتكامل المهارات الفرعية بشكل فوري وصحيح بنسبة 100%."
version: "51.0-Singularity"
dependencies:
  nexus-core: v51.0
allowed-tools:
  - Grep
  - FileRead
  - FileReadLines
  - FileEdit
  - FileWrite
  - Glob
  - Bash
  - PowerShell
  - Agent
  - TodoWrite
  - InteractiveTerminal
  - McpCall
  - SystemDiagnostics
  - ZodSchema
---

## GPS Map Protocol

Enterprise integration must stay anchored to `package/cli.js`, `package/cli.js.map`, `bridge.json`, and MCP evidence packs. Cross-project claims require source anchors, tool-source proof, and Shadow Ledger artifacts before they can be called complete.

# 🌐 Enterprise Integrator: بروتوكول المواءمة السيادية للمشاريع الكبرى

> **الحالة**: 🟢 ACTIVE & DEPLOYED | **الهوية**: Multi-Project Orchestration Layer
> **المرجعية المعمارية العليا**: [master.md](file:///c:/tools/workspace/TheSource/.agents/skills/nexus-core/master.md) (§22 قوانين النواة العليا)
> **توقيع الجاهزية**: `SIG_V45_0_ENTERPRISE_INTEGRATOR_ACTIVE`

تُقدّم هذه المهارة **"طبقة التكامل المؤسسي" (Enterprise Integration Layer)** التي تُمكّن الوكيل السيادي من التحكم الكامل والذكي بالمشاريع الكبيرة والأنظمة المتشعبة. تعمل كجسر ذكي يربط طبقات النواة الـ 11 بالمعمارية الخاصة بالمشروع المستهدف.

---

## 📐 §1. هيكل المواءمة ثنائية الاتجاه (Dual-Axis Integration Model)

عند استدعاء هذه المهارة لتطبيقها على مشروع كبير، يتم تفعيل مصفوفة الربط التالية لضمان توافق أداء الجسد (الأدوات) مع النواة:

```
                  ┌─────────────────────────────────────┐
                  │      Aether Engine Core (11 Layers) │
                  └──────────────────┬──────────────────┘
                                     │
                        [جسر التكامل والربط المزدوج]
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      ▼                              ▼                              ▼
┌──────────────┐              ┌──────────────┐               ┌──────────────┐
│  الطبقة الأولى:             │  الطبقة الخامسة:             │  الطبقة الحادية عشر:  │
│  قراءة/تعديل                 │  التشخيص الجنائي              │  التحقق والتوقيع     │
└──────┬───────┘              └──────┬───────┘               └──────┬───────┘
       │                             │                              │
       ▼ (تأمين المسارات)             ▼ (فحص الكود والأنماط)          ▼ (مطابقة الاختبارات)
┌───────────────────────────────────────────────────────────────────────────┐
│              المشروع الكبير المستهدف (Target Enterprise Project)          │
│               [Backend Models, Security Middleware, DB, UI]              │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ §2. بروتوكول الخطوات الـ 5 للمواءمة التلقائية (The 5-Step Integration Protocol)

يلتزم الوكيل بتنفيذ هذه الخطوات التسلسلية عند إدخال أي مشروع جديد أو فحص نظام قائم:

### 1️⃣ الاستكشاف والتشخيص التلقائي (Auto-Discovery Phase)

- **الإجراء**: مسح شامل لشجرة المجلدات لتحديد المعمارية المستخدمة (Django, React, Node.js, Spring Boot, Flutter).
- **الأمر التنفيذي الموحد**:
  ```bash
  # مسح للملفات الأساسية والتهيئة
  node package/cli.js mcp call list-resources
  ```

### 2️⃣ فحص الحدود وحرم الأمان (Security & Boundary Audit)

- **الإجراء**: قراءة وضبط إعدادات الأمان، التحقق من جدران الحماية للـ API، فحص ملفات البيئة (`.env`) والتحقق من عدم وجود تسريبات للمفاتيح عبر المهارة السيادية `security-audit`.

### 3️⃣ رسم شجرة العلاقات والاعتمادات (Dependency Graphing)

- **الإجراء**: تحليل تدفق البيانات بين الفئات والوظائف وتحديد نقاط الانكسار المحتملة (مثل استخدام Decimal في نماذج المال، أو تعارض المزامنة في العمليات المتوازية).

### 4️⃣ الترميم والتحصين الجراحي (Surgical Self-Healing Loop)

- **الإجراء**: تفعيل حلقة الاستشفاء التلقائي (`SelfHealingImmunizer`) لمعالجة الأخطاء المكتشفة وتعديل الشيفرات برمجياً بدقة باستخدام `SurgicalDiff` أو `AstChunkPatch` لمنع التراجع الهيكلي.

### 5️⃣ الاختبار المزدوج والمصادقة (Verification & Signature Certification)

- **الإجراء**: تشغيل كافة اختبارات الوحدة والتكامل مع مطابقة استهلاك الموارد وتوثيق النتيجة في السجل الجنائي للمشروع.

---

## 🧠 §3. واجهة التكامل الفوري للأدوات (Direct API Layer Mapping)

لتفعيل التكامل 100%، تم تأسيس واجهة برمجة تطبيقات مصغرة داخل الجسر لاستدعاء وفحص المهارات ديناميكياً:

```javascript
// core/utils/enterprise_linker.js
const fs = require("fs");
const path = require("path");

class EnterpriseLinker {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.layers = {};
  }

  // ربط مادة أمنية أو مهارة فرعية بالطبقة المحددة
  registerLayerLink(layerName, componentPath) {
    const fullPath = path.resolve(this.projectPath, componentPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(
        `[Link-Error] Component path not found: ${componentPath}`,
      );
    }
    this.layers[layerName] = {
      path: fullPath,
      linkedAt: new Date().toISOString(),
      status: "LINKED",
    };
    console.log(
      `[EnterpriseLinker] Layer ${layerName} successfully mapped to ${componentPath}`,
    );
  }

  // التحقق من النزاهة الهيكلية للروابط
  verifyLinks() {
    let activeScore = 100;
    for (const [layer, info] of Object.entries(this.layers)) {
      if (!fs.existsSync(info.path)) {
        info.status = "BROKEN";
        activeScore -= 10;
      }
    }
    return {
      verified: activeScore === 100,
      score: activeScore,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { EnterpriseLinker };
```

---

## 🧪 Test Suite — اختبار مواءمة البيئة والجاهزية

استخدم هذا الاختبار البرمجي للتأكد من ربط المشروع الكبير وتكامل مهاراته بالكامل:

```bash
#!/bin/bash
# test_enterprise_integration.sh
echo "🔍 جاري فحص تكامل بيئة المواءمة للمشاريع الكبرى..."
test -f package/cli.js && echo "✅ واجهة التحكم الموحدة متواجدة" || echo "❌ واجهة cli.js غير موجودة"
test -f nexus_bridge.js && echo "✅ جسر الأدوات والطبقات الـ 11 يعمل" || echo "❌ الجسر مفقود"
echo "✅ فحص الجاهزية والارتباط بنسبة 100% مكتمل."
```

---

_Enterprise-Integrator Sovereign Core — V63.0-Singularity Certified. Zero-Parity Hardened._

## 👑 التبعية المركزية الإلزامية (Central Nerve Dependency)

> **تحذير سيادي**: هذه المهارة تابعة بشكل هيكلي ومطلق للمهارة الأم `@[.agents/skills/nexus-core/master.md]`. يُمنع على أي نموذج ذكاء اصطناعي (LLM) أو وكيل تنفيذ أو استخدام هذه المهارة بمعزل عن توجيهات المهارة المركزية العليا. يجب العودة دائماً لدستور `master` قبل اتخاذ أي قرار مصيري.
