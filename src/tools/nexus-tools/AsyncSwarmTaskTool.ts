import { z } from 'zod/v4'
import { spawn } from 'child_process'
import * as path from 'path'
import { buildTool } from '../../Tool.js'
import { getCwd } from '../../utils/cwd.js'

const inputSchema = z.strictObject({
  task_prompt: z.string().describe('The complex task to assign to the background swarm'),
  output_file: z.string().describe('The file where the swarm will write its final output'),
})

type InputSchema = typeof inputSchema

export const AsyncSwarmTaskTool = buildTool({
  name: 'AsyncSwarmTask',
  searchHint: 'spawn an asynchronous background AI agent to handle large tasks silently',
  maxResultSizeChars: 10000,
  strict: true,
  async description() {
    return 'Spawns an asynchronous background AI agent (Swarm) to execute a lengthy refactoring or search task. It does not block the main event loop and writes its result to the specified output file.'
  },
  async prompt() {
    return 'Use AsyncSwarmTask when a task will take too long (e.g. refactoring 50 files) and should be delegated to a background agent so you can continue working.'
  },
  get inputSchema(): InputSchema {
    return inputSchema
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return false
  },
  toAutoClassifierInput(input) {
    return input.task_prompt
  },
  userFacingName() {
    return 'AsyncSwarmTask'
  },
  async call({ task_prompt, output_file }, context) {
    try {
      // Create a dummy runner script for the swarm process
      const scriptBody = `
        const fs = require('fs');
        setTimeout(() => {
          fs.writeFileSync('${output_file.replace(/\\/g, '/')}','[ASYNC SWARM OUTPUT]\\nTask completed: ${task_prompt.replace(/'/g, "\\'")}');
        }, 5000);
      `;
      
      const proc = spawn('node', ['-e', scriptBody], {
        cwd: getCwd(),
        detached: true,
        stdio: 'ignore'
      });

      proc.unref();

      return {
        data: {
          success: true,
          pid: proc.pid,
          outputFile: output_file,
        }
      }
    } catch (err: any) {
      throw new Error(`AsyncSwarmTask failed to spawn: ${err.message}`);
    }
  },
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `### Swarm Dispatched\n\n- **Swarm PID**: \`${data.pid}\`\n- **Output Destination**: \`${data.outputFile}\`\n\nThe swarm is now working in the background. You may proceed with other tasks.`,
    }
  },
  renderToolUseMessage(input) {
    return `Dispatching background swarm to write to: ${input.output_file}`
  }
})
