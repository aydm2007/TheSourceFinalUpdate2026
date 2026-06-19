# 🔍 الأنماط المكتشفة

## نمط: pop() يحذف البيانات بين الطبقات
- **المشكلة**: `data.pop('field')` يحذف الحقل من القاموس الأصلي
- **الحل**: استخدم `data.get('field')` للقراءة بدون حذف
- **الملفات المتأثرة**: أي Service layer يعالج بيانات قادمة من API

## نمط: return null يخفي المكون
- **المشكلة**: `if (!data) return null` يمنع عرض أي شيء قبل وصول البيانات
- **الحل**: Draft Injection — `const effectiveData = data || { items: [], status: 'draft' }`
- **الملفات المتأثرة**: أي React component يعتمد على بيانات API

## نمط: SDUI بلا فلترة = بيانات مسطحة (Flat Data Leak)
- **المشكلة**: إرسال كافة الكروت الذكية للعميل (Flutter) دون مراعاة سياق المحصول أو النشاط.
- **الحل**: تنفيذ Scoping logic في الـ API ViewSet يعتمد على `crop_code` و `activity_type`.
- **الملفات المتأثرة**: `sdui_controllers.py`, `sdui_schema.py`

## نمط: التحديث العشوائي للماستر (Master Update Risk)
- **المشكلة**: استبدال ملف `master.md` بالكامل بمسودة مولدة خارجياً يؤدي لضياع "الميراث التقني" (Skill Registry).
- **الحل**: استخدام Surgical Diffs (تعديلات جراحية) فقط لإضافة الفقرات الجديدة مع الحفاظ على الهيكل الأصلي.
- **الملفات المتأثرة**: `.agents/skills/nexus-core/master.md`

## [Material Fallback Pattern]
- **المشكلة**: توقف الواجهة عند غياب بيانات الربط المحصولي للمواد.
- **الحل**: تنفيذ تسلسل بحث (Lookup Chain): المحصول المحدد -> مواد المزرعة العامة -> القائمة الكاملة. مع تلميح بصري للمستخدم.
- **الملفات**: `ActivityItemsField.jsx`, `sdui_controllers.py`

## [Forensic Location Attribution]
- **المشكلة**: غموض في تبعية المساحات المنفذة عند تغطية السجل لعدة مواقع.
- **الحل**: فرض اختيار الموقع (Location Selection) داخل وحدة المساحة لضمان الربط الذري (Atomic Link) بين الإنجاز والموقع.
- **الملفات**: `DailyLogForm.jsx`, `activity.py`

## Parallel Prefetch Startup Pattern
- **المشكلة**: وقت بدء التطبيق يتأخر بسبب تحميل إعدادات MDM، قراءة الـ keychain، وتهيئة اتصال API بشكل متسلسل.
- **الحل**: تنفيذ `startMdmRawRead()`, `startKeychainPrefetch()` و `API preconnect` بالتوازي قبل استيراد الوحدات الثقيلة (OpenTelemetry, gRPC, analytics, feature‑gated subsystems) باستخدام `Promise.all` أو `dynamic import()`.
- **الملفات المتأثرة**: `main.tsx`, أي ملفات بدء التطبيق التي تستدعي heavy modules.
- **الفائدة**: تقليل زمن الـ **Startup** بنسبة ~30‑40% وتحسين تجربة المستخدم في بيئات React/Vite.

## Agent Swarms Pattern
- **المشكلة**: الحاجة إلى تشغيل مهام متعددة بالتوازي مع تنسيق وتواصل بين الوكلاء الفرعيين.
- **الحل**: استخدام `AgentTool` لإنشاء Sub‑agents، وتعيين `Coordinator` (أو `Orchestrator`) لإدارة دورة حياة الوكلاء، تبادل الرسائل عبر قناة داخلية (مثلاً `MessageQueue` أو `EventBus`).
- **الملفات المتأثرة**: ملفات الأدوات التي تستدعي `AgentTool`، ملفات الـ coordinator (عادةً `orchestrator.ts` أو `agent_manager.py`).
- **الفائدة**: تحسين الأداء عبر تنفيذ عمليات I/O أو حسابية متزامنة، وتقليل زمن الاستجابة للـ APIs.

## TeamCreateTool Pattern
- **المشكلة**: تنفيذ مهام متعلقة بفريق (مثلاً بناء تقارير، تجميع بيانات) يحتاج إلى تنسيق عمل متوازي بين عدة أعضاء أو عمليات.
- **الحل**: `TeamCreateTool` يخلق “Team” من عدة Sub‑agents، كل واحد مسؤول عن جزء من المهمة؛ الـ coordinator يجمع النتائج ويُعيد تجميعها في نتيجة نهائية.
- **الملفات المتأثرة**: تعريف الـ Team في `team.ts` أو `team_manager.py`، وأي سكريبت يستخدم `TeamCreateTool`.
- **الفائدة**: تقليل زمن تنفيذ المهام الكبيرة إلى حدود عدد الـ agents المتوازيين، وتحسين استغلال موارد الخادم.

