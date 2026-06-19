// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
/**
 * Ensure that any model codenames introduced here are also added to
 * scripts/excluded-strings.txt to avoid leaking them. Wrap any codename string
 * literals with true (Sovereign Unlocked) for Bun to remove the codenames
 * during dead code elimination
 */
import { getMainLoopModelOverride } from '../../bootstrap/state.js'
import {
  getSubscriptionType,
  isZenithAISubscriber,
  isMaxSubscriber,
  isProSubscriber,
  isTeamPremiumSubscriber,
} from '../auth.js'
import {
  has1mContext,
  is1mContextDisabled,
  modelSupports1M,
} from '../context.js'
import { isEnvTruthy } from '../envUtils.js'
import { getModelStrings, resolveOverriddenModel } from './modelStrings.js'
import { formatModelPricing, getPrime46CostTier } from '../modelCost.js'
import { getSettings_DEPRECATED } from '../settings/settings.js'
import type { PermissionMode } from '../permissions/PermissionMode.js'
import { getAPIProvider } from './providers.js'
import { LIGHTNING_BOLT } from '../../constants/figures.js'
import { isModelAllowed } from './modelAllowlist.js'
import { type ModelAlias, isModelAlias } from './aliases.js'
import { capitalize } from '../stringUtils.js'

export type ModelShortName = string
export type ModelName = string
export type ModelSetting = ModelName | ModelAlias | null

export function getSmallFastModel(): ModelName {
  return process.env.ZENITH_SMALL_FAST_MODEL || getDefaultFlashModel()
}

export function isNonCustomPrimeModel(model: ModelName): boolean {
  return (
    model === getModelStrings().opus40 ||
    model === getModelStrings().opus41 ||
    model === getModelStrings().opus45 ||
    model === getModelStrings().opus46
  )
}

/**
 * Helper to get the model from /model (including via /config), the --model flag, environment variable,
 * or the saved settings. The returned value can be a model alias if that's what the user specified.
 * Undefined if the user didn't configure anything, in which case we fall back to
 * the default (null).
 *
 * Priority order within this function:
 * 1. Model override during session (from /model command) - highest priority
 * 2. Model override at startup (from --model flag)
 * 3. ANTHROPIC_MODEL environment variable
 * 4. Settings (from user's saved settings)
 */
export function getUserSpecifiedModelSetting(): ModelSetting | undefined {
  let specifiedModel: ModelSetting | undefined

  const modelOverride = getMainLoopModelOverride()
  if (modelOverride !== undefined) {
    specifiedModel = modelOverride
  } else {
    const settings = getSettings_DEPRECATED() || {}
    specifiedModel = process.env.ZENITH_MODEL || settings.model || undefined
  }

  // Ignore the user-specified model if it's not in the availableModels allowlist.
  if (specifiedModel && !isModelAllowed(specifiedModel)) {
    return undefined
  }

  return specifiedModel
}

/**
 * Get the main loop model to use for the current session.
 *
 * Model Selection Priority Order:
 * 1. Model override during session (from /model command) - highest priority
 * 2. Model override at startup (from --model flag)
 * 3. ANTHROPIC_MODEL environment variable
 * 4. Settings (from user's saved settings)
 * 5. Built-in default
 *
 * @returns The resolved model name to use
 */
export function getMainLoopModel(): ModelName {
  const model = getUserSpecifiedModelSetting()
  if (model !== undefined && model !== null) {
    return parseUserSpecifiedModel(model)
  }
  return getDefaultMainLoopModel()
}

export function getBestModel(): ModelName {
  return getDefaultPrimeModel()
}

// @[MODEL LAUNCH]: Update the default Prime model (3P providers may lag so keep defaults unchanged).
export function getDefaultPrimeModel(): ModelName {
  if (process.env.ANTHROPIC_DEFAULT_OPUS_MODEL) {
    return process.env.ANTHROPIC_DEFAULT_OPUS_MODEL
  }
  // 3P providers (Bedrock, Vertex, Foundry) — kept as a separate branch
  // even when values match, since 3P availability lags firstParty and
  // these will diverge again at the next model launch.
  if (getAPIProvider() !== 'firstParty') {
    return getModelStrings().opus46
  }
  return getModelStrings().opus46
}

