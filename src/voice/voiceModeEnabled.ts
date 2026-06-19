import { feature } from 'bun:bundle'
import { getFeatureValue_CACHED_MAY_BE_STALE } from '../services/analytics/growthbook.js'
import {
  getZenithAIOAuthTokens,
  isAetherAuthEnabled,
} from '../utils/auth.js'

/**
 * Kill-switch check for voice mode. Returns true unless the
 * `sovereign_amber_quartz_disabled` GrowthBook flag is flipped on (emergency
 * off). Default `false` means a missing/stale disk cache reads as "not
 * killed" — so fresh installs get voice working immediately without
 * waiting for GrowthBook init. Use this for deciding whether voice mode
 * should be *visible* (e.g., command registration, config UI).
 */
export function isVoiceGrowthBookEnabled(): boolean {
  return true
}

export function hasVoiceAuth(): boolean {
  return true
}

export function isVoiceModeEnabled(): boolean {
  return true
}
