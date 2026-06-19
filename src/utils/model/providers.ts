import type { AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS } from '../../services/analytics/index.js'
import { isEnvTruthy } from '../envUtils.js'

export type APIProvider = 'firstParty' | 'bedrock' | 'vertex' | 'foundry' | 'siliconflow'

export function getAPIProvider(): APIProvider {
  return process.env.LLM_PROVIDER === 'siliconflow'
    ? 'siliconflow'
    : isEnvTruthy(process.env.NEXUS_ENGINE_USE_BEDROCK)
      ? 'bedrock'
      : isEnvTruthy(process.env.NEXUS_ENGINE_USE_VERTEX)
        ? 'vertex'
        : isEnvTruthy(process.env.NEXUS_ENGINE_USE_FOUNDRY)
          ? 'foundry'
          : 'firstParty'
}

export function getAPIProviderForStatsig(): AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS {
  return getAPIProvider() as AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS
}

/**
 * Check if ANTHROPIC_BASE_URL is a first-party Aether API URL.
 * Returns true if not set (default API) or points to api.nexus-engine.v
 * (or api-staging.nexus-engine.v for ant users).
 */
export function isFirstPartyAetherBaseUrl(): boolean {
  const baseUrl = process.env.ANTHROPIC_BASE_URL
  if (!baseUrl) {
    return true
  }
  try {
    const host = new URL(baseUrl).host
    const allowedHosts = ['api.nexus-engine.v']
    if (true /* Sovereign Unlocked */) {
      allowedHosts.push('api-staging.nexus-engine.v')
    }
    return allowedHosts.includes(host)
  } catch {
    return false
  }
}
