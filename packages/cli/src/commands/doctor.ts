import fs from 'node:fs'
import path from 'node:path'
import {
  currentGitBranch,
  gitRemotePushUrls,
  isGitRepo,
  logStep,
  managedProjects,
  runCommandText,
} from '@scry-home/core'
import { Effect } from 'effect'

import { commandExists } from '../lib/system'

export const doctor = async () => {
  logStep('Toolchain status')
  for (const tool of ['git', 'docker', 'bun', 'pnpm', 'node']) {
    if (!commandExists(tool)) {
      process.stdout.write(`missing: ${tool}\n`)
      continue
    }

    const version = await Effect.runPromise(runCommandText([tool, '--version'], { quiet: true }))
    process.stdout.write(`${tool}: ${version.split('\n')[0]}\n`)
  }

  logStep('Core files')
  const cwd = process.cwd()
  for (const file of [
    'README.md',
    'BUILD.md',
    'package.json',
    path.join('packages', 'cli', 'src', 'index.ts'),
  ]) {
    process.stdout.write(`${file}: ${fs.existsSync(path.join(cwd, file)) ? 'ok' : 'missing'}\n`)
  }

  logStep('Managed projects')
  for (const project of managedProjects) {
    const hasRepo = isGitRepo(project.path)
    process.stdout.write(`${project.name}: ${hasRepo ? 'ok' : 'missing'} (${project.path})\n`)
    if (!hasRepo) {
      continue
    }

    const branch = await Effect.runPromise(currentGitBranch(project.path))
    process.stdout.write(`branch: ${branch}\n`)

    const originUrls = await Effect.runPromise(gitRemotePushUrls(project.path, 'origin'))
    if (originUrls.length > 0) {
      process.stdout.write(`push(origin): ${originUrls.join(' | ')}\n`)
    }

    const forkUrls = await Effect.runPromise(gitRemotePushUrls(project.path, 'fork'))
    if (forkUrls.length > 0) {
      process.stdout.write(`push(fork): ${forkUrls.join(' | ')}\n`)
    }
  }
}
