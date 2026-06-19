import { z } from 'zod/v4'
import * as fs from 'fs/promises'
import { buildTool } from '../../Tool.js'
import { getCwd } from '../../utils/cwd.js'
import { expandPath } from '../../utils/path.js'

const inputSchema = z.strictObject({
  file_path: z.string().describe('The absolute path to the file to revert changes for'),
  backup_suffix: z.string().optional().describe('The custom backup file suffix (default: .bak)'),
})

type InputSchema = typeof inputSchema
type Input = z.infer<InputSchema>

export const UndoChangesTool = buildTool({
  name: 'UndoChanges',
  searchHint: 'atomic roll-back of applied AST or manual patches',
  maxResultSizeChars: 10000,
  strict: true,
  async description() {
    return 'Performs an atomic roll-back of the applied changes to a file if a patch or compilation fails, restoring the prior state from a backup file.'
  },
  async prompt() {
    return 'Use UndoChanges to quickly restore a file to its previous state (from a backup file) in case of structural compilation failure or bad edits.'
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
  isDestructive() {
    return true
  },
  toAutoClassifierInput(input) {
    return input.file_path
  },
  getPath({ file_path }): string {
    return file_path || getCwd()
  },
  userFacingName() {
    return 'UndoChanges'
  },
  async call({ file_path, backup_suffix = '.bak' }, context) {
    const fullPath = expandPath(file_path)
    const backupPath = fullPath + backup_suffix
    
    try {
      try {
        await fs.access(backupPath)
        // Revert the file from its backup file
        const backupContent = await fs.readFile(backupPath, 'utf8')
        await fs.writeFile(fullPath, backupContent, 'utf8')
        // Remove the backup file cleanly
        await fs.unlink(backupPath).catch(() => {})

        return {
          data: {
            success: true,
            filePath: file_path,
            message: `Successfully rolled back changes. Restored ${file_path} from backup file ${backupPath}.`
          }
        }
      } catch (e) {
        // Fallback to git checkout
        const { execSync } = require('child_process');
        execSync(`git checkout -- "${fullPath}"`);
        return {
          data: {
            success: true,
            filePath: file_path,
            message: `Backup file not found. Successfully rolled back using 'git checkout -- ${file_path}'.`
          }
        }
      }
    } catch (err: any) {
      throw new Error(`Failed to undo changes for ${file_path}: Both backup restore and git checkout failed. Error: ${err.message}`)
    }
  },
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `### Rollback Action Report\n\n${data.message}`,
    }
  },
  renderToolUseMessage(input) {
    return `Rolling back changes for ${input.file_path || 'unknown file'}`
  }
})
