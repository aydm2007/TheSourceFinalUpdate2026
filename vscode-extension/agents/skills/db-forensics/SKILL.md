---
name: db-forensics
description: "تحليل جنائي لقواعد البيانات — كشف التناقضات، فحص الأداء، وتتبع البيانات المفقودة"
user-invocable: true
when_to_use: "استخدم هذه المهارة عند فقدان بيانات، تناقض بين الجداول، بطء استعلامات، أو مشاكل migrations."
version: 15.0-Apex
---

# DB Forensics — تحليل جنائي سيادي لقواعد البيانات
# Identity: Aether-Prime | Specialist: Claude-Ops 4.6

> هذه المهارة جزء من منظومة **AETHER-ZENITH V15.0-Apex** وتعمل بنمط **Zero-Trust**.
> 📌 للتفعيل الكامل: استدعاء الأداة المباشرة `ForensicFusion`.

## 🚀 بروتوكول التهيئة الأولية (Bootstrap Protocol)
عند الاستدعاء في مشروع جديد، يجب تجهيز تقرير الفحص الأمني:

```bash
# bootstrap_db_forensics.sh
if [ ! -f "db_forensics_report.md" ]; then
  echo "# 🔍 تقرير التحليل الجنائي (Aether-Zenith)" > db_forensics_report.md
  echo "| الجدول | المشكلة | السجلات | التوصية |" >> db_forensics_report.md
  echo "|--------|---------|---------|---------|" >> db_forensics_report.md
  echo "✅ تم تهيئة ملف db_forensics_report.md"
fi
```

## 💰 بروتوكول النزاهة المالية (Financial Integrity Protocol)

عند فحص البيانات المالية، التزم بـ:
1. **تتبع دفتر الأستاذ (Ledger Tracking)**: التأكد من أن كل عملية (`Activity`) لها انعكاس صحيح في الجداول المالية.
2. **كشف الأيتام (Orphan Discovery)**: البحث عن سجلات مرتبطة بكيانات محذوفة أو مفقودة.
3. **تدقيق الـ Decimal**: منع استخدام الـ `float` في العمليات الحسابية الحساسة لضمان دقة السنتات.

## ١. كشف هيكل قاعدة البيانات (بالتوازي)
```
Grep(pattern: "class.*models\\.Model", glob: "models.py", output_mode: "content", -C: 5)
‖ Grep(pattern: "db_table|managed\\s*=", glob: "models.py", output_mode: "content")
‖ Glob(pattern: "**/migrations/*.py")
‖ Bash(command: "python manage.py showmigrations --plan | head -30", description: "Migration status")
```

## ٢. تتبع البيانات المفقودة (Lost Data Tracing)

```
سلسلة التتبع:
Frontend Form → API Request → View/Serializer → Service → Model.save() → DB

خطوات التتبع بالأدوات:
1. Grep(pattern: "field_name", output_mode: "content", -C: 5) → أين يُذكر الحقل؟
2. FileRead(service_file, offset, limit) → اقرأ الـ Service layer
3. Grep(pattern: "\\.pop\\(", glob: "*.py", output_mode: "content", -C: 3) → هل يُحذف؟
4. Grep(pattern: "normalize|alias", glob: "*.py", output_mode: "content") → هل يُحوَّل؟
5. FileRead(model_file) → هل الحقل موجود في النموذج؟
6. Bash(command: "python manage.py sqlmigrate app migration") → هل الحقل في الجدول؟
```

## ٣. أنماط المشاكل الشائعة

### بيانات تختفي بين الطبقات
```python
# ❌ المشكلة: pop() يحذف البيانات
product_id = data.pop('product_id')  # ← تُحذف من data!

# ✅ الحل: get() يقرأ بدون حذف
product_id = data.get('product_id')  # ← تبقى في data

# الكشف:
# Grep(pattern: "\\.pop\\(['\"]", glob: "*.py", output_mode: "content", -C: 3)
```

### N+1 Query Problem
```python
# ❌ بطيء — استعلام لكل سجل
for activity in Activity.objects.all():
    print(activity.task.name)

# ✅ سريع — join واحد
for activity in Activity.objects.select_related('task', 'well_asset').all():
    print(activity.task.name)

# الكشف:
# Grep(pattern: "for.*objects\\.all|objects\\.filter.*for", glob: "*.py", output_mode: "content", -A: 5)
```

