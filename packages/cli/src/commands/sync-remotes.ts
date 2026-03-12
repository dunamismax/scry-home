import fs from 'node:fs'
import path from 'node:path'
import {
  applyRepoRemotePolicy,
  buildRepoRemotePolicy,
  getRemotePushDefault,
  getRemoteUrls,
  isGitRepo,
  listGitRemotes,
  logStep,
  remoteDefaults,
  repoUrlMatches,
} from '@scry-home/core'

interface RepoResult {
  readonly detail?: string
  readonly name: string
  readonly status: 'ok' | 'todo' | 'skip' | 'fixed' | 'error'
}

const isCorrect = (
  fetchUrl: string,
  pushUrls: ReadonlyArray<string>,
  githubUrl: string,
  codebergUrl: string,
) =>
  fetchUrl === githubUrl &&
  pushUrls.length === 2 &&
  pushUrls[0] === githubUrl &&
  pushUrls[1] === codebergUrl

const customTopologyReason = async (repoPath: string, repoName: string, fetchUrl: string) => {
  const remotes = await listGitRemotes(repoPath)
  const pushDefault = await getRemotePushDefault(repoPath)

  if (pushDefault && pushDefault !== 'origin') {
    return `custom pushDefault=${pushDefault}`
  }

  const extraRemotes = remotes.filter((remote) => remote !== 'origin')
  if (extraRemotes.length > 0) {
    return `custom remotes: ${extraRemotes.join(', ')}`
  }

  if (!repoUrlMatches(fetchUrl, remoteDefaults.owner, repoName)) {
    return `origin fetch preserved: ${fetchUrl}`
  }

  return null
}

const processRepo = async (repoPath: string, fix: boolean): Promise<RepoResult> => {
  const name = path.basename(repoPath)
  if (!isGitRepo(repoPath)) {
    return { detail: 'not a git repo', name, status: 'skip' }
  }

  const urls = await getRemoteUrls(repoPath)
  if (!urls) {
    return { detail: 'no origin remote', name, status: 'skip' }
  }

  const policy = buildRepoRemotePolicy(name, {
    codebergHostAlias: remoteDefaults.codebergHostAlias,
    githubHostAlias: remoteDefaults.githubHostAlias,
    owner: remoteDefaults.owner,
  })
  const customReason = await customTopologyReason(repoPath, name, urls.fetchUrl)

  if (policy.origin.pushUrls.length === 2) {
    const [githubUrl, codebergUrl] = policy.origin.pushUrls
    if (isCorrect(urls.fetchUrl, urls.pushUrls, githubUrl, codebergUrl)) {
      return { name, status: 'ok' }
    }

    if (customReason) {
      return { detail: customReason, name, status: 'skip' }
    }

    if (!fix) {
      const issues: Array<string> = []
      if (urls.fetchUrl !== policy.origin.fetchUrl) {
        issues.push(`fetch: ${urls.fetchUrl} (want ${policy.origin.fetchUrl})`)
      }
      if (urls.pushUrls.length !== 2) {
        issues.push(`push url count: ${urls.pushUrls.length} (want 2)`)
      } else {
        if (urls.pushUrls[0] !== githubUrl) {
          issues.push(`push[0]: ${urls.pushUrls[0]} (want ${githubUrl})`)
        }
        if (urls.pushUrls[1] !== codebergUrl) {
          issues.push(`push[1]: ${urls.pushUrls[1]} (want ${codebergUrl})`)
        }
      }
      return { detail: issues.join('; '), name, status: 'todo' }
    }

    try {
      await applyRepoRemotePolicy(repoPath, policy)
      return { name, status: 'fixed' }
    } catch (error) {
      return {
        detail: error instanceof Error ? error.message : String(error),
        name,
        status: 'error',
      }
    }
  }

  return { detail: customReason ?? 'non-mirror policy repo', name, status: 'skip' }
}

export const syncRemotes = async (argv: ReadonlyArray<string>) => {
  const fix = argv.includes('--fix')
  const root = remoteDefaults.root

  logStep(
    fix ? 'Syncing managed repo remotes (fix mode)' : 'Checking managed repo remotes (dry run)',
  )
  process.stdout.write(`  root:     ${root}\n`)
  process.stdout.write(`  owner:    ${remoteDefaults.owner}\n`)
  process.stdout.write(`  github:   ${remoteDefaults.githubHostAlias}\n`)
  process.stdout.write(`  codeberg: ${remoteDefaults.codebergHostAlias}\n`)

  const repos = fs
    .readdirSync(root)
    .map((entry) => path.join(root, entry))
    .filter((entry) => fs.statSync(entry).isDirectory())
    .sort()

  const results = await Promise.all(repos.map((repo) => processRepo(repo, fix)))
  process.stdout.write('\n')

  const render = (status: RepoResult['status'], label: string) => {
    for (const result of results.filter((entry) => entry.status === status)) {
      process.stdout.write(
        `  [${label}] ${result.name}${result.detail ? ` - ${result.detail}` : ''}\n`,
      )
    }
  }

  render('ok', 'ok   ')
  render('todo', 'todo ')
  render('fixed', 'fixed')
  render('skip', 'skip ')
  render('error', 'error')

  const counts = {
    error: results.filter((entry) => entry.status === 'error').length,
    fixed: results.filter((entry) => entry.status === 'fixed').length,
    ok: results.filter((entry) => entry.status === 'ok').length,
    skip: results.filter((entry) => entry.status === 'skip').length,
    todo: results.filter((entry) => entry.status === 'todo').length,
  }
  process.stdout.write(
    `\n  ok=${counts.ok} todo=${counts.todo} fixed=${counts.fixed} skipped=${counts.skip} errors=${counts.error}\n`,
  )

  if (counts.error > 0) {
    throw new Error('One or more repositories failed remote policy reconciliation.')
  }
}
