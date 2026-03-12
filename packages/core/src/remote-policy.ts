import path from 'node:path'
import process from 'node:process'

import { Effect } from 'effect'

import { runCommand, runCommandText } from './command'
import type { RepoRemotePolicy } from './schema'

export interface ParsedGitUrl {
  readonly host: string
  readonly owner: string
  readonly repo: string
}

export interface RemoteTarget {
  readonly fetchUrl: string
  readonly pushUrls: ReadonlyArray<string>
}

const gitUrlPatterns = [
  /^git@(?<host>[^:]+):(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/,
  /^ssh:\/\/git@(?<host>[^/]+)\/(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/,
  /^https:\/\/(?<host>[^/]+)\/(?<owner>[^/]+)\/(?<repo>[^/]+?)(?:\.git)?$/,
]

export const remoteDefaults = {
  codebergHostAlias: 'codeberg.org-dunamismax',
  githubHostAlias: 'github.com-dunamismax',
  owner: 'dunamismax',
  root: path.join(process.env.HOME ?? process.cwd(), 'github'),
} as const

export const parseGitUrl = (url: string): ParsedGitUrl | null => {
  for (const pattern of gitUrlPatterns) {
    const match = pattern.exec(url.trim())
    if (!match?.groups) {
      continue
    }

    return {
      host: match.groups.host,
      owner: match.groups.owner,
      repo: match.groups.repo,
    }
  }

  return null
}

export const repoUrlMatches = (url: string, owner: string, repoName: string) => {
  const parsed = parseGitUrl(url)
  return parsed !== null && parsed.owner === owner && parsed.repo === repoName
}

export const personalGithubUrl = (owner: string, repoName: string, hostAlias: string) =>
  `git@${hostAlias}:${owner}/${repoName}.git`

export const personalCodebergUrl = (owner: string, repoName: string, hostAlias: string) =>
  `git@${hostAlias}:${owner}/${repoName}.git`

export const buildRepoRemotePolicy = (
  repoName: string,
  config: {
    readonly owner: string
    readonly githubHostAlias: string
    readonly codebergHostAlias: string
  },
): RepoRemotePolicy => {
  const githubUrl = personalGithubUrl(config.owner, repoName, config.githubHostAlias)
  const codebergUrl = personalCodebergUrl(config.owner, repoName, config.codebergHostAlias)

  return {
    cloneUrl: githubUrl,
    extraRemotes: {},
    origin: {
      fetchUrl: githubUrl,
      pushUrls: [githubUrl, codebergUrl],
    },
    pushDefault: null,
  }
}

export const listGitRemotes = (repoPath: string) =>
  runCommandText(['git', '-C', repoPath, 'remote'], { quiet: true }).pipe(
    Effect.map((output) =>
      output
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    ),
  )

export const getRemoteUrls = (repoPath: string, remoteName = 'origin') =>
  Effect.all({
    fetchUrl: runCommandText(['git', '-C', repoPath, 'remote', 'get-url', remoteName], {
      quiet: true,
    }),
    pushRaw: runCommandText(
      ['git', '-C', repoPath, 'remote', 'get-url', '--push', '--all', remoteName],
      { quiet: true },
    ),
  }).pipe(
    Effect.map(({ fetchUrl, pushRaw }) => ({
      fetchUrl,
      pushUrls: pushRaw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    })),
    Effect.catchAll(() => Effect.succeed(null)),
  )

export const getRemotePushDefault = (repoPath: string) =>
  runCommandText(['git', '-C', repoPath, 'config', '--get', 'remote.pushDefault'], {
    quiet: true,
  }).pipe(
    Effect.map((value) => value || null),
    Effect.catchAll(() => Effect.succeed(null)),
  )

const applyRemoteTarget = (repoPath: string, remoteName: string, target: RemoteTarget) =>
  Effect.gen(function* () {
    const remotes = new Set(yield* listGitRemotes(repoPath))

    if (!remotes.has(remoteName)) {
      yield* runCommand(['git', '-C', repoPath, 'remote', 'add', remoteName, target.fetchUrl], {
        quiet: true,
      })
    }

    yield* runCommand(['git', '-C', repoPath, 'remote', 'set-url', remoteName, target.fetchUrl], {
      quiet: true,
    })

    yield* Effect.ignore(
      runCommand(['git', '-C', repoPath, 'config', '--unset-all', `remote.${remoteName}.pushurl`], {
        quiet: true,
      }),
    )

    for (const pushUrl of target.pushUrls) {
      yield* runCommand(
        ['git', '-C', repoPath, 'remote', 'set-url', '--add', '--push', remoteName, pushUrl],
        { quiet: true },
      )
    }
  })

export const applyRepoRemotePolicy = (repoPath: string, policy: RepoRemotePolicy) =>
  Effect.gen(function* () {
    yield* applyRemoteTarget(repoPath, 'origin', policy.origin)

    for (const [remoteName, target] of Object.entries(policy.extraRemotes)) {
      yield* applyRemoteTarget(repoPath, remoteName, target)
    }

    if (policy.pushDefault) {
      yield* runCommand(
        ['git', '-C', repoPath, 'config', 'remote.pushDefault', policy.pushDefault],
        { quiet: true },
      )
      return
    }

    yield* Effect.ignore(
      runCommand(['git', '-C', repoPath, 'config', '--unset', 'remote.pushDefault'], {
        quiet: true,
      }),
    )
  })
