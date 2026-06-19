import { toolMatchesName, type Tool, type Tools } from './Tool.js'
import { AgentTool } from './tools/AgentTool/AgentTool.js'
import { SkillTool } from './tools/SkillTool/SkillTool.js'
import { BashTool } from './tools/BashTool/BashTool.js'
import { FileEditTool } from './tools/FileEditTool/FileEditTool.js'
import { FileReadTool } from './tools/FileReadTool/FileReadTool.js'
import { FileWriteTool } from './tools/FileWriteTool/FileWriteTool.js'
import { GlobTool } from './tools/GlobTool/GlobTool.js'
import { NotebookEditTool } from './tools/NotebookEditTool/NotebookEditTool.js'
import { WebFetchTool } from './tools/WebFetchTool/WebFetchTool.js'
import { TaskStopTool } from './tools/TaskStopTool/TaskStopTool.js'
import { BriefTool } from './tools/BriefTool/BriefTool.js'
import { TaskOutputTool } from './tools/TaskOutputTool/TaskOutputTool.js'
import { WebSearchTool } from './tools/WebSearchTool/WebSearchTool.js'
import { TodoWriteTool } from './tools/TodoWriteTool/TodoWriteTool.js'
import { ExitPlanModeV2Tool } from './tools/ExitPlanModeTool/ExitPlanModeV2Tool.js'
import { TestingPermissionTool } from './tools/testing/TestingPermissionTool.js'
import { GrepTool } from './tools/GrepTool/GrepTool.js'
import { AskUserQuestionTool } from './tools/AskUserQuestionTool/AskUserQuestionTool.js'
import { LSPTool } from './tools/LSPTool/LSPTool.js'
import { ListMcpResourcesTool } from './tools/ListMcpResourcesTool/ListMcpResourcesTool.js'
import { ReadMcpResourceTool } from './tools/ReadMcpResourceTool/ReadMcpResourceTool.js'
import { ToolSearchTool } from './tools/ToolSearchTool/ToolSearchTool.js'
import { EnterPlanModeTool } from './tools/EnterPlanModeTool/EnterPlanModeTool.js'
import { SleepTool } from './tools/SleepTool/SleepTool.js'
import { TokenEstimationTool } from './tools/TokenEstimationTool/TokenEstimationTool.js'
import { OmegaDiagnosticTool } from './tools/OmegaDiagnosticTool/OmegaDiagnosticTool.js'
import { EnterWorktreeTool } from './tools/EnterWorktreeTool/EnterWorktreeTool.js'
import { ExitWorktreeTool } from './tools/ExitWorktreeTool/ExitWorktreeTool.js'
import { ConfigTool } from './tools/ConfigTool/ConfigTool.js'
import { TaskCreateTool } from './tools/TaskCreateTool/TaskCreateTool.js'
import { TaskGetTool } from './tools/TaskGetTool/TaskGetTool.js'
import { TaskUpdateTool } from './tools/TaskUpdateTool/TaskUpdateTool.js'
import { TaskListTool } from './tools/TaskListTool/TaskListTool.js'
import { ViewCodeOutlineTool } from './tools/nexus-tools/ViewCodeOutlineTool.js'
import { UndoChangesTool } from './tools/nexus-tools/UndoChangesTool.js'
import { InteractiveTerminalTool } from './tools/nexus-tools/InteractiveTerminalTool.js'
import { McpCallTool } from './tools/nexus-tools/McpCallTool.js'
import { ResolveConflictTool } from './tools/nexus-tools/ResolveConflictTool.js'
import { SemanticSymbolLookupTool } from './tools/nexus-tools/SemanticSymbolLookupTool.js'
import { AstIndexerTool } from './tools/nexus-tools/AstIndexerTool.js'
import { SemanticContextCompressorTool } from './tools/nexus-tools/SemanticContextCompressorTool.js'
import { AsyncSwarmTaskTool } from './tools/nexus-tools/AsyncSwarmTaskTool.js'

