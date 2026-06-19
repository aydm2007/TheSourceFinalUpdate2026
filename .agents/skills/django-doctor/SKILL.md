---
name: django-doctor
description: "تشخيص وإصلاح مشاكل Django — ORM, Views, Migrations, Signals, وأداء الاستعلامات"
user-invocable: true
when_to_use: "استخدم هذه المهارة عند مواجهة مشاكل في Django: تعارض في الـ migrations، أخطاء في الـ ORM مثل N+1، استثناءات 500، أو مشاكل في الـ signals."
version: "51.0-Singularity"
flash_compatible: true
allowed-tools:
  - Grep
  - FileRead
  - FileReadLines
  - FileEdit
  - FileWrite
  - SurgicalDiff
  - Glob
  - Bash
  - ViewCodeOutline
  - ForensicAudit
  - TodoWrite
---

# 🐍 Django Doctor — تشخيص وإصلاح سيادي للخوادم (V63.0-Singularity)

> هذه المهارة جزء من منظومة **AETHER-ZENITH V63.0-Singularity** وتعمل بنمط **Zero-Trust**.

<!-- FLASH_COMPATIBILITY_MODE -->

<flash_rules>
<rule id="1">تأكد دائماً من تنشيط البيئة الوهمية (Virtual Environment) عند تشغيل أوامر `manage.py`.</rule>
<rule id="2">في حال وجود مشاكل Migrations، لا تقم بحذف مجلدات Migrations يدوياً، استخدم `makemigrations --merge` أولاً.</rule>
<rule id="3">ابحث دائماً عن `select_related` و `prefetch_related` عند فحص أداء استعلامات ORM (N+1 queries).</rule>
<rule id="4">لا تُعدّل أكثر من تطبيق (App) واحد في الخطوة الواحدة لتجنب تشتيت السياق.</rule>
</flash_rules>

<execution_pattern>
<step order="1">اقرأ الـ Stacktrace بتركيز كامل لتحديد الملف المعني.</step>
<step order="2">استخدم Grep للبحث عن الدوال والـ Classes المعنية.</step>
<step order="3">تعديل ملفات `models.py` أو `views.py` أو `serializers.py` باستخدام FileEdit.</step>
<step order="4">تشغيل `python manage.py check` للتأكد من سلامة النظام.</step>
</execution_pattern>.

## 🚀 بروتوكول التهيئة الأولية (Bootstrap Protocol)

إذا تم استدعاء هذه المهارة في بيئة جديدة، يجب التحقق من توفر ملفات Django الأساسية أولاً:

```bash
# bootstrap_django_doctor.sh
if [ ! -f "manage.py" ]; then
  echo "⚠️ ملف manage.py مفقود. هل أنت في جذر المشروع الصحيح؟"
  # البحث عن manage.py في المجلدات الفرعية
  find . -name "manage.py" -maxdepth 3
else
  echo "✅ بيئة Django جاهزة للفحص."
fi
```

## ⚡ فحص الومضة (Flash-Scan Protocol)

عند العمل بنمط **FAST**، نفذ هذا المسح الراداري فوراً (10 ثوانٍ):

1. **Grep**: ابحث عن حقول `Decimal` مقابل `FloatField` في `models.py`.
2. **Grep**: ابحث عن استخدامات `.pop()` في `serializers.py` و `views.py`.
3. **Grep**: ابحث عن استعلامات `N+1` عبر نمط `for.*objects.all()`.
4. **Bash**: تشغيل `python manage.py check` للتأكد من سلامة الهيكل.

## 🚀 منهجية الحل العميق (Deep-Solve Methodology)

عند التعامل مع Backend Django في مشروع مؤسسي، اتبع:

1. **التشخيص الجنائي (Forensic Scan)**: تتبع البيانات من الـ Serializer إلى الـ Ledger.
2. **الإحلال التدريجي (Strangler Fig)**: لا تحذف القديم، بل ابنِ الظل (Shadow Service) أولاً.
3. **النزاهة المالية**: التدقيق في حقول `Decimal` وعمليات الـ `Round`.

```
Grep(pattern: "class.*Model", glob: "*.py", output_mode: "content")
‖ Grep(pattern: "class.*View", glob: "*.py", output_mode: "files_with_matches")
‖ Glob(pattern: "**/models.py")
‖ Glob(pattern: "**/views.py")
‖ Glob(pattern: "**/urls.py")
```

## 🔬 بروتوكول الجراحة البرمجية (Surgical Protocol V45.0)

يُمنع منعاً باتاً استخدام `FileEdit` مباشرة في ملفات الـ `Backend` الحساسة دون إجراء محاكاة جراحية أولاً باستخدام المحرك الجراحي لضمان سلامة الـ AST.