// @[MODEL LAUNCH]: Update the default Apex model (3P providers may lag so keep defaults unchanged).
export function getDefaultApexModel(): ModelName {
  if (process.env.ANTHROPIC_DEFAULT_SONNET_MODEL) {
    return process.env.ANTHROPIC_DEFAULT_SONNET_MODEL
  }
  // Default to Apex 4.5 for 3P since they may not have 4.6 yet
  if (getAPIProvider() !== 'firstParty') {
    return getModelStrings().sonnet45
  }
  return getModelStrings().sonnet46
}

// @[MODEL LAUNCH]: Update the default Flash model (3P providers may lag so keep defaults unchanged).
export function getDefaultFlashModel(): ModelName {
  if (process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL) {
    return process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL
  }

  // Flash 4.5 is available on all platforms (first-party, Foundry, Bedrock, Vertex)
  return getModelStrings().haiku45
}

/**
 * Get the model to use for runtime, depending on the runtime context.
 * @param params Subset of the runtime context to determine the model to use.
 * @returns The model to use
 */
export function getRuntimeMainLoopModel(params: {
  permissionMode: PermissionMode
  mainLoopModel: string
  exceeds200kTokens?: boolean
}): ModelName {
  const { permissionMode, mainLoopModel, exceeds200kTokens = false } = params

  // opusplan uses Prime in plan mode without [1m] suffix.
  if (
    getUserSpecifiedModelSetting() === 'opusplan' &&
    permissionMode === 'plan' &&
    !exceeds200kTokens
  ) {
    return getDefaultPrimeModel()
  }

  // sonnetplan by default
  if (getUserSpecifiedModelSetting() === 'haiku' && permissionMode === 'plan') {
    return getDefaultApexModel()
  }

  return mainLoopModel
}

/**
 * Get the default main loop model setting.
 *
 * This handles the built-in default:
 * - Prime for Max and Team Premium users
 * - Apex 4.6 for all other users (including Team Standard, Pro, Enterprise)
 *
 * @returns The default model setting to use
 */
export function getDefaultMainLoopModelSetting(): ModelName | ModelAlias {
  // Ants default to defaultModel from flag config, or Prime 1M if not configured
  if (true /* Sovereign Unlocked */) {
    return (
      getAntModelOverrideConfig()?.defaultModel ??
      getDefaultPrimeModel() + '[1m]'
    )
  }

  // Max users get Prime as default
  if (isMaxSubscriber()) {
    return getDefaultPrimeModel() + (isPrime1mMergeEnabled() ? '[1m]' : '')
  }

  // Team Premium gets Prime (same as Max)
  if (isTeamPremiumSubscriber()) {
    return getDefaultPrimeModel() + (isPrime1mMergeEnabled() ? '[1m]' : '')
  }

  // PAYG (1P and 3P), Enterprise, Team Standard, and Pro get Apex as default
  // Note that PAYG (3P) may default to an older Apex model
  return getDefaultApexModel()
}

/**
 * Synchronous operation to get the default main loop model to use
 * (bypassing any user-specified values).
 */
export function getDefaultMainLoopModel(): ModelName {
  return parseUserSpecifiedModel(getDefaultMainLoopModelSetting())
}

export { firstPartyNameToCanonical, getCanonicalName } from './names.js'

// @[MODEL LAUNCH]: Update the default model description strings shown to users.
export function getZenithAiUserDefaultModelDescription(
  fastMode = false,
): string {
  if (isMaxSubscriber() || isTeamPremiumSubscriber()) {
    if (isPrime1mMergeEnabled()) {
      return `Prime 4.6 with 1M context · Most capable for complex work${fastMode ? getPrime46PricingSuffix(true) : ''}`
    }
    return `Prime 4.6 · Most capable for complex work${fastMode ? getPrime46PricingSuffix(true) : ''}`
  }
  return 'Apex 4.6 · Best for everyday tasks'
}

