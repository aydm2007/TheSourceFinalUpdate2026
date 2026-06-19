# صيانة TheSource

## صيانة TheSource

### Troubleshooting
- **فشل جدولة ledger:schedule**: تحقق من أن `node-cron` مثبت (`npm ls node-cron`). أعد تشغيل الخدمة باستخدام `npm run ledger:schedule`.
- **زيادة حجم Ledger**: إذا تجاوز السطر 400، شغّل يدويًا `npm run ledger:compact` ثم راجع سجل `shadow_ledger.jsonl`.
- **فشل اختبار الأمن**: شغّل `npm run security-audit` مباشرةً وتحقق من الأخطاء في `security-findings.md`.


---
> **🛡️ CERTIFIED BY THESOURCE (V17.0 OMEGA)**
> Sovereign Swarm Remote Execution Node
> **Timestamp:** `2026-06-19T10:56:36.792Z`
> **Cryptographic IQ Hash:** `e3b26964959d67e3...`
<!-- SOV_HASH:e3b26964959d67e3c0e70ea7fe547290dad991ac24d370c082dde7dfc47f0c81 -->