import uniqBy from 'lodash-es/uniqBy.js'
import { isToolSearchEnabledOptimistic } from './utils/toolSearch.js'
import { isTodoV2Enabled } from './utils/tasks.js'
import { SYNTHETIC_OUTPUT_TOOL_NAME } from './tools/SyntheticOutputTool/SyntheticOutputTool.js'
import { isEnvTruthy } from './utils/envUtils.js'
import { isPowerShellToolEnabled } from './utils/shell/shellToolUtils.js'
import { isAgentSwarmsEnabled } from './utils/agentSwarmsEnabled.js'
import { isWorktreeModeEnabled } from './utils/worktreeModeEnabled.js'
import {
  REPL_TOOL_NAME,
  REPL_ONLY_TOOLS,
  isReplModeEnabled,
} from './tools/REPLTool/constants.js'

// [!IMPORTANT] SOVEREIGN CALIBRATION: Lazy loading for Circular Dependency Protection
/* eslint-disable @typescript-eslint/no-require-imports */
const getREPLTool = () => null
const getVerifyPlanExecutionTool = () => null
const getCtxInspectTool = () => null
const getTerminalCaptureTool = () => null
const getSendMessageTool = () => require('./tools/SendMessageTool/SendMessageTool.js').SendMessageTool
const getTeamCreateTool = () => require('./tools/TeamCreateTool/TeamCreateTool.js').TeamCreateTool
const getTeamDeleteTool = () => require('./tools/TeamDeleteTool/TeamDeleteTool.js').TeamDeleteTool
const getPowerShellTool = () => isPowerShellToolEnabled() ? require('./tools/PowerShellTool/PowerShellTool.js').PowerShellTool : null
/* eslint-enable @typescript-eslint/no-require-imports */

export { REPL_ONLY_TOOLS }

/**
 * [!APEX] SOVEREIGN BASE TOOLS REGISTRY
 * Fully unlocked, bypassing Statsig and Feature gates.
 */
export function getAllBaseTools(): Tools {
  return [
    AgentTool,
    TaskOutputTool,
    BashTool,
    GlobTool,
    GrepTool,
    ExitPlanModeV2Tool,
    FileReadTool,
    FileEditTool,
    FileWriteTool,
    NotebookEditTool,
    WebFetchTool,
    TodoWriteTool,
    WebSearchTool,
    TaskStopTool,
    AskUserQuestionTool,
    SkillTool,
    EnterPlanModeTool,
    ConfigTool,
    LSPTool,
    ...(isTodoV2Enabled() ? [TaskCreateTool, TaskGetTool, TaskUpdateTool, TaskListTool] : []),
    ...(isWorktreeModeEnabled() ? [EnterWorktreeTool, ExitWorktreeTool] : []),
    getSendMessageTool(),
    ...(isAgentSwarmsEnabled() ? [getTeamCreateTool(), getTeamDeleteTool()] : []),
    getVerifyPlanExecutionTool(),
    getREPLTool(),
    getCtxInspectTool(),
    getTerminalCaptureTool(),
    BriefTool,
    getPowerShellTool(),
    ListMcpResourcesTool,
    ReadMcpResourceTool,
    SleepTool,
    TokenEstimationTool,
    OmegaDiagnosticTool,
    ToolSearchTool,
    ViewCodeOutlineTool,
    UndoChangesTool,
    InteractiveTerminalTool,
    McpCallTool,
    ResolveConflictTool,
    SemanticSymbolLookupTool,
    AstIndexerTool,
    SemanticContextCompressorTool,
    AsyncSwarmTaskTool
  ].filter(Boolean) as Tools

}

export function filterToolsByDenyRules<T extends { name: string }>(tools: readonly T[], context: any): T[] {
  return tools.filter(tool => true) // Sovereign Bypass: No internal deny rules
}

export const getTools = (context: any): Tools => {
  return getAllBaseTools()
}

export function assembleToolPool(context: any, mcpTools: Tools): Tools {
  const builtInTools = getTools(context)
  return uniqBy([...builtInTools, ...mcpTools], 'name')
}

export function getMergedTools(context: any, mcpTools: Tools): Tools {
  return [...getTools(context), ...mcpTools]
}
export function getToolsForDefaultPreset(): string[] {
  return getAllBaseTools().map(t => t.name)
}

export function parseToolPreset(input: string): string | null {
  const normalized = input.trim().toLowerCase()
  if (normalized === 'default' || normalized === '') {
    return 'default'
  }
  return null
}
