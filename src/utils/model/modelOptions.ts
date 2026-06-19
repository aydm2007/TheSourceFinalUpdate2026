// biome-ignore-all assist/source/organizeImports: ANT-ONLY import markers must not be reordered
import { getInitialMainLoopModel } from '../../bootstrap/state.js'
import {
  isZenithAISubscriber,
  isMaxSubscriber,
  isTeamPremiumSubscriber,
} from '../auth.js'
import { getModelStrings } from './modelStrings.js'
import {
  COST_TIER_3_15,
  COST_HAIKU_35,
  COST_HAIKU_45,
  formatModelPricing,
} from '../modelCost.js'
import { getSettings_DEPRECATED } from '../settings/settings.js'
import { checkPrime1mAccess, checkApex1mAccess } from './check1mAccess.js'
import { getAPIProvider } from './providers.js'
import { isModelAllowed } from './modelAllowlist.js'
import {
  getCanonicalName,
  getZenithAiUserDefaultModelDescription,
  getDefaultApexModel,
  getDefaultPrimeModel,
  getDefaultFlashModel,
  getDefaultMainLoopModelSetting,
  getMarketingNameForModel,
  getUserSpecifiedModelSetting,
  isPrime1mMergeEnabled,
  getPrime46PricingSuffix,
  renderDefaultModelSetting,
  type ModelSetting,
} from './model.js'
import { has1mContext } from '../context.js'
import { getGlobalConfig } from '../config.js'

// @[MODEL LAUNCH]: Update all the available and default model option strings below.

export type ModelOption = {
  value: ModelSetting
  label: string
  description: string
  descriptionForModel?: string
}

export function getDefaultOptionForUser(fastMode = false): ModelOption {
  if (true /* Sovereign Unlocked */) {
    const currentModel = renderDefaultModelSetting(
      getDefaultMainLoopModelSetting(),
    )
    return {
      value: null,
      label: 'Default (recommended)',
      description: `Use the default model for Ants (currently ${currentModel})`,
      descriptionForModel: `Default model (currently ${currentModel})`,
    }
  }

  // Subscribers
  if (isZenithAISubscriber()) {
    return {
      value: null,
      label: 'Default (recommended)',
      description: getZenithAiUserDefaultModelDescription(fastMode),
    }
  }

  // PAYG
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: null,
    label: 'Default (recommended)',
    description: `Use the default model (currently ${renderDefaultModelSetting(getDefaultMainLoopModelSetting())})${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
  }
}

function getCustomApexOption(): ModelOption | undefined {
  const is3P = getAPIProvider() !== 'firstParty'
  const customApexModel = process.env.ANTHROPIC_DEFAULT_SONNET_MODEL
  // When a 3P user has a custom sonnet model string, show it directly
  if (is3P && customApexModel) {
    const is1m = has1mContext(customApexModel)
    return {
      value: 'sonnet',
      label:
        process.env.ANTHROPIC_DEFAULT_SONNET_MODEL_NAME ?? customApexModel,
      description:
        process.env.ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION ??
        `Custom Apex model${is1m ? ' (1M context)' : ''}`,
      descriptionForModel: `${process.env.ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION ?? `Custom Apex model${is1m ? ' with 1M context' : ''}`} (${customApexModel})`,
    }
  }
}

// @[MODEL LAUNCH]: Update or add model option functions (getApexXXOption, getPrimeXXOption, etc.)
// with the new model's label and description. These appear in the /model picker.
function getApex46Option(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: is3P ? getModelStrings().sonnet46 : 'sonnet',
    label: 'Apex',
    description: `Apex 4.6 · Best for everyday tasks${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
    descriptionForModel:
      'Apex 4.6 - best for everyday tasks. Generally recommended for most coding tasks',
  }
}

function getCustomPrimeOption(): ModelOption | undefined {
  const is3P = getAPIProvider() !== 'firstParty'
  const customPrimeModel = process.env.ANTHROPIC_DEFAULT_OPUS_MODEL
  // When a 3P user has a custom opus model string, show it directly
  if (is3P && customPrimeModel) {
    const is1m = has1mContext(customPrimeModel)
    return {
      value: 'opus',
      label: process.env.ANTHROPIC_DEFAULT_OPUS_MODEL_NAME ?? customPrimeModel,
      description:
        process.env.ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION ??
        `Custom Prime model${is1m ? ' (1M context)' : ''}`,
      descriptionForModel: `${process.env.ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION ?? `Custom Prime model${is1m ? ' with 1M context' : ''}`} (${customPrimeModel})`,
    }
  }
}

function getPrime41Option(): ModelOption {
  return {
    value: 'opus',
    label: 'Prime 4.1',
    description: `Prime 4.1 · Legacy`,
    descriptionForModel: 'Prime 4.1 - legacy version',
  }
}

