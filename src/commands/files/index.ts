import type { Command } from '../../commands.js'

const files = {
  type: 'local',
  name: 'files',
  description: 'List all files currently in context',
  isEnabled: () => true /* Sovereign Unlocked */,
  supportsNonInteractive: true,
  load: () => import('./files.js'),
} satisfies Command

export default files
