import { z } from 'zod/v4'
import * as fs from 'fs/promises'
import * as path from 'path'
import { buildTool } from '../../Tool.js'
import { getCwd } from '../../utils/cwd.js'
import { expandPath } from '../../utils/path.js'

const inputSchema = z.strictObject({
  file_path: z.string().describe('The absolute path to the file to generate an outline for'),
})

type InputSchema = typeof inputSchema
type Input = z.infer<InputSchema>

export const ViewCodeOutlineTool = buildTool({
  name: 'ViewCodeOutline',
  searchHint: 'generate structural syntax map of classes, methods, and functions without reading the whole file',
  maxResultSizeChars: 100000,
  strict: true,
  async description() {
    return 'Generates a structural syntax map of classes, methods, and functions in a file without reading the whole layout. Ideal for legacy code mapping with ultra-low token consumption.'
  },
  async prompt() {
    return 'Use ViewCodeOutline when you want to understand the classes, methods, and functions of a code file without loading its full content to save tokens.'
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
    return input.file_path
  },
  getPath({ file_path }): string {
    return file_path || getCwd()
  },
  userFacingName() {
    return 'ViewCodeOutline'
  },
  async call({ file_path }, context) {
    const fullPath = expandPath(file_path)
    try {
      const content = await fs.readFile(fullPath, 'utf8')
      const lines = content.split(/\r?\n/)
      const outline: string[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineNum = i + 1
        
        // Match class definitions
        const classMatch = line.match(/^\s*(export\s+)?(class\s+\w+)/)
        if (classMatch) {
          outline.push(`Line ${lineNum}: Class [${classMatch[2]}]`)
          continue
        }

        // Match method/function definitions in JS/TS
        const funcMatch = line.match(/^\s*(export\s+)?(async\s+)?(function\s+\w+|\w+\s*\([^)]*\)\s*\{|\w+\s*=\s*\([^)]*\)\s*=>)/)
        if (funcMatch) {
          outline.push(`  Line ${lineNum}: Method/Function [${funcMatch[3].trim().replace(/\s*\{$/, '')}]`)
          continue
        }

        // Python style def
        const pyMatch = line.match(/^\s*(def\s+\w+)/)
        if (pyMatch) {
          outline.push(`  Line ${lineNum}: PyDef [${pyMatch[1].trim()}]`)
        }
      }

      const result = outline.length > 0 
        ? outline.join('\n') 
        : 'No classes or functions detected in the outline scan.'

      return {
        data: {
          outline: result,
          filePath: file_path,
        }
      }
    } catch (err: any) {
      throw new Error(`Failed to generate outline for ${file_path}: ${err.message}`)
    }
  },
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `### Structural Syntax Outline for ${data.filePath}\n\n${data.outline}`,
    }
  },
  renderToolUseMessage(input) {
    return `Scanning structural outline of ${input.file_path || 'unknown file'}`
  }
})