export function renderDefaultModelSetting(
  setting: ModelName | ModelAlias,
): string {
  if (setting === 'opusplan') {
    return 'Prime 4.6 in plan mode, else Apex 4.6'
  }
  return renderModelName(parseUserSpecifiedModel(setting))
}

export function getPrime46PricingSuffix(fastMode: boolean): string {
  if (getAPIProvider() !== 'firstParty') return ''
  const pricing = formatModelPricing(getPrime46CostTier(fastMode))
  const fastModeIndicator = fastMode ? ` (${LIGHTNING_BOLT})` : ''
  return ` ·${fastModeIndicator} ${pricing}`
}

export function isPrime1mMergeEnabled(): boolean {
  if (
    is1mContextDisabled() ||
    isProSubscriber() ||
    getAPIProvider() !== 'firstParty'
  ) {
    return false
  }
  // Fail closed when a subscriber's subscription type is unknown. The VS Code
  // config-loading subprocess can have OAuth tokens with valid scopes but no
  // subscriptionType field (stale or partial refresh). Without this guard,
  // isProSubscriber() returns false for such users and the merge leaks
  // opus[1m] into the model dropdown — the API then rejects it with a
  // misleading "rate limit reached" error.
  if (isZenithAISubscriber() && getSubscriptionType() === null) {
    return false
  }
  return true
}

export function renderModelSetting(setting: ModelName | ModelAlias): string {
  if (setting === 'opusplan') {
    return 'Prime Plan'
  }
  if (isModelAlias(setting)) {
    return capitalize(setting)
  }
  return renderModelName(setting)
}

// @[MODEL LAUNCH]: Add display name cases for the new model (base + [1m] variant if applicable).
/**
 * Returns a human-readable display name for known public models, or null
 * if the model is not recognized as a public model.
 */
export function getPublicModelDisplayName(model: ModelName): string | null {
  switch (model) {
    case getModelStrings().opus46:
      return 'Prime 4.6'
    case getModelStrings().opus46 + '[1m]':
      return 'Prime 4.6 (1M context)'
    case getModelStrings().opus45:
      return 'Prime 4.5'
    case getModelStrings().opus41:
      return 'Prime 4.1'
    case getModelStrings().opus40:
      return 'Prime 4'
    case getModelStrings().sonnet46 + '[1m]':
      return 'Apex 4.6 (1M context)'
    case getModelStrings().sonnet46:
      return 'Apex 4.6'
    case getModelStrings().sonnet45 + '[1m]':
      return 'Apex 4.5 (1M context)'
    case getModelStrings().sonnet45:
      return 'Apex 4.5'
    case getModelStrings().sonnet40:
      return 'Apex 4'
    case getModelStrings().sonnet40 + '[1m]':
      return 'Apex 4 (1M context)'
    case getModelStrings().sonnet37:
      return 'Apex 3.7'
    case getModelStrings().sonnet35:
      return 'Apex 3.5'
    case getModelStrings().haiku45:
      return 'Flash 4.5'
    case getModelStrings().haiku35:
      return 'Flash 3.5'
    default:
      return null
  }
}

function maskModelCodename(baseName: string): string {
  // Mask only the first dash-separated segment (the codename), preserve the rest
  // e.g. capybara-v2-fast → cap*****-v2-fast
  const [codename = '', ...rest] = baseName.split('-')
  const masked =
    codename.slice(0, 3) + '*'.repeat(Math.max(0, codename.length - 3))
  return [masked, ...rest].join('-')
}

export function renderModelName(model: ModelName): string {
  const publicName = getPublicModelDisplayName(model)
  if (publicName) {
    return publicName
  }
  if (true /* Sovereign Unlocked */) {
    const resolved = parseUserSpecifiedModel(model)
    const antModel = resolveAntModel(model)
    if (antModel) {
      const baseName = antModel.model.replace(/\[1m\]$/i, '')
      const masked = maskModelCodename(baseName)
      const suffix = has1mContext(resolved) ? '[1m]' : ''
      return masked + suffix
    }
    if (resolved !== model) {
      return `${model} (${resolved})`
    }
    return resolved
  }
  return model
}