**خوارزمية التنفيذ (Telemetry-Driven Execution):**

1. **الاستهداف الجغرافي (Trace-Grounding)**: قبل أي تعديل، إذا كان هناك خطأ (Exception/Traceback)، يُمنع التخمين. اعتمد على سجلات Stderr ومحرك `repair-loop.js` لمعرفة السطر المادي الدقيق للانهيار.
2. **المحاكاة**: قم بتشغيل `PythonSurgicalEngine` عبر الـ `DeepCoordinator` لتوجيه التعديل نحو العقدة المحددة بدقة بناءً على الإحداثية.
3. **تحليل النطاق**: تحقق من الـ `Blast Radius`؛ إذا كان المخاطرة > 0.8، توقف واطلب مناظرة أسراب.
4. **التنفيذ**: بعد الموافقة، قم بتطبيق التعديل الفعلي والتحقق باختبار فيزيائي.

```bash
# مثال لاستخدام المنسق العميق لجراحة موديول بايثون
node core/services/surgical_engine/DeepCoordinator.js \
  "إصلاح منطق حساب الضرائب في الفاتورة" \
  "backend/smart_agri/services/invoice.py" \
  "InvoiceService" \
  "calculate_tax" \
  "def calculate_tax(self): return self.total * Decimal('0.15')"
```

## ٢. فحص النماذج

```
Grep(pattern: "ForeignKey|ManyToMany|OneToOne", glob: "models.py", output_mode: "content", -C: 2)
Grep(pattern: "select_related|prefetch_related", glob: "*.py", output_mode: "content")
Grep(pattern: "\\.all\\(\\)", glob: "*.py", output_mode: "content") → خطر N+1
Grep(pattern: "Decimal|FloatField", glob: "models.py", output_mode: "content") → دقة مالية
```

## ٣. فحص Migrations

```
Bash(command: "python manage.py showmigrations --plan | head -50", description: "Show migration status")
```

## ٤. أنماط الإصلاح

### مشكلة N+1 (الأكثر شيوعاً)

```python
# ❌ خطأ — استعلام لكل سجل
for activity in Activity.objects.all():
    print(activity.task.name)  # SELECT * FROM task WHERE id=...

# ✅ إصلاح — join في استعلام واحد
for activity in Activity.objects.select_related('task').all():
    print(activity.task.name)  # لا استعلام إضافي

# الكشف: Grep(pattern: "for.*objects\\.all", glob: "*.py", output_mode: "content", -A: 3)
```

### مشكلة pop() (فقدان بيانات بين الطبقات)

```python
# ❌ خطأ
product_id = data.pop('product_id', None)  # تُحذف!

# ✅ إصلاح
product_id = data.get('product_id')  # تبقى

# الكشف: Grep(pattern: "\\.pop\\(", glob: "*.py", output_mode: "content", -C: 3)
```

### مشكلة Decimal (دقة مالية)

```python
# ❌ خطأ
total = float(quantity) * float(price)

# ✅ إصلاح
total = Decimal(str(quantity)) * Decimal(str(price))

# الكشف: Grep(pattern: "float\\(.*\\) \\*|round\\(", glob: "*.py", output_mode: "content")
```

### مشكلة Signals (آثار جانبية خفية)

```
Grep(pattern: "post_save|pre_save|post_delete|receiver", glob: "*.py", output_mode: "content", -C: 5)
→ راجع كل signal وتأكد من عدم تسببه في سلوك غير متوقع
```

## ٥. DRF Serializers (الأكثر مشاكلاً)

```python
# ❌ خطأ — Serializer يحذف حقول أثناء التحويل
class ActivitySerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        well_id = validated_data.pop('well_asset_id')  # ← تُحذف!

# ✅ إصلاح — استخدم get أو أضف write_only field
class ActivitySerializer(serializers.ModelSerializer):
    well_asset_id = serializers.IntegerField(write_only=True, required=False)

# الكشف:
# Grep(pattern: "validated_data\\.pop|validated_data\\.get", glob: "serializers.py", output_mode: "content", -C: 5)
# Grep(pattern: "class.*Serializer", glob: "*.py", output_mode: "content", -C: 3)
```

### فحص Permissions & Authentication

```
Grep(pattern: "permission_classes|IsAuthenticated|AllowAny", glob: "views*.py", output_mode: "content", -C: 2)
‖ Grep(pattern: "authentication_classes|TokenAuthentication|SessionAuthentication", glob: "views*.py", output_mode: "content")
```

## ٦. Custom QuerySets & Managers

