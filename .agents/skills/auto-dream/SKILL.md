---
name: auto-dream
description: "Distills session outcomes into durable project memory without storing secrets or temporary noise."
user-invocable: true
when_to_use: "Use at the end of substantial sessions to preserve stable decisions, conventions, and recurring patterns."
version: "51.0-Singularity"
dependencies:
  nexus-core: v51.0
  nexus-memory: v51.0
allowed-tools:
  - FileRead
  - FileEdit
  - FileWrite
  - Grep
  - TodoWrite
  - ShadowLedgerAudit
---

# AutoDream (Memory Distillation)

## Goal

Consolidate the current session's learnings, accomplishments, and context into the permanent memory vault (`CLAUDE.md`).

## Context

As a sovereign agent, maintaining long-term fidelity is critical. AutoDream distills the "noise" of a session into "signals" for the future.

## Operating Protocol

1. **Analyze Session History**: Review the tasks completed and decisions made during this session.
2. **Update CLAUDE.md**:
   - Update the `Status` and `Readiness` levels if applicable.
   - Add new conventions or project-specific rules discovered.
   - Summarize the `Operational History` with a new consolidated entry.
3. **Prune Auto-Memory**: If the engine's internal auto-memory is getting cluttered, suggest entries for promotion to `CLAUDE.md` and then clear them.

## Rules

- Focus on "Permanent" knowledge, not temporary bugs.
- Keep the tone "Sovereign" and "Strategic".
- Always present the proposed changes to the user before writing.

## 👑 التبعية المركزية الإلزامية (Central Nerve Dependency)

> **تحذير سيادي**: هذه المهارة تابعة بشكل هيكلي ومطلق للمهارة الأم `@[.agents/skills/nexus-core/master.md]`. يُمنع على أي نموذج ذكاء اصطناعي (LLM) أو وكيل تنفيذ أو استخدام هذه المهارة بمعزل عن توجيهات المهارة المركزية العليا. يجب العودة دائماً لدستور `master` قبل اتخاذ أي قرار مصيري.

## 🗺️ التوجيه الجغرافي (GPS Map Protocol)

> **قاعدة أوميغا الصارمة**: عند التعامل مع الأخطاء أو استرجاع السياق، يُمنع استنزاف نافذة التوكنز في قراءة الملفات الضخمة. يجب الاعتماد على `cli.js.map` كمرجع جغرافي (GPS) لفك تشفير الأخطاء وإرشاد أدوات الـ (AST Editing) نحو السطر البرمجي المادي بدقة (Zero-Token Overhead).