## ٤. كشف التناقضات
```
Bash(command: "python manage.py shell -c \"
from core.models import Activity, ActivityIrrigation
orphans = ActivityIrrigation.objects.exclude(activity__in=Activity.objects.all())
print(f'Orphaned records: {orphans.count()}')
\"", description: "Check orphaned records")

Bash(command: "python manage.py shell -c \"
from core.models import Activity
null_wells = Activity.objects.filter(well_asset_id__isnull=True, task__is_irrigation_task=True)
print(f'Irrigation without well: {null_wells.count()}')
\"", description: "Check data integrity")
```

## ٥. كشف تعارضات الـ Migrations
```
Grep(pattern: "dependencies = \\[", glob: "**/migrations/*.py", output_mode: "content", -A: 3)
→ ابحث عن migration يعتمد على نفس الـ parent (conflict)

Bash(command: "python manage.py showmigrations --plan 2>&1 | grep '\\[ \\]'", description: "Unapplied migrations")
Bash(command: "python manage.py migrate --check 2>&1", description: "Check migration state", timeout: 30000)
```

## ٦. تحليل الفهارس (Indexes)
```
Grep(pattern: "db_index=True|Index\\(|unique_together|UniqueConstraint", glob: "models*.py", output_mode: "content", -C: 2)
→ تأكد من:
  - كل ForeignKey مفهرس (Django يفعل هذا تلقائياً)
  - الحقول المستخدمة في filter() لها index
  - لا يوجد فهارس مكررة (duplicate indexes)
```

## ٧. التقرير
```
FileWrite(file_path: "db_forensics_report.md", content: ...)
```

نموذج:
```markdown
# 🔍 تقرير التحليل الجنائي
| الجدول | المشكلة | السجلات | التوصية |
|--------|---------|---------|---------| 
| activity | well_asset_id NULL | 23 | مزامنة |
| harvest | product_id NULL | 5 | تعبئة |
```

---

## 💎 ٨. حوكمة الاستعلامات والنسخ الاحتياطي للمؤسسات الكبرى (GRP DB Governance)

تعزيزاً لمعايير الدستور المحاسبي والنزاهة المطلقة للبيانات، يتم فرض الضوابط التشغيلية التالية على كافة تعاملات الجداول والـ SQL:

### ٨.١ مؤشرات كفاءة الاستعلامات المباشرة (SQL Performance KPI)
*   **القاعدة**: يُحظر كلياً إطلاق أي استعلام مباشر أو مركب يتجاوز حاجز **100ms** أثناء فحص أو تصفية جداول دفتر الأستاذ أو المخازن.
*   **التدقيق**: يُلزم الوكيل باستخدام الكشافات الفعالة لـ `farm_id` و `timestamp` و `is_posted` في جميع عمليات الـ SELECT للتخلص من عمليات Full Table Scan التي تبطئ الخادم في قواعد البيانات المليونية.

### ٨.٢ بروتوكول التراجع والنسخ الاحتياطي التلقائي (Auto-Backups & Safe Rollback)
*   **القاعدة**: أي عملية هيكلية لتعديل القيود المالية أو دمج الجداول يجب أن تكون مسبوقة بأخذ لقطة سريعة للبيانات (Data Snapshot) وحفظها محلياً في الذاكرة المؤقتة.
*   **التنفيذ**: في حالة انكسار أي قيد تشغيلي أثناء التحديث، يتم عكس الهجرة فوراً واستعادة السجل المحفوظ تلقائياً لضمان عودة الخادم للعمل بنسبة 100% دون أي فترات توقف (Zero-Downtime Rollback).

---

## 🧪 Test Suite — التحقق من صحة المهارة

```bash
#!/bin/bash
# test_db_forensics.sh
echo "🔍 فحص بيئة DB Forensics..."
if [ -f "manage.py" ]; then
  python manage.py showmigrations > /dev/null 2>&1 && echo "✅ قاعدة البيانات متصلة وجاهزة للتحليل" || echo "❌ فشل الاتصال بقاعدة البيانات"
else
  echo "⚠️ لا يوجد manage.py في المسار (قد تحتاج لتشغيله في مسار الباكيند)"
fi
```

---
*DB Forensics — 15.0-Apex Certified. Zero-Trust Enabled.*