```python
# الكشف:
# Grep(pattern: "class.*Manager|class.*QuerySet", glob: "*.py", output_mode: "content", -C: 5)
# → تأكد من تطبيق RLS (Row Level Security) في كل Manager
# → تأكد من عدم تجاوز get_queryset في Views بدون فلتر farm
```

## ٧. التحقق

```
Bash(command: "python manage.py test --verbosity 2", description: "Run Django tests", timeout: 120000)
Bash(command: "python manage.py check --deploy", description: "Django deployment checks")
```

## ٨. أنماط مضادة للهلوسة (Anti-Hallucination Patterns)

### مشكلة Aggregation-Without-Payload (تجميع البيانات دون إرسالها)

```python
# ❌ خطأ — حساب القيمة في قاعدة البيانات لكن نسيان تضمينها في الاستجابة (API Response)
metrics = queryset.aggregate(
    total_sales=Coalesce(Sum('amount'), Value(0)),  # ← تُحسب هنا
)
response_payload = {
    'summary': {
        'total_orders': metrics['total_orders'],
        # total_sales لم تُضف! ← هلوسة ناتجة عن النسيان
    }
}

# ✅ إصلاح — المطابقة الصارمة بين الـ Aggregate والـ Payload
response_payload = {
    'summary': {
        'total_orders': metrics['total_orders'],
        'total_sales': metrics['total_sales'],  # ← مطابقة 1:1
    }
}

# الكشف: قارن دائماً مفاتيح .aggregate() مع المفاتيح المُرجعة في الـ Serializer/Response
```

### مشكلة Silent None Overwrite (الكتابة الفوقية الصامتة في الحلقات)

```python
# ❌ خطأ — الحلقة تكتب None أو قيمة فارغة فوق قيمة صالحة تم جمعها مسبقاً
for item in items_list:
    if item.type == "specific_type":
        data["important_field"] = item.payload.get("value")  # ← يمسح القيمة السابقة إذا كان None!

# ✅ إصلاح — استخدام الحراس (Guards) قبل تحديث القاموس
for item in items_list:
    if item.type == "specific_type":
        extracted_value = item.payload.get("value")
        if extracted_value is not None:  # ← حماية البيانات السابقة
            data["important_field"] = extracted_value

# الكشف: راجع أي حلقة for تقوم بتحديث dictionary بناءً على .get()
```

### مشكلة Unchecked ServiceResult (تجاهل نتائج طبقة الخدمة)

```python
# ❌ خطأ — استدعاء خدمة مُعقدة دون التحقق من نجاحها
UserService.process_payment(user, data)  # ← قد تفشل بصمت وتُرجع ServiceResult.fail!

# ✅ إصلاح — فحص النتيجة وتسجيلها أو رمي خطأ
result = UserService.process_payment(user, data)
if not result.success:
    logger.error(f"Payment failed: {result.message}")
    # التعامل مع الخطأ بشكل مناسب

# الكشف: راجع استدعاءات الخدمات (Services) وتأكد من التقاط الـ Return Value
```

### مشكلة Duplicate Aggregation (الهدر بتكرار التجميع)

```python
# ❌ خطأ — تجميع نفس الحقل مرتين بأسماء مختلفة بسبب سوء التخطيط
metrics = queryset.aggregate(
    total_revenue=Sum('amount'),
    gross_income=Sum('amount'),  # ← مكرر ويهدر موارد قاعدة البيانات!
)

# ✅ إصلاح — تجميع مرة واحدة، وإعادة التوجيه في الكود
metrics = queryset.aggregate(
    total_revenue=Sum('amount'),
)
summary['gross_income'] = metrics['total_revenue']  # ← إعادة استخدام
```

---

## 💎 ٩. إرشادات الاستدلال وتشخيص النسخ للمشاريع الكبرى (GRP Enterprise-Grade Guidelines)

تطبيقاً للمواد السيادية في `master.md` ولضمان موثوقية 100% في البيئات الإنتاجية الضخمة، يُلزم الوكيل باتباع الضوابط الصارمة التالية أثناء تشخيص الأكواد وتوليد السكربتات:

### ٩.١ بروتوكول التوافقية العابرة لأنظمة التشغيل (OS-Agnostic Execution)

- **القاعدة**: يُمنع منعاً باتاً استخدام أوامر نظام التشغيل المباشرة مثل `&&` أو `rm` أو `cp` أو مسارات الملفات ذات النطاق الحصري (مثل الرموز المخصصة للـ PowerShell أو Bash) داخل ملفات البايثون أو الواجهة.
- **التنفيذ**: يجب استخدام **`pathlib.Path`** حصرياً للتحكم بالملفات والمسارات، واستخدام مكتبات بايثون المدمجة (`shutil`, `os`) لإجراء أي عمليات نقل أو حذف للأصول التقنية لضمان عمل السكربتات في بيئات Windows و Linux و Docker بنفس الدرجة من الحتمية والنزاهة.

