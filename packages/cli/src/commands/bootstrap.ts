import { logStep, runCommandText } from '@scry-home/core'

import { commandExists } from '../lib/system'

export const bootstrap = async () => {
  logStep('Checking prerequisites')

  for (const tool of ['git', 'bun']) {
    if (!commandExists(tool)) {
      throw new Error(`Missing required tool: ${tool}`)
    }

    process.stdout.write(`ok: ${tool}\n`)
  }

  logStep('Syncing workspace dependencies')
  await runCommandText(['bun', 'install'])

  logStep('Bootstrap complete')
  const bunVersion = await runCommandText(['bun', '--version'], { quiet: true })

  process.stdout.write(`bun: ${bunVersion}\n`)
}
