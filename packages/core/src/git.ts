import fs from 'node:fs'

import { Effect } from 'effect'
import { runCommandText } from './command'
import type { CommandFailure } from './errors'

export const isGitRepo = (target: string) =>
  fs.existsSync(target) && fs.existsSync(`${target}/.git`)

export const gitRemotePushUrls = (
  cwd: string,
  remote: string,
): Effect.Effect<ReadonlyArray<string>, never> =>
  runCommandText(['git', 'remote', 'get-url', '--all', '--push', remote], {
    cwd,
    quiet: true,
  }).pipe(
    Effect.map((output) =>
      output
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    ),
    Effect.catchAll(() => Effect.succeed([] as ReadonlyArray<string>)),
  )

export const currentGitBranch = (cwd: string): Effect.Effect<string, CommandFailure> =>
  runCommandText(['git', 'branch', '--show-current'], { cwd, quiet: true })
