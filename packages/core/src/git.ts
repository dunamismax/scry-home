import fs from 'node:fs'

import { runCommandText } from './command'

export const isGitRepo = (target: string) =>
  fs.existsSync(target) && fs.existsSync(`${target}/.git`)

export const gitRemotePushUrls = (cwd: string, remote: string): Promise<ReadonlyArray<string>> =>
  runCommandText(['git', 'remote', 'get-url', '--all', '--push', remote], {
    cwd,
    quiet: true,
  })
    .then((output) =>
      output
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .catch(() => [] as ReadonlyArray<string>)

export const currentGitBranch = (cwd: string): Promise<string> =>
  runCommandText(['git', 'branch', '--show-current'], { cwd, quiet: true })
