/**
 * Nexus Tools Registry — Sovereign Sigma V12.0
 *
 * Central export for all Nexus-specific built-in tools.
 * Enabled via feature('NEXUS_TOOLS') gate in tools.ts.
 *
 * Tool names follow the project's PascalCase convention (no mcp__ prefix).
 */

import { AutoDreamTool } from './AutoDreamTool/index.js'
import { MemoryManagerTool } from './MemoryManagerTool/index.js'
import { OmegaDiagnosticTool } from './OmegaDiagnosticTool/index.js'
import { StateManagerTool } from './StateManager/index.js'
import { brainChannel, NexusBrainChannel } from './BrainChannel.js'
import type { Tool } from '../Tool.js'

/**
 * All Nexus Sovereign tools, ordered by operational layer:
 * 1. Diagnostic  — system health and integrity verification
 * 2. Memory      — persistent knowledge management
 * 3. State       — runtime AppState access and mutation
 * 4. Planning    — proactive goal decomposition
 */
export const NEXUS_TOOLS: readonly Tool[] = [
  OmegaDiagnosticTool,
  MemoryManagerTool,
  StateManagerTool,
  AutoDreamTool,
] as const

export {
  OmegaDiagnosticTool,
  MemoryManagerTool,
  StateManagerTool,
  AutoDreamTool,
  brainChannel,
  NexusBrainChannel,
}

/** Union of all nexus tool names for type-safe lookup. */
export type NexusToolName =
  | 'NexusOmegaDiagnostic'
  | 'NexusMemoryManager'
  | 'NexusStateManager'
  | 'NexusAutoDream'
