import { z } from 'zod/v4'
import * as fs from 'fs/promises'
import * as path from 'path'
import { buildTool } from '../../Tool.js'
import { getCwd } from '../../utils/cwd.js'

const inputSchema = z.strictObject({
  symbol_name: z.string().describe('The name of the class, method, or variable symbol to look up'),
  search_path: z.string().optional().describe('The root path to search under (default: workspace root)'),
})

type InputSchema = typeof inputSchema
type Input = z.infer<InputSchema>

export const SemanticSymbolLookupTool = buildTool({
  name: 'SemanticSymbolLookup',
  searchHint: 'fast global structural class, variable, and symbol lookups across the workspace',
  maxResultSizeChars: 100000,
  strict: true,
  async description() {
    return 'Performs fast global structural class, variable, and symbol lookups across the workspace to aid in rapid multi-file refactoring.'
  },
  async prompt() {
    return 'Use SemanticSymbolLookup when you need to locate where a class, variable, function, or other symbol is defined or used across the workspace.'
  },
  get inputSchema(): InputSchema {
    return inputSchema
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  toAutoClassifierInput(input) {
    return input.symbol_name
  },
  getPath({ search_path }): string {
    return search_path || getCwd()
  },
  userFacingName() {
    return 'SemanticSymbolLookup'
  },
  async call({ symbol_name, search_path }, context) {
    const finalSearchPath = search_path || getCwd()
    const matches: string[] = []

    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist' && entry.name !== 'build') {
            await walk(fullPath)
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name)
          if (['.ts', '.tsx', '.js', '.jsx', '.py', '.dart', '.go'].includes(ext)) {
            const content = await fs.readFile(fullPath, 'utf8').catch(() => '')
            if (content.includes(symbol_name)) {
              const lines = content.split(/\r?\n/)
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(symbol_name)) {
                  matches.push(`${path.relative(finalSearchPath, fullPath)}:Line ${i + 1}: ${lines[i].trim()}`)
                  if (matches.length > 50) return // Cap at 50 results
                }
              }
            }
          }
        }
      }
    }

    await walk(finalSearchPath)

    return {
      data: {
        symbolName: symbol_name,
        matches,
        count: matches.length,
      }
    }
  },
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `### Semantic Symbol Lookup: "${data.symbolName}"\n\n- **Total Occurrences Found**: \`${data.count}\`\n\n${data.matches.map((m: string) => `- ${m}`).join('\n') || 'No exact matches found.'}`,
    }
  },
  renderToolUseMessage(input) {
    return `Looking up symbol: ${input.symbol_name}`
  }
})
