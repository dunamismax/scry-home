import { describe, expect, it } from 'vitest'

import { buildRepoRemotePolicy, parseGitUrl, repoUrlMatches } from './remote-policy'

describe('remote policy', () => {
  it('parses supported git URL formats', () => {
    expect(parseGitUrl('git@github.com-dunamismax:dunamismax/scry-home.git')).toEqual({
      host: 'github.com-dunamismax',
      owner: 'dunamismax',
      repo: 'scry-home',
    })

    expect(parseGitUrl('https://github.com/dunamismax/scry-home.git')).toEqual({
      host: 'github.com',
      owner: 'dunamismax',
      repo: 'scry-home',
    })
  })

  it('builds a dual-push origin policy for managed repos', () => {
    const policy = buildRepoRemotePolicy('scry-home', {
      codebergHostAlias: 'codeberg.org-dunamismax',
      githubHostAlias: 'github.com-dunamismax',
      owner: 'dunamismax',
    })

    expect(policy.cloneUrl).toBe('git@github.com-dunamismax:dunamismax/scry-home.git')
    expect(policy.origin.fetchUrl).toBe('git@github.com-dunamismax:dunamismax/scry-home.git')
    expect(policy.origin.pushUrls).toEqual([
      'git@github.com-dunamismax:dunamismax/scry-home.git',
      'git@codeberg.org-dunamismax:dunamismax/scry-home.git',
    ])
    expect(policy.pushDefault).toBeNull()
  })

  it('matches owner and repo names across URL forms', () => {
    expect(
      repoUrlMatches(
        'git@codeberg.org-dunamismax:dunamismax/scry-home.git',
        'dunamismax',
        'scry-home',
      ),
    ).toBe(true)
    expect(
      repoUrlMatches('https://github.com/other-owner/scry-home', 'dunamismax', 'scry-home'),
    ).toBe(false)
  })
})
