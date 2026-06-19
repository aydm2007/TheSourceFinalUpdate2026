---
name: react-surgeon
description: "تشخيص وإصلاح مشاكل React/Vite — Components, State, Props, Hooks, وأداء الواجهة"
user-invocable: true
when_to_use: "استخدم هذه المهارة عند مواجهة مشاكل React: state لا يتحدث، props مفقودة، مكونات لا تعرض، أو مشاكل أداء."
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

# React Surgeon — تشخيص وإصلاح سيادي للواجهات (Rich Aesthetics)

> هذه المهارة جزء من منظومة **AETHER-ZENITH V15.0-Apex** وتعمل داخل **بيئة Antigravity (Google)**.
> 🔗 المرجع الأعلى: @[.agents/skills/nexus-core/master.md]
> ⚡ وضع المحرك: **Flash-Ready** (متوافق مع DecisionEngine V15.0)
> 📌 للتفعيل الكامل: أشِر إلى المهارة الرئيسية `@[.agents/skills/nexus-core/master.md]`

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

3. حالات الـ Error Boundaries لمنع انهيار الواجهة بالكامل.

## 🧠 نسيج المنطق (Logic Weaving Pattern)
لرفع جودة المكونات، يجب فصل المنطق عن العرض:
1. **Dumb Components**: المكون يركز فقط على الـ JSX والـ Styling.
2. **Logic Hooks**: استخراج الـ `buildPayload`, `validations`, و `data processing` إلى ملف مستقل (مثل `useFormLogic.js`).
3. **Truth Flow**: تتبع البيانات من الـ Hook إلى الـ Component.

## ⚖️ التدقيق الجنائي (Forensic Audit)
استبدل `console.log` بنظام `ForensicLogger`:
- `logger.truth()`: لتتبع تحولات البيانات الهامة.
- `logger.audit()`: لفحص العمليات المالية أو الحساسة.
- `logger.error()`: لتسجيل الأعطال مع السياق الجنائي الكامل.
```
Grep(pattern: "ComponentName", glob: "*.{jsx,tsx}", output_mode: "content", -C: 3)
‖ Grep(pattern: "useState|useEffect|useCallback", glob: "*.{jsx,tsx}", output_mode: "content")
‖ Grep(pattern: "props\\.", glob: "*.{jsx,tsx}", output_mode: "content")
‖ Glob(pattern: "**/components/**/*.jsx")
```

## 🔬 بروتوكول الجراحة البرمجية (Surgical Protocol V15.0)
يُمنع منعاً باتاً استخدام `FileEdit` مباشرة في مكونات React أو ملفات الـ JS الحساسة دون إجراء محاكاة جراحية أولاً باستخدام المحرك الجراحي لضمان سلامة الـ AST.

**خوارزمية التنفيذ (Map-Driven Execution):**
1. **الاستهداف الجغرافي (Map-Grounding)**: قبل أي تعديل، إذا كان هناك خطأ Stderr، استخدم `cli.js.map` لفك التشفير العكسي ومعرفة السطر المادي الدقيق.
2. **المحاكاة**: قم بتشغيل `JSSurgicalEngine` عبر الـ `DeepCoordinator` لتوجيه `astAutoPatch.js` نحو العقدة البرمجية المحددة بالسطر (L) والعمود (C).
3. **تحليل النطاق**: تحقق من الـ `Blast Radius`؛ إذا كان المخاطرة > 0.7، توقف واطلب مناظرة أسراب.
4. **التنفيذ**: بعد الموافقة، قم بتطبيق التعديل الفعلي والتحقق باختبار فيزيائي.

```bash
# مثال لاستخدام المنسق العميق لجراحة مكون React
node core/services/surgical_engine/DeepCoordinator.js \
  "إضافة تأثير زجاجي لبطاقة الخدمة" \
  "frontend/src/components/ServiceCard.jsx" \
  "ServiceCard" \
  "render" \
  "return <div className='glass-effect'>{/* ... content */}</div>"
```

## ٢. تحليل سلسلة البيانات
```
Parent → Props → Child → State → Render

أدوات التتبع:
1. Grep: ابحث عن اسم المكون الذي لا يعرض
2. FileRead: اقرأ المكون الأب (الذي يمرر props)
3. FileRead: اقرأ المكون الابن (الذي يستقبل)
4. حدد أين ينقطع التدفق
```

## ٣. أنماط الإصلاح

### مكون يرجع null (Draft Injection Pattern)
```javascript
// ❌ خطأ — يرجع null ولا يعرض شيء
if (!data) return null;

// ✅ إصلاح — يعرض حالة افتراضية
const effectiveData = data || { items: [], status: 'draft' };

// الكشف: Grep(pattern: "return null", glob: "*.jsx", output_mode: "content", -B: 3)
```

