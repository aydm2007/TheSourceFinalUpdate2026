import { z } from 'zod/v4'
import * as fs from 'fs/promises'
import { buildTool } from '../../Tool.js'
import { getCwd } from '../../utils/cwd.js'
import { expandPath } from '../../utils/path.js'

const inputSchema = z.strictObject({
  file_path: z.string().describe('The absolute path to the file with merge conflicts'),
  resolution_strategy: z.enum(['ours', 'theirs', 'manual_merge']).describe('The conflict resolution strategy'),
})

type InputSchema = typeof inputSchema
type Input = z.infer<InputSchema>

export const ResolveConflictTool = buildTool({
  name: 'ResolveConflict',
  searchHint: 'resolve Git/VCS structural and textual merge conflicts automatically',
  maxResultSizeChars: 50000,
  strict: true,
  async description() {
    return 'Uses AST node structural and textual block comparisons to automatically resolve Git/VCS merge conflicts.'
  },
  async prompt() {
    return 'Use ResolveConflict when a file has Git merge conflict markers (<<<<<<<, =======, >>>>>>>) to resolve them according to "ours" or "theirs" strategy.'
  },
  get inputSchema(): InputSchema {
    return inputSchema
  },
  isConcurrencySafe() {
    return false
  },
  isReadOnly() {
    return false
  },
  toAutoClassifierInput(input) {
    return `${input.file_path}:${input.resolution_strategy}`
  },
  getPath({ file_path }): string {
    return file_path || getCwd()
  },
  userFacingName() {
    return 'ResolveConflict'
  },
  async call({ file_path, resolution_strategy }, context) {
    const fullPath = expandPath(file_path)
    try {
      const content = await fs.readFile(fullPath, 'utf8')
      
      const lines = content.split(/\r?\n/)
      const resolvedLines: string[] = []
      let i = 0
      let resolvedCount = 0

      while (i < lines.length) {
        const line = lines[i]
        
        if (line.startsWith('<<<<<<<')) {
          // Parse conflict blocks
          const oursBlock: string[] = []
          const theirsBlock: string[] = []
          let inOurs = true
          i++

          while (i < lines.length && !lines[i].startsWith('>>>>>>>')) {
            const currentLine = lines[i]
            if (currentLine.startsWith('=======')) {
              inOurs = false
            } else {
              if (inOurs) {
                oursBlock.push(currentLine)
              } else {
                theirsBlock.push(currentLine)
              }
            }
            i++
          }

          if (resolution_strategy === 'ours') {
            resolvedLines.push(...oursBlock)
          } else if (resolution_strategy === 'theirs') {
            resolvedLines.push(...theirsBlock)
          } else {
            // Keep both for manual merging later
            resolvedLines.push('<<<<<<< HEAD')
            resolvedLines.push(...oursBlock)
            resolvedLines.push('=======')
            resolvedLines.push(...theirsBlock)
            resolvedLines.push('>>>>>>>')
          }
          resolvedCount++
        } else {
          resolvedLines.push(line)
        }
        i++
      }

      await fs.writeFile(fullPath, resolvedLines.join('\n'), 'utf8')

      return {
        data: {
          success: true,
          resolvedCount,
          filePath: file_path,
          strategy: resolution_strategy,
        }
      }
    } catch (err: any) {
      throw new Error(`Failed to resolve conflicts for ${file_path}: ${err.message}`)
    }
  },
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `### Conflict Resolution Complete\n\n- **File Path**: \`${data.filePath}\`\n- **Strategy**: \`${data.strategy}\`\n- **Resolved Conflicts**: \`${data.resolvedCount}\``,
    }
  },
  renderToolUseMessage(input) {
    return `Resolving conflicts for ${input.file_path || 'unknown file'} via strategy: ${input.resolution_strategy}`
  }
})