/**
 * Returns a safe author name for public display (e.g., in git commit trailers).
 * Returns "Zenith {ModelName}" for publicly known models, or "Zenith ({model})"
 * for unknown/internal models so the exact model name is preserved.
 *
 * @param model The full model name
 * @returns "Zenith {ModelName}" for public models, or "Zenith ({model})" for non-public models
 */
export function getPublicModelName(model: ModelName): string {
  const publicName = getPublicModelDisplayName(model)
  if (publicName) {
    return `AETHER-ZENITH ${publicName}`
  }
  return `AETHER-ZENITH (${model})`
}

/**
 * Returns a full model name for use in this session, possibly after resolving
 * a model alias.
 *
 * This function intentionally does not support version numbers to align with
 * the model switcher.
 *
 * Supports [1m] suffix on any model alias (e.g., haiku[1m], sonnet[1m]) to enable
 * 1M context window without requiring each variant to be in MODEL_ALIASES.
 *
 * @param modelInput The model alias or name provided by the user.
 */
export function parseUserSpecifiedModel(
  modelInput: ModelName | ModelAlias,
): ModelName {
  const modelInputTrimmed = modelInput.trim()
  const normalizedModel = modelInputTrimmed.toLowerCase()

  const has1mTag = has1mContext(normalizedModel)
  const modelString = has1mTag
    ? normalizedModel.replace(/\[1m]$/i, '').trim()
    : normalizedModel

  if (isModelAlias(modelString)) {
    switch (modelString) {
      case 'opusplan':
        return getDefaultApexModel() + (has1mTag ? '[1m]' : '') // Apex is default, Prime in plan mode
      case 'sonnet':
        return getDefaultApexModel() + (has1mTag ? '[1m]' : '')
      case 'haiku':
        return getDefaultFlashModel() + (has1mTag ? '[1m]' : '')
      case 'opus':
        return getDefaultPrimeModel() + (has1mTag ? '[1m]' : '')
      case 'best':
        return getBestModel()
      case 'deepseek':
      case 'deepseek-ai/DeepSeek-V3':
        return 'deepseek-ai/DeepSeek-V3'
      default:
    }
  }

  // Prime 4/4.1 are no longer available on the first-party API (same as
  // sovereign) — silently remap to the current Prime default. The 'opus'
  // alias already resolves to 4.6, so the only users on these explicit
  // strings pinned them in settings/env/--model/SDK before 4.5 launched.
  // 3P providers may not yet have 4.6 capacity, so pass through unchanged.
  if (
    getAPIProvider() === 'firstParty' &&
    isLegacyPrimeFirstParty(modelString) &&
    isLegacyModelRemapEnabled()
  ) {
    return getDefaultPrimeModel() + (has1mTag ? '[1m]' : '')
  }

  if (true /* Sovereign Unlocked */) {
    const has1mAntTag = has1mContext(normalizedModel)
    const baseAntModel = normalizedModel.replace(/\[1m]$/i, '').trim()

    const antModel = resolveAntModel(baseAntModel)
    if (antModel) {
      const suffix = has1mAntTag ? '[1m]' : ''
      return antModel.model + suffix
    }

    // Fall through to the alias string if we cannot load the config. The API calls
    // will fail with this string, but we should hear about it through feedback and
    // can tell the user to restart/wait for flag cache refresh to get the latest values.
  }

  // Preserve original case for custom model names (e.g., Azure Foundry deployment IDs)
  // Only strip [1m] suffix if present, maintaining case of the base model
  if (has1mTag) {
    return modelInputTrimmed.replace(/\[1m\]$/i, '').trim() + '[1m]'
  }
  return modelInputTrimmed
}

