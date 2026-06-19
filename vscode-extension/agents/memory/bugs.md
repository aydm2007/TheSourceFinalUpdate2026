# 🐛 الأخطاء الشائعة وحلولها

## [2026-05-14] [AgriAsset Migration Parity Failure]
- **المشكلة**: فشل إنشاء قاعدة بيانات الاختبار بسبب `ProgrammingError: column "content_type_id" does not exist`.
- **السبب العلمي**: استخدام `SeparateDatabaseAndState` مع `RunSQL` يدوياً لإضافة أعمدة `ForeignKey` دون إضافة لاحقة `_id` (مثلاً إضافة `content_type` بدلاً من `content_type_id`).
- **الحل الذري**: تصحيح ملفات الهجرة التاريخية لضمان تطابق أسماء الأعمدة في SQL مع توقعات ORM.
- **الملفات المتأثرة**: `core/migrations/0115, 0124, 0129, 0144, 0156`.

## [2026-05-14] [RLS Table Name Typo]
- **المشكلة**: فشل هجرة RLS بسبب عدم وجود الجدول `core_biologicalasset_cohort`.
- **السبب العلمي**: خطأ إملائي في استعلام SQL (زيادة underscore) لا يطابق اسم الجدول الفعلي في Django (`core_biologicalassetcohort`).
- **الحل الذري**: توحيد المسميات في كافة عمليات `ENABLE/FORCE RLS`.
- **الملفات المتأثرة**: `core/migrations/0065`.

## 2026-05-12 — خطأ FieldSmartCard ImportError
- **المشكلة**: محاولة استدعاء Model باسم `FieldSmartCard` (وهمي) في سكربت الاختبار.
- **السبب**: هلوسة في استنتاج أسماء الـ Models دون قراءة `models.py`.
- **الحل**: قراءة `sdui_schema.py` والتصحيح إلى `SmartCardSchema` و `FormFieldSchema`.
- **الدرس**: **تحقق من أسماء الـ Models فعلياً عبر قراءة الملف قبل كتابة الاختبارات الذرية.**

<!-- APPEND -->

## 2026-05-12 — خطأ ETIMEDOUT في وكلاء السرب المتوازي (حرج 🟡)
- **السياق**: أثناء التدقيق الجنائي على `AgriAsset` باستخدام السرب (4 وكلاء).
- **الخطأ**: `SiliconFlow: Request timed out` بعد 30 ثانية من الانتظار لعمق التحليل (مجلد `backend/`).
- **المشكلة**: الاعتماد المفرط على الوكلاء في مهام البحث العميق (Deep Glob/Grep) يؤدي إلى كسر الاتصال السحابي.
- **الحل التكتيكي**: استخدام أدوات `TheSource` المحلية مثل `ForensicAudit` و `list_dir` لتحقيق "الصدى الجنائي" المباشر بدون LLM.
- **الدرس**: **لا تجعل المهام الحرجة تتوقف على انتظار استجابة LLM إذا كانت الأدوات المحلية تستطيع التحقق من الحقيقة (Zero-Trust).**
- **الحالة**: ✅ تم الاستمرار والتصحيح التكتيكي.

## 2026-05-12 — خطأ اسم الجدول في local_database.dart (حرج 🔴)
- **الملف**: `lib/agriasset_core/database/local_database.dart:L632`
- **المشكلة**: اسم الجدول كُتب خطأً كـ `'local_crop_varietyMap(v)'` (تضمين اسم الدالة في النص)
- **الخطأ**: كان سيُسبّب `DatabaseException: no such table: local_crop_varietyMap(v)` في runtime
- **الحل**: تصحيح إلى `'local_crop_varieties'` — اسم الجدول الصحيح
- **الدرس**: **لا تستخدم String Interpolation في أسماء الجداول — تحقق دائماً من اسم الجدول بـ `PRAGMA table_info`**
- **الحالة**: ✅ تم الإصلاح

## 2026-05-12 — default: في switch(SyncStatus) يُخفي Enum drift
- **الملفات**: `kitchen_stock_cubit.dart`, `kitchen_daily_report_cubit.dart`, `weekly_irrigation_cubit.dart`, `container_return_cubit.dart`
- **المشكلة**: استخدام `default:` في `switch(SyncStatus)` يمنع المترجم من إنتاج تحذير عند إضافة قيم جديدة للـ Enum → ثغرة صامتة في offline-first
- **الحل**: استبدال كل `default:` بـ cases صريحة ومُستنفِدة لكل قيمة Enum
- **النمط الصحيح**: `switch(status) { case SyncStatus.X: return '...'; ... }` — بدون `default:` إطلاقاً
- **التحقق**: `dart analyze` → 0 issues
- **الحالة**: ✅ تم الإصلاح


## 2026-05-08 — N+1 مزدوج في api_ledger_support.py
- **الملف**: `finance/api_ledger_support.py:153-171`
- **المشكلة**: loop مزدوج بدون select_related = N+1 queries
- **الحل**: `values_list('id', flat=True)` + `filter(activity_id__in=ids).select_related('item')` = 2 استعلامات فقط
- **الحالة**: ✅ تم الإصلاح

## 2026-05-08 — Migration 0035 يكسر قاعدة البيانات (حرج 🔴)
- **الملف**: `inventory/migrations/0035_alter_item_reorder_level_alter_item_unit_price_and_more.py`
- **المشكلة**: `ALTER COLUMN unit_price` يفشل لأن materialized view `view_farm_dashboard_stats` تعتمد عليه
- **الخطأ**: `NotSupportedError: cannot alter type of a column used by a view or rule`
- **الحل**: إضافة `RunPython(drop_dashboard_view)` قبل AlterField و `RunPython(recreate_dashboard_view)` بعده — نفس نمط migration 0018
- **الحالة**: ✅ تم الإصلاح
- **الدرس**: **كل migration يعدّل عمود مستخدم في materialized view يجب أن يسقط ويعيد إنشاء الـ view**

## 2026-05-12 — تعارض أسماء أوامر UAT (نظامي 🟡)
- **المشكلة**: فشل تشغيل `run_enterprise_uat_cycle` لعدم وجود الملف.
- **السبب**: تغيير اسم الأمر في الإصدار النهائي إلى `uat_grp_final.py` و `certify_yeco_enterprise_final.py`.
- **الحل**: استخدام الأوامر المحدثة للتحقق من الجاهزية.
- **الدرس**: **تحقق دائماً من قائمة `management/commands` الفعليّة ولا تعتمد كلياً على ملف `AGENTS.md` في حال وجود تحديثات أخيرة.**
- **الحالة**: ✅ تم الاستيعاب والتحول للأوامر الصحيحة.
