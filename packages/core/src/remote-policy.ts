import path from 'node:path'
import process from 'node:process'

import { runCommand, runCommandText } from './command'
import { type RepoRemotePolicy, RepoRemotePolicySchema } from './schema'

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

  return RepoRemotePolicySchema.parse({
    cloneUrl: githubUrl,
    extraRemotes: {},
    origin: {
      fetchUrl: githubUrl,
      pushUrls: [githubUrl, codebergUrl],
    },
    pushDefault: null,
  })
}

export const listGitRemotes = async (repoPath: string) =>
  runCommandText(['git', '-C', repoPath, 'remote'], { quiet: true }).then((output) =>
    output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  )

export const getRemoteUrls = async (repoPath: string, remoteName = 'origin') => {
  try {
    const [fetchUrl, pushRaw] = await Promise.all([
      runCommandText(['git', '-C', repoPath, 'remote', 'get-url', remoteName], {
        quiet: true,
      }),
      runCommandText(['git', '-C', repoPath, 'remote', 'get-url', '--push', '--all', remoteName], {
        quiet: true,
      }),
    ])

    return {
      fetchUrl,
      pushUrls: pushRaw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    }
  } catch {
    return null
  }
}

export const getRemotePushDefault = async (repoPath: string) => {
  try {
    const value = await runCommandText(
      ['git', '-C', repoPath, 'config', '--get', 'remote.pushDefault'],
      {
        quiet: true,
      },
    )
    return value || null
  } catch {
    return null
  }
}

const applyRemoteTarget = async (repoPath: string, remoteName: string, target: RemoteTarget) => {
  const remotes = new Set(await listGitRemotes(repoPath))

  if (!remotes.has(remoteName)) {
    await runCommand(['git', '-C', repoPath, 'remote', 'add', remoteName, target.fetchUrl], {
      quiet: true,
    })
  }

  await runCommand(['git', '-C', repoPath, 'remote', 'set-url', remoteName, target.fetchUrl], {
    quiet: true,
  })

  try {
    await runCommand(
      ['git', '-C', repoPath, 'config', '--unset-all', `remote.${remoteName}.pushurl`],
      {
        quiet: true,
      },
    )
  } catch {
    // The remote might not have push URLs yet.
  }

  for (const pushUrl of target.pushUrls) {
    await runCommand(
      ['git', '-C', repoPath, 'remote', 'set-url', '--add', '--push', remoteName, pushUrl],
      { quiet: true },
    )
  }
}

export const applyRepoRemotePolicy = async (repoPath: string, policy: RepoRemotePolicy) => {
  await applyRemoteTarget(repoPath, 'origin', policy.origin)

  for (const [remoteName, target] of Object.entries(policy.extraRemotes)) {
    await applyRemoteTarget(repoPath, remoteName, target)
  }

  if (policy.pushDefault) {
    await runCommand(['git', '-C', repoPath, 'config', 'remote.pushDefault', policy.pushDefault], {
      quiet: true,
    })
    return
  }

  try {
    await runCommand(['git', '-C', repoPath, 'config', '--unset', 'remote.pushDefault'], {
      quiet: true,
    })
  } catch {
    // No pushDefault is configured.
  }
}