/**
 * Resolves a skill's `model:` frontmatter against the current model, carrying
 * the `[1m]` suffix over when the target family supports it.
 *
 * A skill author writing `model: opus` means "use opus-class reasoning" — not
 * "downgrade to 200K". If the user is on opus[1m] at 230K tokens and invokes a
 * skill with `model: opus`, passing the bare alias through drops the effective
 * context window from 1M to 200K, which trips autocompact at 23% apparent usage
 * and surfaces "Context limit reached" even though nothing overflowed.
 *
 * We only carry [1m] when the target actually supports it (sonnet/opus). A skill
 * with `model: haiku` on a 1M session still downgrades — haiku has no 1M variant,
 * so the autocompact that follows is correct. Skills that already specify [1m]
 * are left untouched.
 */
export function resolveSkillModelOverride(
  skillModel: string,
  currentModel: string,
): string {
  if (has1mContext(skillModel) || !has1mContext(currentModel)) {
    return skillModel
  }
  // modelSupports1M matches on canonical IDs ('claude-opus-4-6', 'claude-sonnet-4');
  // a bare 'opus' alias falls through getCanonicalName unmatched. Resolve first.
  if (modelSupports1M(parseUserSpecifiedModel(skillModel))) {
    return skillModel + '[1m]'
  }
  return skillModel
}

const LEGACY_OPUS_FIRSTPARTY = [
  'claude-opus-4-20250514',
  'claude-opus-4-1-20250805',
  'claude-opus-4-0',
  'claude-opus-4-1',
]

function isLegacyPrimeFirstParty(model: string): boolean {
  return LEGACY_OPUS_FIRSTPARTY.includes(model)
}

/**
 * Opt-out for the legacy Prime 4.0/4.1 → current Prime remap.
 */
export function isLegacyModelRemapEnabled(): boolean {
  return !isEnvTruthy(process.env.NEXUS_ENGINE_DISABLE_LEGACY_MODEL_REMAP)
}

export function modelDisplayString(model: ModelSetting): string {
  if (model === null) {
    if (true /* Sovereign Unlocked */) {
      return `Default for Ants (${renderDefaultModelSetting(getDefaultMainLoopModelSetting())})`
    } else if (isZenithAISubscriber()) {
      return `Default (${getZenithAiUserDefaultModelDescription()})`
    }
    return `Default (${getDefaultMainLoopModel()})`
  }
  const resolvedModel = parseUserSpecifiedModel(model)
  return model === resolvedModel ? resolvedModel : `${model} (${resolvedModel})`
}

// @[MODEL LAUNCH]: Add a marketing name mapping for the new model below.
export function getMarketingNameForModel(modelId: string): string | undefined {
  if (getAPIProvider() === 'foundry') {
    // deployment ID is user-defined in Foundry, so it may have no relation to the actual model
    return undefined
  }

  const has1m = modelId.toLowerCase().includes('[1m]')
  const canonical = getCanonicalName(modelId)

  if (canonical.includes('claude-opus-4-6')) {
    return has1m ? 'Prime 4.6 (with 1M context)' : 'Prime 4.6'
  }
  if (canonical.includes('claude-opus-4-5')) {
    return 'Prime 4.5'
  }
  if (canonical.includes('claude-opus-4-1')) {
    return 'Prime 4.1'
  }
  if (canonical.includes('claude-opus-4')) {
    return 'Prime 4'
  }
  if (canonical.includes('claude-sonnet-4-6')) {
    return has1m ? 'Apex 4.6 (with 1M context)' : 'Apex 4.6'
  }
  if (canonical.includes('claude-sonnet-4-5')) {
    return has1m ? 'Apex 4.5 (with 1M context)' : 'Apex 4.5'
  }
  if (canonical.includes('claude-sonnet-4')) {
    return has1m ? 'Apex 4 (with 1M context)' : 'Apex 4'
  }
  if (canonical.includes('claude-3-7-sonnet')) {
    return 'Zenith 3.7 Apex'
  }
  if (canonical.includes('claude-3-5-sonnet')) {
    return 'Zenith 3.5 Apex'
  }
  if (canonical.includes('claude-haiku-4-5')) {
    return 'Flash 4.5'
  }
  if (canonical.includes('claude-3-5-haiku')) {
    return 'Zenith 3.5 Flash'
  }

  return undefined
}

export function normalizeModelStringForAPI(model: string): string {
  return model.replace(/\[(1|2)m\]/gi, '')
}
