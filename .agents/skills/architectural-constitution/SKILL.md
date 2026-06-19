---
name: architectural-constitution
description: "مهارة قالب الدستور المعماري (Project Constitution) — لتأسيس معايير المشروع للوكلاء"
user-invocable: true
when_to_use: "استخدم هذه المهارة لإنشاء أو مراجعة ملف PROJECT_CONSTITUTION.md في أي مشروع جديد لضمان توافق الوكلاء."
version: "51.0-Singularity"
dependencies:
  nexus-core: v51.0
allowed-tools:
  - FileRead
  - FileWrite
  - FileEdit
  - Grep
  - Glob
  - Bash
  - TodoWrite
---

# الدستور المعماري للمشاريع (Architectural Constitution)

> هذه المهارة جزء من منظومة **AETHER-ZENITH V63.0-Singularity**.
> الهدف: إجبار الذكاء الاصطناعي (الوكلاء) على التوقف، دراسة قوانين المشروع، والعمل كـ "مهندس معماري" بدلاً من منفذ أعمى.

## 📜 القاعدة الذهبية

لا يُسمح لأي وكيل مستقل بتعديل نظام Enterprise دون وجود وقراءة `PROJECT_CONSTITUTION.md`. إذا لم يكن موجوداً، يجب على الوكيل إنشاؤه بناءً على هذا القالب والموافقة عليه من المستخدم.

## 🚀 بروتوكول التهيئة الأولية (Bootstrap Protocol)

إذا لم يكن الملف `PROJECT_CONSTITUTION.md` موجوداً في جذر المشروع، يجب إنشاء نسخة افتراضية فوراً:

```bash
# bootstrap_constitution.sh
if [ ! -f "PROJECT_CONSTITUTION.md" ]; then
  echo "# 🏛️ الدستور المعماري للمشروع (Project Constitution)" > PROJECT_CONSTITUTION.md
  echo "> **تنبيه:** قراءة هذا الملف إجبارية قبل أي تعديل." >> PROJECT_CONSTITUTION.md
  echo "✅ تم إنشاء PROJECT_CONSTITUTION.md افتراضي"
fi
```

## 🛠️ كيفية إنشاء دستور لمشروع جديد

عند طلب مسح شامل أو تهيئة مشروع، قم بإنشاء ملف `PROJECT_CONSTITUTION.md` في المجلد الجذري للمشروع، وضع فيه الأقسام التالية:

### قالب PROJECT_CONSTITUTION.md

```markdown
# 🏛️ الدستور المعماري للمشروع (Project Constitution)

> **تنبيه لجميع الوكلاء (AI Agents):** قراءة هذا الملف إجبارية قبل إجراء أي تعديل (Mandatory Cognitive Bootstrapping).

## ١. الهوية والمكدس التقني (Identity & Tech Stack)

- **المشروع**: [اسم المشروع، مثلاً: TheSource ERP]
- **الواجهة (Frontend)**: [مثال: React 18, Vite, TailwindCSS]
- **الخلفية (Backend)**: [مثال: Django 4.2, DRF, PostgreSQL]
- **الهدف الأساسي**: [وصف قصير للهدف]

## ٢. قوانين النزاهة المالية والبيانات (Data & Fiscal Integrity)

- **الأرقام (Numbers)**: هل نستخدم `Decimal` أم `Float`؟ (في أنظمة ERP يُمنع الـ Float تماماً).
- **الحذف (Deletion)**: هل يُسمح بـ `Hard Delete` أم يجب استخدام `Soft Delete` (is_active=False)؟
- **تحديثات الحالة (State Updates)**: ممنوع مسح البيانات السابقة بصمت. يجب استخدام الحراس (Guards).

## ٣. قوانين الجماليات والواجهات (Rich Aesthetics & RTL)

- **الاتجاه (Direction)**: هل المشروع RTL؟ إذا نعم، يجب استخدام `margin-inline-start` و ليس `margin-left`.
- **الشبكات (Grids)**: لا تستخدم شبكات ثابتة (`grid-cols-6`). استخدم المتجاوبة (`auto-fit`, `sm:grid-cols-X`).
- **المؤثرات (Effects)**: الالتزام بوجود `Hover effects` و `Micro-animations` لرفع جودة الـ UX.

## ٤. الحدود الأمنية (Security Boundaries)

- **المفاتيح (Secrets)**: ممنوع وضع أي `API_KEY` أو `SECRET` في الكود (Hardcode). استخدم `.env`.
- **البيانات (Data Access)**: هل يوجد Tenant Isolation أو RLS؟ كيف يتم تصفية البيانات؟

## ٥. هندسة المكونات (Component Architecture)

- أين نكتب منطق الأعمال (Business Logic)؟ (مثال: في Django يكون في طبقة `services.py` وليس الـ `Views`).
- في React، افصل الـ Hooks للبيانات عن مكونات العرض (Dumb Components).
```

## 🔍 بروتوكول المحاكاة الذهنية (Mental Sandboxing)

بناءً على الدستور، قبل تعديل أي دالة، اسأل:

1. هل هذا التعديل يخرق بند "النزاهة المالية"؟
2. هل هذا التصميم يخرق بند "الجماليات المتجاوبة"؟
3. هل هذا الاستعلام يخرق "الحدود الأمنية" للـ Tenant؟

---

## 🧪 Test Suite — التحقق من صحة المهارة

```bash
#!/bin/bash
# test_constitution.sh
echo "🔍 فحص الدستور المعماري..."
if [ -f "PROJECT_CONSTITUTION.md" ]; then
  echo "✅ PROJECT_CONSTITUTION.md موجود"
  grep -q "النزاهة المالية" PROJECT_CONSTITUTION.md && echo "✅ يتضمن النزاهة المالية" || echo "⚠️ يحتاج تحديث"
else
  echo "❌ PROJECT_CONSTITUTION.md مفقود (يرجى تشغيل Bootstrap)"
fi
```

---

_Architectural Constitution — 50.0-Singularity Certified._

## 👑 التبعية المركزية الإلزامية (Central Nerve Dependency)

> **تحذير سيادي**: هذه المهارة تابعة بشكل هيكلي ومطلق للمهارة الأم `@[.agents/skills/nexus-core/master.md]`. يُمنع على أي نموذج ذكاء اصطناعي (LLM) أو وكيل تنفيذ أو استخدام هذه المهارة بمعزل عن توجيهات المهارة المركزية العليا. يجب العودة دائماً لدستور `master` قبل اتخاذ أي قرار مصيري.

## 🗺️ التوجيه الجغرافي (GPS Map Protocol)

> **قاعدة أوميغا الصارمة**: عند التعامل مع الأخطاء أو استرجاع السياق، يُمنع استنزاف نافذة التوكنز في قراءة الملفات الضخمة. يجب الاعتماد على `cli.js.map` كمرجع جغرافي (GPS) لفك تشفير الأخطاء وإرشاد أدوات الـ (AST Editing) نحو السطر البرمجي المادي بدقة (Zero-Token Overhead).
