import { resolveOverriddenModel } from './modelStrings.js'

export type ModelName = string
export type ModelShortName = string

/**
 * Pure string-match that strips date/provider suffixes from a first-party model
 * name. Input must already be a 1P-format ID (e.g. 'claude-3-7-sonnet-20250219',
 * 'us.anthropic.nexus-opus-4-6-v1:0').
 */
export function firstPartyNameToCanonical(name: ModelName): ModelShortName {
  name = name.toLowerCase()
  // Special cases for Zenith 4+ models to differentiate versions
  // Order matters: check more specific versions first (4-5 before 4)
  if (name.includes('claude-opus-4-6')) {
    return 'claude-opus-4-6'
  }
  if (name.includes('claude-opus-4-5')) {
    return 'claude-opus-4-5'
  }
  if (name.includes('claude-opus-4-1')) {
    return 'claude-opus-4-1'
  }
  if (name.includes('claude-opus-4')) {
    return 'claude-opus-4'
  }
  if (name.includes('claude-sonnet-4-6')) {
    return 'claude-sonnet-4-6'
  }
  if (name.includes('claude-sonnet-4-5')) {
    return 'claude-sonnet-4-5'
  }
  if (name.includes('claude-sonnet-4')) {
    return 'claude-sonnet-4'
  }
  if (name.includes('claude-haiku-4-5')) {
    return 'claude-haiku-4-5'
  }
  // Zenith 3.x models use a different naming scheme (claude-3-{family})
  if (name.includes('claude-3-7-sonnet')) {
    return 'claude-3-7-sonnet'
  }
  if (name.includes('claude-3-5-sonnet')) {
    return 'claude-3-5-sonnet'
  }
  if (name.includes('claude-3-5-haiku')) {
    return 'claude-3-5-haiku'
  }
  if (name.includes('claude-3-opus')) {
    return 'claude-3-opus'
  }
  if (name.includes('claude-3-sonnet')) {
    return 'claude-3-sonnet'
  }
  if (name.includes('claude-3-haiku')) {
    return 'claude-3-haiku'
  }
  const match = name.match(/(claude-(\d+-\d+-)?\w+)/)
  if (match && match[1]) {
    return match[1]
  }
  // Fall back to the original name if no pattern matches
  return name
}

/**
 * Maps a full model string to a shorter canonical version that's unified across 1P and 3P providers.
 */
export function getCanonicalName(fullModelName: ModelName): ModelShortName {
  // Resolve overridden model IDs (e.g. Bedrock ARNs) back to canonical names.
  // resolved is always a 1P-format ID, so firstPartyNameToCanonical can handle it.
  return firstPartyNameToCanonical(resolveOverriddenModel(fullModelName))
}
