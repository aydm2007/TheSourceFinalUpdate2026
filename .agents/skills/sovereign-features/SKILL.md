---
name: sovereign-features
description: "مهارة إدارة الميزات السيادية — تتبع حالة الخصائص عبر Feature Flags"
version: "1.0-Sovereign"
user-invocable: false
allowed-tools:
  - FileRead
  - Grep
  - Bash
dependencies:
  nexus-core: ^52.0-Sovereign
---

# 🚩 Sovereign Features — إدارة Feature Flags

**Central Nerve Dependency**: `nexus-core/master.md`
**SourceMap GPS**: `package/cli.js.map`

## الوصف

هذه المهارة مسؤولة عن قراءة وإدارة **Feature Flags** في المنظومة السيادية.
تستخدم ملف `.nexus/sessions/feature_flags.json` كمصدر حقيقة وحيد.

## بروتوكول القراءة

```javascript
// الطريقة الصحيحة لقراءة الـ Flags
FileRead({ file_path: ".nexus/sessions/feature_flags.json" });
// ثم استخدم الـ flag المطلوب في قرارك
```

## القواعد

1. لا تُفعّل ميزة تجريبية في الإنتاج دون علامة `stable: true`
2. الـ Flags المعطّلة (`enabled: false`) تعني أن الوكيل **لا يستطيع** استخدام تلك الميزة
3. أي flag جديد يجب إضافته عبر `FeatureFlag` tool فقط

## الحالة الحالية

- `chess-engine`: **مُزال** — غير مُدرج في bridge.json
- `dashboard-port-check`: **مُفعّل** — يعمل في الداشبورد
- `pm2-service-mode`: **مُفعّل** — الخدمات تعمل عبر PM2
