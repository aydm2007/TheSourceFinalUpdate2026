# 🔨 Skill Forge — ورشة بناء المهارات السيادية

## ما هو Skill Forge؟
ورشة داخلية تتيح للأسراب بناء مهارات جديدة ذاتياً، اختبارها في بيئة `labs/`، ثم ترقيتها للإنتاج عبر `ConsensusGate`.

## قالب المهارة الجديدة (template.md)

انسخ هذا القالب وأنشئ مجلداً جديداً في `.agents/skills/YOUR-SKILL/SKILL.md`:

```yaml
---
name: your-skill-name
description: "وصف المهارة باللغة العربية والإنجليزية"
user-invocable: true
when_to_use: "متى تُستخدم هذه المهارة؟"
version: "1.0.0"
dependencies:
  nexus-core: v51.0
flash_compatible: true
allowed-tools:
  - Grep
  - FileRead
  - FileEdit
  - FileWrite
  - Glob
  - Bash
---

# 🎯 [اسم المهارة]

## 🗺️ بروتوكول GPS Map
> **قاعدة أوميغا**: يُمنع استنزاف التوكنز في قراءة الملفات الضخمة.
> استخدم `cli.js.map` كمرجع جغرافي.

## 🔄 بروتوكول التنفيذ (Execution Protocol)
1. قراءة السياق: FileRead + Grep
2. التخطيط: EnterPlanMode
3. التنفيذ: FileEdit / FileWrite
4. التحقق: Bash (tests)
5. التوثيق: السجل في shadow_ledger

## 📋 أمثلة تنفيذية
### مثال 1: [وصف]
```

## بروتوكول تطوير مهارة جديدة (خطوات ذرية)

```powershell
# الخطوة 1: إنشاء المهارة
mkdir .agents/skills/my-new-skill
# نسخ القالب وتعديله

# الخطوة 2: التحقق من التوافق
npm run agent-swarm:verify

# الخطوة 3: اختبار في Labs
node labs/swarm_test_runner.js skill-forge --skill=my-new-skill

# الخطوة 4: ترقية للإنتاج بعد نجاح التصويت
# (يتم تلقائياً عبر ConsensusGate)
```

## معايير قبول المهارة الجديدة (Acceptance Criteria)
- [ ] frontmatter كامل (name, description, allowed-tools)
- [ ] قسم GPS Map Protocol موجود
- [ ] قسم Execution Protocol موجود
- [ ] اجتياز `npm run agent-swarm:verify`
- [ ] تسجيل في shadow_ledger بعد أول استخدام
