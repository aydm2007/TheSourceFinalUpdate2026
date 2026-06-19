/**
 * AutoDreamTool — Sovereign Sigma V12.0
 *
 * Proactive self-planning: decomposes a high-level goal into an ordered
 * phased execution plan with complexity estimates and agent type suggestions.
 *
 * Design principle: deterministic decomposition — no LLM hallucination.
 * Template-based structural phases ensure reproducible, auditable plans.
 */

import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import { logForDebugging } from '../../utils/debug.js'

export type DreamPhase = {
  id: string
  title: string
  description: string
  estimatedComplexity: 'low' | 'medium' | 'high'
  dependsOn: string[]
  suggestedAgentType?: string
}

export type DreamPlan = {
  goal: string
  phases: DreamPhase[]
  totalComplexity: 'low' | 'medium' | 'high'
  generatedAt: string
}

const inputSchema = z.object({
  goal: z.string().describe('The high-level goal to decompose into a plan.'),
  context: z
    .string()
    .optional()
    .describe('Optional context about the codebase or constraints.'),
  maxPhases: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .default(8)
    .describe('Maximum number of phases to generate. Defaults to 8.'),
})

type InputSchema = typeof inputSchema
type Output = { data: string }

function estimateComplexity(description: string): 'low' | 'medium' | 'high' {
  const lower = description.toLowerCase()
  const highSignals = [
    'migration', 'refactor', 'multi-agent', 'security', 'database', 'api integration',
  ]
  const mediumSignals = [
    'update', 'enhance', 'extend', 'fix', 'integrate', 'test',
  ]
  if (highSignals.some(s => lower.includes(s))) return 'high'
  if (mediumSignals.some(s => lower.includes(s))) return 'medium'
  return 'low'
}

function dominantComplexity(
  phases: DreamPhase[],
): 'low' | 'medium' | 'high' {
  if (phases.some(p => p.estimatedComplexity === 'high')) return 'high'
  if (phases.some(p => p.estimatedComplexity === 'medium')) return 'medium'
  return 'low'
}

export const AutoDreamTool = buildTool({
  name: 'NexusAutoDream',
  async description() {
    return 'Decompose a high-level goal into a structured execution plan with phases, complexity estimates, and agent type suggestions.'
  },
  inputSchema,
  maxResultSizeChars: 20_000,
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  async prompt() {
    return ''
  },
  userFacingName: () => 'NexusAutoDream',
  mapToolResultToToolResultBlockParam(content, toolUseId) {
    const text =
      typeof content === 'object' && 'data' in content
        ? String(content.data)
        : JSON.stringify(content, null, 2)
    return {
      type: 'tool_result' as const,
      tool_use_id: toolUseId,
      content: text,
    }
  },
  toAutoClassifierInput(input) {
    return input.goal.slice(0, 120)
  },
  async call({ goal, context, maxPhases }) {
    logForDebugging(`[AutoDream] Generating plan for: ${goal.slice(0, 80)}`)

    const phaseTemplates = [
      {
        title: 'Reconnaissance',
        description: `Analyze codebase structure relevant to: ${goal}. Identify affected files, dependencies, and potential conflicts.`,
        suggestedAgentType: 'Explore',
      },
      {
        title: 'Architecture Design',
        description: `Design the technical approach for: ${goal}. Define interfaces, data flow, and component boundaries.`,
        suggestedAgentType: 'Plan',
      },
      {
        title: 'Core Implementation',
        description: `Implement the primary logic for: ${goal}. Follow established patterns in the codebase.${context ? ` Context: ${context}` : ''}`,
        suggestedAgentType: 'general-purpose',
      },
      {
        title: 'Integration',
        description: `Wire the new implementation into existing systems. Update imports, registrations, and entry points.`,
        suggestedAgentType: 'general-purpose',
      },
      {
        title: 'Testing',
        description: `Write and run tests for the implementation. Cover unit, integration, and edge cases.`,
        suggestedAgentType: 'general-purpose',
      },
      {
        title: 'Forensic Audit',
        description: `Verify implementation integrity. Check for regressions, type errors, and unintended side effects using OmegaDiagnostic.`,
        suggestedAgentType: 'Explore',
      },
      {
        title: 'Documentation',
        description: `Update relevant documentation, CHANGELOG, and inline comments for maintainability.`,
        suggestedAgentType: 'general-purpose',
      },
      {
        title: 'Final Verification',
        description: `Run full test suite and validate against original requirements. Confirm goal completion.`,
        suggestedAgentType: 'general-purpose',
      },
    ]

    const limited = phaseTemplates.slice(0, maxPhases)

    const phases: DreamPhase[] = limited.map((t, i) => ({
      id: `phase_${i + 1}`,
      title: t.title,
      description: t.description,
      estimatedComplexity: estimateComplexity(t.description),
      dependsOn: i === 0 ? [] : [`phase_${i}`],
      suggestedAgentType: t.suggestedAgentType,
    }))

    const plan: DreamPlan = {
      goal,
      phases,
      totalComplexity: dominantComplexity(phases),
      generatedAt: new Date().toISOString(),
    }

    const output = [
      `# AutoDream Plan`,
      `**Goal**: ${goal}`,
      `**Total Complexity**: ${plan.totalComplexity.toUpperCase()}`,
      `**Phases**: ${phases.length}`,
      '',
      ...phases.map(
        p =>
          `## Phase ${p.id}: ${p.title} [${p.estimatedComplexity}]\n${p.description}\n_Agent_: ${p.suggestedAgentType ?? 'any'} | _Depends on_: ${p.dependsOn.join(', ') || 'none'}`,
      ),
      '',
      '---',
      `\`\`\`json\n${JSON.stringify(plan, null, 2)}\n\`\`\``,
    ].join('\n\n')

    return { data: output }
  },
} satisfies ToolDef<InputSchema, Output>)
