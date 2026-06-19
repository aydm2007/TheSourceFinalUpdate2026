# PROTOCOLS – بروتوكولات Nexus Memory

## 1️⃣ Security Scrubbing Protocol
- **منع** حفظ المفاتيح، الـ PII، عناوين IP.
- كل محتوى يُضاف إلى `decisions.md`, `patterns.md`, `bugs.md` يجب أن يُمرَّر عبر **ZodSchema** للتحقق.
- مثال للتحقق قبل كتابة:
```json
{
  "type": "object",
  "properties": {
    "content": { "type": "string" },
    "append_marker": { "type": "string", "enum": ["<!-- APPEND -->"] }
  },
  "required": ["content", "append_marker"]
}
```

## 2️⃣ Vector Indexing Protocol
- بعد كل تعديل يُستدعى سكريبت `update_vector_index.sh` (Bash) لتجميع جميع `.md` وإعادة بناء `vector_index.json`.
- يتحقق من عدم وجود تكرار عبر `IntegrityCheck`.

## 3️⃣ ZodSchema Integration
- جميع الأدوات (`FileEdit`, `FileWrite`, `Grep`, `Bash`) تُستدعى عبر دالة `validate(schema, args)`.
- مخططات Zod موجودة في `schema/`.

## 4️⃣ Shadow Ledger Protocol
- كل استدعاء أداة يُسجل في `shadow_ledger.jsonl` بصيغة:
```json
{ "timestamp": "2026-05-13T12:34:56Z", "intent": "Save decision", "tool": "FileEdit", "args": {"file_path": ".agents/memory/decisions.md", "old_string": "<!-- APPEND -->", "new_string": "..." }, "latency_ms": 12 }
```
- يستخدم `VisualAuditReport` لتوليد تقرير أسبوعي.

---

**ملاحظة:** جميع الأوامر يجب أن تُنفَّذ من داخل بيئة الـ `ServerMode` لضمان العزل.
