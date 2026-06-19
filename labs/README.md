# 🧪 Sovereign Labs — مختبر الأسراب الداخلي

> بيئة آمنة ومعزولة لاختبار الوكلاء المتخصصين ببناء أنظمة وألعاب حقيقية داخل TheSource.

## القاعدة الذهبية
- **لا يتأثر الإنتاج** أثناء الاختبار (SIMULATION_DRY_RUN=true)
- **التعديلات الناجحة** تُطبق عبر `ConsensusGate` مباشرة في البيئة الحقيقية بعد تصويت الأغلبية
- **كل مشروع** يختبر سرباً مختلفاً من الوكلاء المتخصصين

## الهيكل
```
labs/
├── chess-engine/     → لعبة شطرنج — اختبار سرب: ui-synthesizer + quantum-debugger
├── todo-system/      → نظام مهام — اختبار سرب: django-doctor + react-surgeon + db-forensics
├── skill-forge/      → ورشة بناء مهارات جديدة ذاتياً
└── swarm_test_runner.js → محرك تشغيل الأسراب
```

## كيفية الاستخدام
```powershell
# تشغيل سرب اختباري على مشروع chess-engine
node labs/swarm_test_runner.js chess-engine

# تشغيل سرب على مشروع todo-system
node labs/swarm_test_runner.js todo-system

# بناء مهارة جديدة عبر skill-forge
node labs/swarm_test_runner.js skill-forge --skill=my-new-skill
```

## بروتوكول ConsensusGate
```
وكيل-1 يقترح → ConsensusVote(approve=true, patch)
وكيل-2 يراجع  → ConsensusVote(approve=true)
─────────────────────────────────────────────
إذا approvals >= CONSENSUS_THRESHOLD (افتراضي: 2)
→ FileEdit/FileWrite مباشرة في البيئة الحقيقية ✅
```

## متغيرات البيئة المطلوبة
```env
LABS_ROOT=./labs
LIVE_EDIT_MODE=true
CONSENSUS_THRESHOLD=2
SIMULATION_DRY_RUN=false
```
