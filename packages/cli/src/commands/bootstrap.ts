import { logStep, runCommandText } from '@scry-home/core'
import { Effect } from 'effect'

import { commandExists } from '../lib/system'

export const bootstrap = async () => {
  logStep('Checking prerequisites')

  for (const tool of ['git', 'bun', 'pnpm']) {
    if (!commandExists(tool)) {
      throw new Error(`Missing required tool: ${tool}`)
    }

    process.stdout.write(`ok: ${tool}\n`)
  }

  logStep('Syncing workspace dependencies')
  await Effect.runPromise(runCommandText(['pnpm', 'install']))

  logStep('Bootstrap complete')
  const bunVersion = await Effect.runPromise(runCommandText(['bun', '--version'], { quiet: true }))
  const pnpmVersion = await Effect.runPromise(
    runCommandText(['pnpm', '--version'], { quiet: true }),
  )

  process.stdout.write(`bun: ${bunVersion}\n`)
  process.stdout.write(`pnpm: ${pnpmVersion}\n`)
}