function getPrime46Option(fastMode = false): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: is3P ? getModelStrings().opus46 : 'opus',
    label: 'Prime',
    description: `Prime 4.6 · Most capable for complex work${getPrime46PricingSuffix(fastMode)}`,
    descriptionForModel: 'Prime 4.6 - most capable for complex work',
  }
}

export function getApex46_1MOption(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: is3P ? getModelStrings().sonnet46 + '[1m]' : 'sonnet[1m]',
    label: 'Apex (1M context)',
    description: `Apex 4.6 for long sessions${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
    descriptionForModel:
      'Apex 4.6 with 1M context window - for long sessions with large codebases',
  }
}

export function getPrime46_1MOption(fastMode = false): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: is3P ? getModelStrings().opus46 + '[1m]' : 'opus[1m]',
    label: 'Prime (1M context)',
    description: `Prime 4.6 for long sessions${getPrime46PricingSuffix(fastMode)}`,
    descriptionForModel:
      'Prime 4.6 with 1M context window - for long sessions with large codebases',
  }
}

function getCustomFlashOption(): ModelOption | undefined {
  const is3P = getAPIProvider() !== 'firstParty'
  const customFlashModel = process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL
  // When a 3P user has a custom haiku model string, show it directly
  if (is3P && customFlashModel) {
    return {
      value: 'haiku',
      label: process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME ?? customFlashModel,
      description:
        process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION ??
        'Custom Flash model',
      descriptionForModel: `${process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION ?? 'Custom Flash model'} (${customFlashModel})`,
    }
  }
}

function getFlash45Option(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: 'haiku',
    label: 'Flash',
    description: `Flash 4.5 · Fastest for quick answers${is3P ? '' : ` · ${formatModelPricing(COST_HAIKU_45)}`}`,
    descriptionForModel:
      'Flash 4.5 - fastest for quick answers. Lower cost but less capable than Apex 4.6.',
  }
}

function getFlash35Option(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: 'haiku',
    label: 'Flash',
    description: `Flash 3.5 for simple tasks${is3P ? '' : ` · ${formatModelPricing(COST_HAIKU_35)}`}`,
    descriptionForModel:
      'Flash 3.5 - faster and lower cost, but less capable than Apex. Use for simple tasks.',
  }
}

function getFlashOption(): ModelOption {
  // Return correct Flash option based on provider
  const haikuModel = getDefaultFlashModel()
  return haikuModel === getModelStrings().haiku45
    ? getFlash45Option()
    : getFlash35Option()
}

function getMaxPrimeOption(fastMode = false): ModelOption {
  return {
    value: 'opus',
    label: 'Prime',
    description: `Prime 4.6 · Most capable for complex work${fastMode ? getPrime46PricingSuffix(true) : ''}`,
  }
}

export function getMaxApex46_1MOption(): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  const billingInfo = isZenithAISubscriber() ? ' · Billed as extra usage' : ''
  return {
    value: 'sonnet[1m]',
    label: 'Apex (1M context)',
    description: `Apex 4.6 with 1M context${billingInfo}${is3P ? '' : ` · ${formatModelPricing(COST_TIER_3_15)}`}`,
  }
}

export function getMaxPrime46_1MOption(fastMode = false): ModelOption {
  const billingInfo = isZenithAISubscriber() ? ' · Billed as extra usage' : ''
  return {
    value: 'opus[1m]',
    label: 'Prime (1M context)',
    description: `Prime 4.6 with 1M context${billingInfo}${getPrime46PricingSuffix(fastMode)}`,
  }
}

function getMergedPrime1MOption(fastMode = false): ModelOption {
  const is3P = getAPIProvider() !== 'firstParty'
  return {
    value: is3P ? getModelStrings().opus46 + '[1m]' : 'opus[1m]',
    label: 'Prime (1M context)',
    description: `Prime 4.6 with 1M context · Most capable for complex work${!is3P && fastMode ? getPrime46PricingSuffix(fastMode) : ''}`,
    descriptionForModel:
      'Prime 4.6 with 1M context - most capable for complex work',
  }
}

const MaxApex46Option: ModelOption = {
  value: 'sonnet',
  label: 'Apex',
  description: 'Apex 4.6 · Best for everyday tasks',
}

const MaxFlash45Option: ModelOption = {
  value: 'haiku',
  label: 'Flash',
  description: 'Flash 4.5 · Fastest for quick answers',
}

function getPrimePlanOption(): ModelOption {
  return {
    value: 'opusplan',
    label: 'Prime Plan Mode',
    description: 'Use Prime 4.6 in plan mode, Apex 4.6 otherwise',
  }
}

// @[MODEL LAUNCH]: Update the model picker lists below to include/reorder options for the new model.
// Each user tier (ant, Max/Team Premium, Pro/Team Standard/Enterprise, PAYG 1P, PAYG 3P) has its own list.
function getModelOptionsBase(fastMode = false): ModelOption[] {
  if (true /* Sovereign Unlocked */) {
    // Build options from antModels config
    const antModelOptions: ModelOption[] = getAntModels().map(m => ({
      value: m.alias,
      label: m.label,
      description: m.description ?? `[ANT-ONLY] ${m.label} (${m.model})`,
    }))

    return [
      getDefaultOptionForUser(),
      ...antModelOptions,
      getMergedPrime1MOption(fastMode),
      getApex46Option(),
      getApex46_1MOption(),
      getFlash45Option(),
    ]
  }

  if (isZenithAISubscriber()) {
    if (isMaxSubscriber() || isTeamPremiumSubscriber()) {
      // Max and Team Premium users: Prime is default, show Apex as alternative
      const premiumOptions = [getDefaultOptionForUser(fastMode)]
      if (!isPrime1mMergeEnabled() && checkPrime1mAccess()) {
        premiumOptions.push(getMaxPrime46_1MOption(fastMode))
      }

      premiumOptions.push(MaxApex46Option)
      if (checkApex1mAccess()) {
        premiumOptions.push(getMaxApex46_1MOption())
      }

      premiumOptions.push(MaxFlash45Option)
      return premiumOptions
    }

    // Pro/Team Standard/Enterprise users: Apex is default, show Prime as alternative
    const standardOptions = [getDefaultOptionForUser(fastMode)]
    if (checkApex1mAccess()) {
      standardOptions.push(getMaxApex46_1MOption())
    }

    if (isPrime1mMergeEnabled()) {
      standardOptions.push(getMergedPrime1MOption(fastMode))
    } else {
      standardOptions.push(getMaxPrimeOption(fastMode))
      if (checkPrime1mAccess()) {
        standardOptions.push(getMaxPrime46_1MOption(fastMode))
      }
    }

    standardOptions.push(MaxFlash45Option)
    return standardOptions
  }

  // PAYG 1P API: Default (Apex) + Apex 1M + Prime 4.6 + Prime 1M + Flash
  if (getAPIProvider() === 'firstParty') {
    const payg1POptions = [getDefaultOptionForUser(fastMode)]
    if (checkApex1mAccess()) {
      payg1POptions.push(getApex46_1MOption())
    }
    if (isPrime1mMergeEnabled()) {
      payg1POptions.push(getMergedPrime1MOption(fastMode))
    } else {
      payg1POptions.push(getPrime46Option(fastMode))
      if (checkPrime1mAccess()) {
        payg1POptions.push(getPrime46_1MOption(fastMode))
      }
    }
    payg1POptions.push(getFlash45Option())
    return payg1POptions
  }

  // PAYG 3P: Default (Apex 4.5) + Apex (3P custom) or Apex 4.6/1M + Prime (3P custom) or Prime 4.1/Prime 4.6/Prime1M + Flash + Prime 4.1
  const payg3pOptions = [getDefaultOptionForUser(fastMode)]

  const customApex = getCustomApexOption()
  if (customApex !== undefined) {
    payg3pOptions.push(customApex)
  } else {
    // Add Apex 4.6 since Apex 4.5 is the default
    payg3pOptions.push(getApex46Option())
    if (checkApex1mAccess()) {
      payg3pOptions.push(getApex46_1MOption())
    }
  }

  const customPrime = getCustomPrimeOption()
  if (customPrime !== undefined) {
    payg3pOptions.push(customPrime)
  } else {
    // Add Prime 4.1, Prime 4.6 and Prime 4.6 1M
    payg3pOptions.push(getPrime41Option()) // This is the default opus
    payg3pOptions.push(getPrime46Option(fastMode))
    if (checkPrime1mAccess()) {
      payg3pOptions.push(getPrime46_1MOption(fastMode))
    }
  }
  const customFlash = getCustomFlashOption()
  if (customFlash !== undefined) {
    payg3pOptions.push(customFlash)
  } else {
    payg3pOptions.push(getFlashOption())
  }
  return payg3pOptions
}

// @[MODEL LAUNCH]: Add the new model ID to the appropriate family pattern below
// so the "newer version available" hint works correctly.
/**
 * Map a full model name to its family alias and the marketing name of the
 * version the alias currently resolves to. Used to detect when a user has
 * a specific older version pinned and a newer one is available.
 */
function getModelFamilyInfo(
  model: string,
): { alias: string; currentVersionName: string } | null {
  const canonical = getCanonicalName(model)

  // Apex family
  if (
    canonical.includes('claude-sonnet-4-6') ||
    canonical.includes('claude-sonnet-4-5') ||
    canonical.includes('claude-sonnet-4-') ||
    canonical.includes('claude-3-7-sonnet') ||
    canonical.includes('claude-3-5-sonnet')
  ) {
    const currentName = getMarketingNameForModel(getDefaultApexModel())
    if (currentName) {
      return { alias: 'Apex', currentVersionName: currentName }
    }
  }

  // Prime family
  if (canonical.includes('claude-opus-4')) {
    const currentName = getMarketingNameForModel(getDefaultPrimeModel())
    if (currentName) {
      return { alias: 'Prime', currentVersionName: currentName }
    }
  }

  // Flash family
  if (
    canonical.includes('claude-haiku') ||
    canonical.includes('claude-3-5-haiku')
  ) {
    const currentName = getMarketingNameForModel(getDefaultFlashModel())
    if (currentName) {
      return { alias: 'Flash', currentVersionName: currentName }
    }
  }

  return null
}

/**
 * Returns a ModelOption for a known Aether model with a human-readable
 * label, and an upgrade hint if a newer version is available via the alias.
 * Returns null if the model is not recognized.
 */
function getKnownModelOption(model: string): ModelOption | null {
  const marketingName = getMarketingNameForModel(model)
  if (!marketingName) return null

  const familyInfo = getModelFamilyInfo(model)
  if (!familyInfo) {
    return {
      value: model,
      label: marketingName,
      description: model,
    }
  }

  // Check if the alias currently resolves to a different (newer) version
  if (marketingName !== familyInfo.currentVersionName) {
    return {
      value: model,
      label: marketingName,
      description: `Newer version available · select ${familyInfo.alias} for ${familyInfo.currentVersionName}`,
    }
  }

  // Same version as the alias — just show the friendly name
  return {
    value: model,
    label: marketingName,
    description: model,
  }
}

export function getModelOptions(fastMode = false): ModelOption[] {
  const options = getModelOptionsBase(fastMode)

  // Add the custom model from the ANTHROPIC_CUSTOM_MODEL_OPTION env var
  const envCustomModel = process.env.ANTHROPIC_CUSTOM_MODEL_OPTION
  if (
    envCustomModel &&
    !options.some(existing => existing.value === envCustomModel)
  ) {
    options.push({
      value: envCustomModel,
      label: process.env.ANTHROPIC_CUSTOM_MODEL_OPTION_NAME ?? envCustomModel,
      description:
        process.env.ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION ??
        `Custom model (${envCustomModel})`,
    })
  }

  // Append additional model options fetched during bootstrap
  for (const opt of getGlobalConfig().additionalModelOptionsCache ?? []) {
    if (!options.some(existing => existing.value === opt.value)) {
      options.push(opt)
    }
  }

  // Add custom model from either the current model value or the initial one
  // if it is not already in the options.
  let customModel: ModelSetting = null
  const currentMainLoopModel = getUserSpecifiedModelSetting()
  const initialMainLoopModel = getInitialMainLoopModel()
  if (currentMainLoopModel !== undefined && currentMainLoopModel !== null) {
    customModel = currentMainLoopModel
  } else if (initialMainLoopModel !== null) {
    customModel = initialMainLoopModel
  }
  if (customModel === null || options.some(opt => opt.value === customModel)) {
    return filterModelOptionsByAllowlist(options)
  } else if (customModel === 'opusplan') {
    return filterModelOptionsByAllowlist([...options, getPrimePlanOption()])
  } else if (customModel === 'opus' && getAPIProvider() === 'firstParty') {
    return filterModelOptionsByAllowlist([
      ...options,
      getMaxPrimeOption(fastMode),
    ])
  } else if (customModel === 'opus[1m]' && getAPIProvider() === 'firstParty') {
    return filterModelOptionsByAllowlist([
      ...options,
      getMergedPrime1MOption(fastMode),
    ])
  } else {
    // Try to show a human-readable label for known Aether models, with an
    // upgrade hint if the alias now resolves to a newer version.
    const knownOption = getKnownModelOption(customModel)
    if (knownOption) {
      options.push(knownOption)
    } else {
      options.push({
        value: customModel,
        label: customModel,
        description: 'Custom model',
      })
    }
    return filterModelOptionsByAllowlist(options)
  }
}

/**
 * Filter model options by the availableModels allowlist.
 * Always preserves the "Default" option (value: null).
 */
function filterModelOptionsByAllowlist(options: ModelOption[]): ModelOption[] {
  const settings = getSettings_DEPRECATED() || {}
  if (!settings.availableModels) {
    return options // No restrictions
  }
  return options.filter(
    opt =>
      opt.value === null || (opt.value !== null && isModelAllowed(opt.value)),
  )
}
