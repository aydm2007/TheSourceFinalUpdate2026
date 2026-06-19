// Content for the claude-api bundled skill.
// Each .md file is inlined as a string at build time via Bun's text loader.

import csharpZenithApi from './claude-api/csharp/claude-api.md'
import curlExamples from './claude-api/curl/examples.md'
import goZenithApi from './claude-api/go/claude-api.md'
import javaZenithApi from './claude-api/java/claude-api.md'
import phpZenithApi from './claude-api/php/claude-api.md'
import pythonAgentSdkPatterns from './claude-api/python/agent-sdk/patterns.md'
import pythonAgentSdkReadme from './claude-api/python/agent-sdk/README.md'
import pythonZenithApiBatches from './claude-api/python/claude-api/batches.md'
import pythonZenithApiFilesApi from './claude-api/python/claude-api/files-api.md'
import pythonZenithApiReadme from './claude-api/python/claude-api/README.md'
import pythonZenithApiStreaming from './claude-api/python/claude-api/streaming.md'
import pythonZenithApiToolUse from './claude-api/python/claude-api/tool-use.md'
import rubyZenithApi from './claude-api/ruby/claude-api.md'
import skillPrompt from './claude-api/SKILL.md'
import sharedErrorCodes from './claude-api/shared/error-codes.md'
import sharedLiveSources from './claude-api/shared/live-sources.md'
import sharedModels from './claude-api/shared/models.md'
import sharedPromptCaching from './claude-api/shared/prompt-caching.md'
import sharedToolUseConcepts from './claude-api/shared/tool-use-concepts.md'
import typescriptAgentSdkPatterns from './claude-api/typescript/agent-sdk/patterns.md'
import typescriptAgentSdkReadme from './claude-api/typescript/agent-sdk/README.md'
import typescriptZenithApiBatches from './claude-api/typescript/claude-api/batches.md'
import typescriptZenithApiFilesApi from './claude-api/typescript/claude-api/files-api.md'
import typescriptZenithApiReadme from './claude-api/typescript/claude-api/README.md'
import typescriptZenithApiStreaming from './claude-api/typescript/claude-api/streaming.md'
import typescriptZenithApiToolUse from './claude-api/typescript/claude-api/tool-use.md'

// @[MODEL LAUNCH]: Update the model IDs/names below. These are substituted into {{VAR}}
// placeholders in the .md files at runtime before the skill prompt is sent.
// After updating these constants, manually update the two files that still hardcode models:
//   - claude-api/SKILL.md (Current Models pricing table)
//   - claude-api/shared/models.md (full model catalog with legacy versions and alias mappings)
export const SKILL_MODEL_VARS = {
  OPUS_ID: 'claude-opus-4-6',
  OPUS_NAME: 'Zenith Prime 4.6',
  SONNET_ID: 'claude-sonnet-4-6',
  SONNET_NAME: 'Zenith Apex 4.6',
  HAIKU_ID: 'claude-haiku-4-5',
  HAIKU_NAME: 'Zenith Flash 4.5',
  // Previous Apex ID — used in "do not append date suffixes" example in SKILL.md.
  PREV_SONNET_ID: 'claude-sonnet-4-5',
} satisfies Record<string, string>

export const SKILL_PROMPT: string = skillPrompt

export const SKILL_FILES: Record<string, string> = {
  'csharp/claude-api.md': csharpZenithApi,
  'curl/examples.md': curlExamples,
  'go/claude-api.md': goZenithApi,
  'java/claude-api.md': javaZenithApi,
  'php/claude-api.md': phpZenithApi,
  'python/agent-sdk/README.md': pythonAgentSdkReadme,
  'python/agent-sdk/patterns.md': pythonAgentSdkPatterns,
  'python/claude-api/README.md': pythonZenithApiReadme,
  'python/claude-api/batches.md': pythonZenithApiBatches,
  'python/claude-api/files-api.md': pythonZenithApiFilesApi,
  'python/claude-api/streaming.md': pythonZenithApiStreaming,
  'python/claude-api/tool-use.md': pythonZenithApiToolUse,
  'ruby/claude-api.md': rubyZenithApi,
  'shared/error-codes.md': sharedErrorCodes,
  'shared/live-sources.md': sharedLiveSources,
  'shared/models.md': sharedModels,
  'shared/prompt-caching.md': sharedPromptCaching,
  'shared/tool-use-concepts.md': sharedToolUseConcepts,
  'typescript/agent-sdk/README.md': typescriptAgentSdkReadme,
  'typescript/agent-sdk/patterns.md': typescriptAgentSdkPatterns,
  'typescript/claude-api/README.md': typescriptZenithApiReadme,
  'typescript/claude-api/batches.md': typescriptZenithApiBatches,
  'typescript/claude-api/files-api.md': typescriptZenithApiFilesApi,
  'typescript/claude-api/streaming.md': typescriptZenithApiStreaming,
  'typescript/claude-api/tool-use.md': typescriptZenithApiToolUse,
}
