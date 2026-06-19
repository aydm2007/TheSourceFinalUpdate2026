import shadowLedger from '../core/state/ShadowLedger';

/**
 * سجل أداة تم استخدامها في ملف shadow_ledger.jsonl مع توقيع HMAC والربط التشفيري التراكمي.
 */
export async function logToolUse(name: string, args: any, durationMs: number, status: 'success' | 'error' = 'success'): Promise<void> {
  await shadowLedger.logEvent(name, args, durationMs, status);
}

