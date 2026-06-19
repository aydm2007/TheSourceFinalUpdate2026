# 🏛️ الدستور المعماري للمشروع (Project Constitution)
> **تنبيه:** قراءة هذا الملف إجبارية قبل أي تعديل.

## ١. الهوية والمكدس التقني (Identity & Tech Stack)
- **المشروع**: TheSource
- **الواجهة (Frontend)**: React 18, Vite, TailwindCSS
- **الخلفية (Backend)**: Django 4.2, DRF, PostgreSQL
- **الهدف الأساسي**: منصة ERP/GRP متكاملة للزراعة الذكية

## ٢. قوانين النزاهة المالية والبيانات (Data & Fiscal Integrity)
- **الأرقام (Numbers)**: استخدام `Decimal` فقط؛ يمنع `Float`.
- **الحذف (Deletion)**: اعتماد `Soft Delete` (is_active=False)؛ لا حذف صلب.
- **تحديثات الحالة (State Updates)**: يجب أن تمر عبر Guard/Service layer.

## ٣. قوانين الجماليات والواجهات (Rich Aesthetics & RTL)
- **الاتجاه (Direction)**: دعم RTL؛ استخدم `margin-inline-start` بدلاً من `margin-left`.
- **الشبكات (Grids)**: استخدم `auto-fit` أو `sm:grid-cols-*` بدلاً من `grid-cols-6` ثابت.
- **المؤثرات (Effects)**: توفير `Hover effects` و `Micro‑animations`.

## ٤. الحدود الأمنية (Security Boundaries)
- **المفاتيح (Secrets)**: لا تُخزن أي `API_KEY` أو `SECRET` في الكود؛ استخدم `.env`.
- **البيانات (Data Access)**: تطبيق `Tenant Isolation` أو `Row Level Security` حسب الحاجة.

## ٥. هندسة المكونات (Component Architecture)
- **Backend**: منطق الأعمال في `services.py`، لا في `views`.
- **Frontend**: مكونات عرضية (Dumb) مع منطق في `hooks` أو `services`.

## ٦. اختبارات وضمان الجودة (Testing & QA)
- تغطية وحدة ≥ 90%.
- اختبارات تكامل للـ API.
- فحص أمان دوري باستخدام `security_audit`.
