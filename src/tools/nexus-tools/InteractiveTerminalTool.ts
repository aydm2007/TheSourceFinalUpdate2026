import { z } from 'zod/v4'
import { spawn } from 'child_process'
import { buildTool } from '../../Tool.js'
import { getCwd } from '../../utils/cwd.js'

const inputSchema = z.strictObject({
  action: z.enum(['spawn', 'list', 'terminate']).optional().describe('Action to perform (default: spawn). Use list to see active sessions, terminate to kill one.'),
  command: z.string().optional().describe('The command to execute in the persistent background session (required for spawn)'),
  cwd: z.string().optional().describe('The working directory for command execution'),
  args: z.array(z.string()).optional().describe('Arguments for the command'),
  session_id: z.string().optional().describe('The ID of the session to terminate (required for terminate)'),
})

type InputSchema = typeof inputSchema
type Input = z.infer<InputSchema>

const activeSessions = new Map<string, any>()

export const InteractiveTerminalTool = buildTool({
  name: 'InteractiveTerminal',
  searchHint: 'spawns persistent, pseudo-TTY background sessions for long-running daemon servers and tests',
  maxResultSizeChars: 50000,
  strict: true,
  async description() {
    return 'Spawns a persistent, pseudo-TTY background session rather than spawning cold isolated Bash/PowerShell commands. Crucial for executing long-running daemon tests or local dev servers.'
  },
  async prompt() {
    return 'Use InteractiveTerminal to launch persistent processes such as local servers, compilers, or interactive shell environments that remain active.'
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
    return input.command
  },
  userFacingName() {
    return 'InteractiveTerminal'
  },
  async call({ action = 'spawn', command, cwd, args = [], session_id }, context) {
    if (action === 'list') {
      if (activeSessions.size === 0) {
        return { data: { success: true, message: 'No active terminal sessions.' } }
      }
      const list = Array.from(activeSessions.entries()).map(([id, proc]) => `- Session ID: ${id} (PID: ${proc.pid})`).join('\n')
      return { data: { success: true, message: `Active Sessions:\n${list}` } }
    }

    if (action === 'terminate') {
      if (!session_id) throw new Error('session_id is required for terminate action.')
      const proc = activeSessions.get(session_id)
      if (!proc) throw new Error(`Session ${session_id} not found or already terminated.`)
      
      try {
        process.kill(proc.pid, 'SIGTERM')
      } catch (e) {
        // ignore if already dead
      }
      activeSessions.delete(session_id)
      return { data: { success: true, message: `Session ${session_id} terminated successfully.` } }
    }

    if (!command) throw new Error('command is required for spawn action.')

    const finalCwd = cwd || getCwd()
    
    try {
      // Spawn pseudo-TTY background process
      const proc = spawn(command, args, {
        cwd: finalCwd,
        shell: true,
        detached: true,
        stdio: 'pipe'
      })

      proc.unref()

      const sessionId = `tty_${Date.now()}_${proc.pid}`
      activeSessions.set(sessionId, proc)

      // Collect initial output delta
      let outputBuffer = ''
      proc.stdout?.on('data', (data) => {
        outputBuffer += data.toString()
      })
      proc.stderr?.on('data', (data) => {
        outputBuffer += data.toString()
      })

      // Wait briefly for startup logs
      await new Promise((resolve) => setTimeout(resolve, 2000))

      return {
        data: {
          sessionId,
          pid: proc.pid,
          success: true,
          logs: outputBuffer || 'Process spawned successfully in background with no initial logs.',
        }
      }
    } catch (err: any) {
      throw new Error(`Failed to spawn interactive terminal session: ${err.message}`)
    }
  },
  mapToolResultToToolResultBlockParam(data, toolUseID) {
    if (data.message) {
      return {
        tool_use_id: toolUseID,
        type: 'tool_result',
        content: `### Interactive TTY Session Management\n\n${data.message}`,
      }
    }
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: `### Interactive TTY Session Started\n\n- **Session ID**: \`${data.sessionId}\`\n- **Process PID**: \`${data.pid}\`\n\n#### Initial Output logs:\n\`\`\`text\n${data.logs}\n\`\`\``,
    }
  },
  renderToolUseMessage(input) {
    return `Spawning persistent TTY session: ${input.command}`
  }
})
export { activeSessions }
