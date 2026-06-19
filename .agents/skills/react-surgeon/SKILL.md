---
name: react-surgeon
description: "تشخيص وإصلاح مشاكل React/Vite — Components, State, Props, Hooks, وأداء الواجهة"
user-invocable: true
when_to_use: "استخدم هذه المهارة عند مواجهة مشاكل React: state لا يتحدث، props مفقودة، مكونات لا تعرض، أو مشاكل أداء."
version: "51.0-Singularity"
flash_compatible: true
allowed-tools:
  - Grep
  - FileRead
  - FileReadLines
  - FileEdit
  - FileWrite
  - SurgicalDiff
  - AstChunkPatch
  - UndoChanges
  - Glob
  - Bash
  - ViewCodeOutline
  - TodoWrite
---

# React Surgeon — تشخيص وإصلاح سيادي للواجهات (V63.0-Omega)

> [!IMPORTANT]
> **قاعدة أوميغا الصارمة:** يُمنع على أي وكيل توليد (State Management) عشوائي أو التلاعب بحالة المكونات بطريقة Prop Drilling. يجب استخدام قالب الـ State Machine الصارم المعرف في `SovereignStateMachine.js` حصرياً لتأمين مسار البيانات.

<!-- FLASH_COMPATIBILITY_MODE -->

<flash_rules>
<rule id="1">عند التشخيص، ابدأ دائماً بخطوة Grep واحدة فقط قبل أي تعديل.</rule>
<rule id="2">لا تُعدّل أكثر من ملف واحد في الخطوة الواحدة.</rule>
<rule id="3">اكتب الإصلاح كامل الدالة/المكون — لا تكتب أجزاء ناقصة.</rule>
<rule id="4">بعد كل تعديل، نفّذ أمر تحقق (build أو test) فوراً.</rule>
<rule id="5">إذا فشل التحقق، تراجع عن التعديل الأخير قبل المحاولة مجدداً.</rule>
<rule id="6">يجب الالتزام ببروتوكول State Machine وتمرير الكود عبر فلتر `SovereignStateMachine.js` لمنع فوضى الواجهات.</rule>
</flash_rules>

<execution_pattern>
<step order="1">اقرأ رسالة الخطأ أو وصف المشكلة بالكامل.</step>
<step order="2">استخدم Grep لتحديد الملف والسطر المعني.</step>
<step order="3">استخدم FileRead لقراءة السياق المحيط (±20 سطر).</step>
<step order="4">أجبر الواجهة على التوافق مع `SovereignStateMachine.js` للحالة المعقدة.</step>
<step order="5">طبّق الإصلاح الجراحي عبر FileEdit.</step>
<step order="6">تحقق بـ `npm run build` أو `npm test`.</step>
</execution_pattern>

## 🚀 بروتوكول التهيئة الأولية (Bootstrap Protocol)

إذا تم استدعاء هذه المهارة في بيئة جديدة، تحقق من توفر ملفات الواجهة الأساسية:

```bash
# bootstrap_react_surgeon.sh
if [ ! -f "package.json" ]; then
  echo "⚠️ ملف package.json مفقود. هل أنت في جذر مشروع React؟"
else
  echo "✅ بيئة React جاهزة للعمل."
fi
if [ ! -d "node_modules" ]; then
  echo "⚠️ المجلد node_modules غير موجود. نوصي بتشغيل npm install أو yarn."
fi
```

## ⚡ فحص الومضة (Flash-Scan Protocol)

عند العمل بنمط **FAST**، نفذ هذا المسح الراداري للواجهة (10 ثوانٍ):

1. **Grep**: ابحث عن استخدامات `console.log` لاستبدالها بـ `ForensicLogger`.
2. **Grep**: ابحث عن مكونات `grid` للتأكد من تناسق الأعمدة.
3. **Grep**: ابحث عن `return null` للتحقق من وجود معالجة لحالة الـ Loading/Error.
4. **Grep**: ابحث عن استدعاءات API وتحقق من مطابقة الحقول مع الـ Backend Contract.

## 🎨 معايير الجماليات الغنية (Rich Aesthetics)

عند إصلاح أو تطوير الواجهة، اتبع:

1. **التميز البصري**: استخدام Gradients و Smooth Transitions و Glassmorphism.
2. **الاستجابة الحية**: hover effects و micro-animations.
3. **الدقة المؤسسية**: دعم RTL الكامل واستخدام الخطوط الاحترافية (Inter/Outfit).

## 🧩 إنفاذ الـ State-Machine

يتم تمرير الكود المولد إجبارياً على:
`vscode-extension/core/templates/SovereignStateMachine.js`
يُحظر على الوكيل ارتجال هياكل تحديث حالة عشوائية قد تتسبب في سباقات (Race Conditions).

---

_React Surgeon — 51.0-Singularity Certified. Rich Aesthetics Enforced._

## 👑 التبعية المركزية الإلزامية (Central Nerve Dependency)

> **تحذير سيادي**: هذه المهارة تابعة بشكل هيكلي ومطلق للمهارة الأم `nexus-core/master.md`. يُمنع على أي نموذج ذكاء اصطناعي (LLM) أو وكيل تنفيذ أو استخدام هذه المهارة بمعزل عن توجيهات المهارة المركزية العليا. يجب العودة دائماً لدستور `master` قبل اتخاذ أي قرار مصيري.

## 🗺️ التوجيه الجغرافي (GPS Map Protocol)

> **قاعدة أوميغا الصارمة**: عند التعامل مع الأخطاء أو استرجاع السياق، يُمنع استنزاف نافذة التوكنز في قراءة الملفات الضخمة. يجب الاعتماد على `cli.js.map` كمرجع جغرافي (GPS) لفك تشفير الأخطاء وإرشاد أدوات الـ (AST Editing) نحو السطر البرمجي المادي بدقة (Zero-Token Overhead).

## 🐝 بروتوكول الأسراب (Swarm Protocol)

هذه المهارة تدعم بروتوكولات الأسراب السيادية (Swarm Protocol) ويمكنها استدعاء أدوات أو وكلاء آخرين في حالات التعقيد الشديدة لضمان اكتمال دورة الإصلاح الذاتي.