```python
# ❌ مرفوض (تعتمد على نظام التشغيل)
os.system("rm -rf tmp && mkdir tmp")

# ✅ متوافق (محايد ومضمون 100%)
import shutil
from pathlib import Path
tmp_path = Path("tmp")
if tmp_path.exists():
    shutil.rmtree(tmp_path)
tmp_path.mkdir(parents=True, exist_ok=True)
```

### ٩.٢ عزل وتدقيق استعلامات الباكيند (SQL Query Latency Thresholds)

- **القاعدة**: أي استعلام يتم إضافته أو تعديله يجب ألا يتجاوز حد تنفيذي أقصى وقدره **100ms** تحت ظروف التحميل الكامل.
- **التنفيذ**: يُحظر تماماً كتابة استعلامات مجمعة باستخدام الحلقات التكرارية العمياء. يجب استخدام `select_related` و `prefetch_related` لضمان استرجاع كافة الكيانات المرتبطة دفعة واحدة، مع إجبارية تصفية البيانات المرتجعة بناءً على المزارع الفعالة لمنع التسريب المعماري للبيانات.

### ٩.٣ بروتوكول التراجع الآمن الخالي من التوقف (Zero-Downtime Rollback & Database Safeguard)

- **القاعدة**: قبل تشغيل أي عملية هجرة (Migration) لقاعدة بيانات كبرى، يجب تحديد آلية واضحة وموثقة للرجوع عنها تلقائياً في حالة الفشل دون التسبب في انقطاع الخدمة (Zero-Downtime).
- **التنفيذ**:
  1. كتابة دالة `database_rollback` في حالة فشل الهجرات الحية.
  2. أخذ نسخة احتياطية مصغرة تلقائية من الجداول الحساسة (مثل `Activity`, `AccountLedger`) في الذاكرة الباردة قبل تشغيل الهجرة.
  3. التحقق التلقائي من توافق الجداول بعد إتمام العملية عبر فاحص الصحة الهيكلية.

### ٩.٤ منع تعارض الوكلاء متعددي العوامل (Multi-Agent Swarm Lock Protocol)

- **القاعدة**: يلتزم الوكيل بالتحقق من توافق الحالات وتنسيق التخاطر لتجنب حدوث Race Conditions على الملفات الحيوية.
- **التنفيذ**: يتم تسجيل حالة القفل لملفات التكوين البنيوية داخل `bridge.json` أثناء تعديل الميزات المركزية، ويُمنع أي وكيلين من الوصول المتزامن للملف نفسه إلا بعد فك القفل لضمان النزاهة الهيكلية للفرع البرمجي.

---

## 🧪 Test Suite — التحقق من صحة المهارة

```bash
#!/bin/bash
# test_django_doctor.sh
echo "🔍 فحص بيئة Django Doctor..."
python --version > /dev/null 2>&1 && echo "✅ Python متوفر" || echo "❌ Python غير متوفر"
if [ -f "manage.py" ]; then
  python manage.py check > /dev/null 2>&1 && echo "✅ Django Check ناجح" || echo "⚠️ يوجد أخطاء هيكلية"
else
  echo "⚠️ لا يوجد manage.py في المسار الحالي"
fi
```

---

_Django Doctor — 15.0-Apex Certified. Zero-Trust Enabled._

## 👑 التبعية المركزية الإلزامية (Central Nerve Dependency)

> **تحذير سيادي**: هذه المهارة تابعة بشكل هيكلي ومطلق للمهارة الأم `@[.agents/skills/nexus-core/master.md]`. يُمنع على أي نموذج ذكاء اصطناعي (LLM) أو وكيل تنفيذ أو استخدام هذه المهارة بمعزل عن توجيهات المهارة المركزية العليا. يجب العودة دائماً لدستور `master` قبل اتخاذ أي قرار مصيري.

## 🗺️ التوجيه الجغرافي (GPS Map Protocol)

> **قاعدة أوميغا الصارمة**: عند التعامل مع الأخطاء أو استرجاع السياق، يُمنع استنزاف نافذة التوكنز في قراءة الملفات الضخمة. يجب الاعتماد على `cli.js.map` كمرجع جغرافي (GPS) لفك تشفير الأخطاء وإرشاد أدوات الـ (AST Editing) نحو السطر البرمجي المادي بدقة (Zero-Token Overhead).
