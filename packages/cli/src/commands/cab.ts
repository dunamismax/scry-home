import path from 'node:path'
import { scaffoldCabPacket } from '@scry-home/cab'

import { logStep } from '@scry-home/core'
import { Effect } from 'effect'

const usage = () =>
  [
    'Usage: scry-home cab:new --project=<managed-project> --packet=<packet-name> [--output=<path>] [--dry-run]',
  ].join('\n')

export const cabNew = async (argv: ReadonlyArray<string>) => {
  let projectName = ''
  let packetName = ''
  let outputRoot = path.join(process.cwd(), 'artifacts', 'cab')
  let dryRun = false

  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true
      continue
    }
    if (arg.startsWith('--project=')) {
      projectName = arg.slice('--project='.length).trim()
      continue
    }
    if (arg.startsWith('--packet=')) {
      packetName = arg.slice('--packet='.length).trim()
      continue
    }
    if (arg.startsWith('--output=')) {
      outputRoot = path.resolve(arg.slice('--output='.length).trim())
      continue
    }

    throw new Error(`Unknown flag: ${arg}\n${usage()}`)
  }

  if (!projectName || !packetName) {
    throw new Error(`Missing required flags.\n${usage()}`)
  }

  logStep('CAB packet scaffold')
  process.stdout.write(`project: ${projectName}\n`)
  process.stdout.write(`packet: ${packetName}\n`)
  process.stdout.write(`output: ${outputRoot}\n`)
  process.stdout.write(`mode: ${dryRun ? 'dry-run' : 'write'}\n\n`)

  const result = await Effect.runPromise(
    scaffoldCabPacket({
      dryRun,
      outputRoot,
      packetName,
      projectName,
    }),
  )

  if (dryRun) {
    process.stdout.write('would create:\n')
  } else {
    process.stdout.write('created:\n')
  }

  for (const entry of result) {
    process.stdout.write(`- ${entry}\n`)
  }
}