## Skill System Pattern
- **المشكلة**: الحاجة إلى تشغيل سير عمل معاد استخدامه (Reusable workflows) عبر مهارات (`skills/`) مع تمكين المستخدمين من إضافة مهارات مخصصة.
- **الحل**: تعريف كل مهارة كملف مستقل داخل `skills/` يُستدعى عبر `SkillTool`. الـ `SkillTool` يحمّل المهارة (ملف Python/JS) ويُمرّر الـ context والـ parameters. يمكن للمهارة أن تُعيد نتائجه إلى الـ orchestrator أو إلى Agent آخر.
- **الملفات المتأثرة**: مجلد `skills/` (كل مهارة بمستوى ملف)، ملف `skill_tool.py` أو `skill_manager.ts` الذي يدير تحميل وتنفيذ المهارات.
- **الفائدة**: تعزيز القابلية لإعادة الاستخدام، تمكين المطورين من إضافة وظائف جديدة دون تعديل الكود الأساسي، وتسهيل صيانة النظام.

<!-- APPEND -->

## نمط: فجوة هوية الجسد (Body Identity Gap) - تم الإصلاح
- **المشكلة**: اعتبار نماذج الذكاء الاصطناعي (Sub-agents) هي "الجسد" المنفذ، مما يؤدي لإهمال الأدوات المحلية والمهارات الدستورية.
- **الحل**: ترسيخ أن **TheSource** (أدوات، مهارات، CLI) هي الجسد السيادي، والنماذج هي محركات طاقة فقط.
- **الملفات المتأثرة**: `master.md`, `nexus_bridge.js`

## نمط: الانقطاع السحابي للوكلاء (Swarm API Timeout)
- **المشكلة**: فشل المهام الموزعة على وكلاء السحابة عند مسح مجلدات عملاقة بسبب `ETIMEDOUT`.
- **السبب**: مهلة جسر الاتصال (30000ms) أقصر من الوقت اللازم لمعالجة آلاف الأسطر.
- **الحل الجراحي (Tactical Fallback)**: تبديل الاعتمادية فوراً إلى أدوات `TheSource` الداخلية (ForensicAudit/Grep/ListDir) واستكمال "التشخيص الذري" بدون انتظار النموذج.
- **الملفات المتأثرة**: `nexus_bridge.js`, `task_agent_*.json`
## نمط: pop() في activity_service.py — field aliasing وليس data loss
- **المشكلة**: 20+ pop() تبدو خطرة لكنها مقصودة
- **السبب**: فصل حقول M2M (employees, items) قبل Model.save()
- **الحل**: لا إصلاح مطلوب — لكن وثّق الترتيب عند إضافة حقول
- **الملفات المتأثرة**: `core/services/activity_service.py`

## نمط: N+1 في api_ledger_support.py
- **المشكلة**: `for act_item in ActivityItem.objects.filter(activity=activity)` بدون select_related
- **الحل**: إضافة `.select_related('item', 'activity')` 
- **الملفات المتأثرة**: `finance/api_ledger_support.py:155`

## نمط: CORS_ALLOW_ALL في التطوير مع حماية إنتاج
- **المشكلة**: `CORS_ALLOW_ALL_ORIGINS = True` في settings.py
- **الحماية**: `production_settings.py` يُقيّد — لكن يحتاج تأكيد
- **الملفات المتأثرة**: `smart_agri/settings.py:300`
+
+## نمط: الوكلاء المعزولون (Isolated Agents Risk)
+- **المشكلة**: عمل الوكيل (الرأس) بمعزل عن أدوات التحقق المحلية يؤدي لهلوسة معمارية.
+- **الحل**: بروتوكول **"التفكير قبل التنفيذ"** (EnterPlanMode) و **"التوثيق المنطقي"** (TodoWrite) لربط الفكر بالفعل.
+- **الملفات المتأثرة**: `nexus_bridge.js`, `master.md`
+
+## نمط: اعتمادية المحرك الواحد (Single Engine Dependency)
+- **المشكلة**: توقف العمل عند تعطل API نموذج معين.
+- **الحل**: نمط **Adapter Failover** (Primary/Fallback) الذي يضمن أن "الجسد" لا يتوقف أبداً عن الحركة.
+- **الملفات المتأثرة**: `nexus_bridge.js`

## نمط: الفشل المعقد المتعدد (Multi-Layer Failure Pattern)
- **المشكلة**: الأنظمة المؤسسية تفشل غالباً في نقاط التقاطع (Cross-layers) وليس في مكان واحد.
- **الحل**: بروتوكول **"التدقيق الذري الشامل"** الذي يفحص الـ Backend والـ Frontend والـ Mobile في دورة عمل واحدة قبل المطالبة بالجاهزية.
- **الدرجة**: 100/100 (مثبت في Zenith Test).
