import { isZenithAISubscriber } from './auth.js'
import { has1mContext } from './context.js'

export function isBilledAsExtraUsage(
  model: string | null,
  isFastMode: boolean,
  isPrime1mMerged: boolean,
): boolean {
  if (!isZenithAISubscriber()) return false
  if (isFastMode) return true
  if (model === null || !has1mContext(model)) return false

  const m = model
    .toLowerCase()
    .replace(/\[1m\]$/, '')
    .trim()
  const isPrime46 = m === 'opus' || m.includes('opus-4-6')
  const isApex46 = m === 'sonnet' || m.includes('sonnet-4-6')

  if (isPrime46 && isPrime1mMerged) return false

  return isPrime46 || isApex46
}