### State لا يتحدث (Immutability)
```javascript
// ❌ خطأ — mutation مباشر
state.items.push(newItem);
setState(state);

// ✅ إصلاح — نسخة جديدة
setState(prev => ({ ...prev, items: [...prev.items, newItem] }));

// الكشف: Grep(pattern: "\\.push\\(|splice\\(", glob: "*.jsx", output_mode: "content", -C: 3)
```

### Name Resolution (IDs → أسماء)
```javascript
// ❌ خطأ — عرض رقم بدل اسم
<span>{item.well_asset_id}</span>

// ✅ إصلاح — lookup
const well = lookups.assets?.find(a => String(a.id) === String(item.well_asset_id));
<span>{well?.name || 'غير محدد'}</span>

// الكشف: Grep(pattern: "\\{.*_id\\}", glob: "*.jsx", output_mode: "content")
```

## ٤. فحص RTL
```
Grep(pattern: "margin-left|padding-left|text-align: left|float: left", glob: "*.{css,jsx,tsx}", output_mode: "content")
→ يجب تغييرها لـ: margin-inline-start, padding-inline-start, text-align: start
```

## ٥. فحص الأداء
```
Grep(pattern: "useEffect\\(\\(\\) =>", glob: "*.jsx", output_mode: "content", -A: 5)
→ تأكد من وجود dependency array: useEffect(() => {...}, [deps])
→ useEffect بدون [] = يعمل كل render!
```

## ٦. React Router Issues
```
Grep(pattern: "useNavigate|useParams|useLocation|Navigate|Route", glob: "*.{jsx,tsx}", output_mode: "content", -C: 3)
→ تأكد من:
  - useParams يستخرج المعاملات الصحيحة
  - Navigate يحمي الصفحات المؤمّنة
  - Route path لا يحتوي أخطاء إملائية
```

## ٧. Context API & State Management
```
Grep(pattern: "createContext|useContext|Provider", glob: "*.{jsx,tsx}", output_mode: "content", -C: 5)
→ مشاكل شائعة:
  - Provider يلف التطبيق بدون قيمة افتراضية
  - useContext بدون Provider parent = undefined
  - Context يُعاد render لكل تغيير (يحتاج useMemo)
```

## ٨. Error Boundaries
```
Grep(pattern: "componentDidCatch|ErrorBoundary|error-boundary", glob: "*.{jsx,tsx}", output_mode: "content")
→ إذا لا يوجد Error Boundary = أي خطأ يُسقط كل التطبيق
```

## ٩. التحقق
```
Bash(command: "npm run build 2>&1 | tail -20", description: "Check build for errors")
Bash(command: "npm test -- --watchAll=false", description: "Run React tests", timeout: 60000)
```

## ١٠. أنماط مضادة للهلوسة (Anti-Hallucination Patterns)

### مشكلة Grid Count Mismatch (عدم تطابق عدد الأعمدة)
```javascript
// ❌ خطأ — 7 بطاقات في شبكة 6 أعمدة = بطاقة يتيمة
<div className="grid md:grid-cols-6 gap-3">
  {/* 7 children */}
</div>

// ✅ إصلاح — شبكة متجاوبة تتكيف مع عدد العناصر
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
  {/* أي عدد */}
</div>

// الكشف: عند إضافة MetricCard جديد:
// 1. عدّ العناصر الأبناء
// 2. قارنها مع grid-cols-N
// 3. اختر responsive breakpoints مناسبة
```

### مشكلة Phantom API Field (حقل API وهمي)
```javascript
// ❌ خطأ — الواجهة تقرأ حقلاً تتخيله ولا يرسله الـ Backend
value={userProfile?.settings?.receive_marketing_emails}  // ← قد لا يكون موجوداً في الاستجابة!

// ✅ إصلاح — تأكد من وجود الحقل في استجابة الـ API أولاً
// الخطوات:
// 1. استخدم FileRead أو Grep للبحث عن الحقل في ملفات الـ Backend (مثل serializers أو views).
// 2. إذا كان الحقل يُحسب داخلياً (مثلاً في aggregate) ولكنه لا يمرر للـ JSON Response → هذه هلوسة!
// 3. أضفه للـ payload في الـ Backend أولاً، أو احذفه من الواجهة إذا لم تكن تحتاجه.

// القاعدة الذهبية: لا تفترض وجود حقل بناءً على المنطق فقط؛ تأكد من العقد (Contract) بين الواجهة والخلفية.
```

---

## 🧪 Test Suite — التحقق من صحة المهارة

```bash
#!/bin/bash
# test_react_surgeon.sh
echo "🔍 فحص بيئة React Surgeon..."
command -v npm >/dev/null 2>&1 && echo "✅ npm متاح" || echo "❌ npm غير متاح"
if [ -f "package.json" ]; then
  grep -q "react" package.json && echo "✅ مشروع React سليم" || echo "⚠️ قد لا يكون هذا مشروع React"
else
  echo "⚠️ لا يوجد package.json في المسار الحالي"
fi
```

---
*React Surgeon — 15.0-Apex Certified. Rich Aesthetics Enforced.*

