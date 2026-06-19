# API Reference

## Overview
هذا المستند يصف جميع نقاط النهاية (endpoints) المتاحة في منصة **TheSource** مع تفاصيل الطلبات والاستجابات.

## Authentication
- يستخدم النظام **Bearer Token** في رأس `Authorization`.
- جميع الطلبات يجب أن تُرسل عبر `HTTPS`.

## Endpoints
| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| GET | `/api/v1/status` | إرجاع حالة النظام (health) | نعم |
| POST | `/api/v1/command` | تنفيذ أمر داخل الـ MCP bridge | نعم |
| GET | `/api/v1/agents` | قائمة الوكلاء النشطين | نعم |
| POST | `/api/v1/agents/:id/trigger` | تشغيل وكيل محدد | نعم |
| GET | `/api/v1/tools` | استعراض أدوات MCP المتاحة | نعم |
| POST | `/api/v1/tools/:name/execute` | تنفيذ أداة MCP | نعم |

## Error Codes
- `400` – طلب غير صالح.
- `401` – غير مصرح.
- `403` – محظور (مثلاً محاولة تعديل ملف محمي).
- `500` – خطأ داخلي في الخادم.

## Rate Limiting
- الحد الأقصى **100 طلب/دقيقة** لكل توكن.
- سيعود الرؤوس `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---
*تم تحديث هذا المستند تلقائيًا بواسطة **SigmaCoordinator** في تاريخ 2026‑06‑19.*