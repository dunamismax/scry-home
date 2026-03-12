import {
  currentGitBranch,
  gitRemotePushUrls,
  isGitRepo,
  logStep,
  managedProjects,
  runCommand,
} from '@scry-home/core'

import { hasEnv } from '../lib/system'

const requireProjectRepo = (name: string, repoPath: string) => {
  if (isGitRepo(repoPath)) {
    return
  }

  const message = `missing: ${name} (${repoPath})`
  if (hasEnv('OPTIONAL')) {
    process.stdout.write(`skip: ${message}\n`)
    return
  }

  throw new Error(message)
}

export const listProjects = async () => {
  logStep('Managed projects')
  for (const project of managedProjects) {
    process.stdout.write(`${project.name}: ${project.path}\n`)
  }
}

export const installProjects = async () => {
  logStep('Install managed project dependencies')
  for (const project of managedProjects) {
    if (!isGitRepo(project.path)) {
      requireProjectRepo(project.name, project.path)
      continue
    }

    process.stdout.write(`project: ${project.name}\n`)
    await runCommand(project.installCommand, { cwd: project.path })
  }
}

export const verifyProjects = async () => {
  logStep('Run managed project verification')
  for (const project of managedProjects) {
    if (!isGitRepo(project.path)) {
      requireProjectRepo(project.name, project.path)
      continue
    }

    process.stdout.write(`project: ${project.name}\n`)
    for (const command of project.verifyCommands) {
      await runCommand(command, { cwd: project.path })
    }
  }
}

export const doctorProjects = async () => {
  logStep('Managed project health')

  for (const project of managedProjects) {
    const present = isGitRepo(project.path)
    process.stdout.write(`${project.name}: ${present ? 'ok' : 'missing'} (${project.path})\n`)
    if (!present) {
      continue
    }

    const branch = await currentGitBranch(project.path)
    process.stdout.write(`branch: ${branch}\n`)

    const originUrls = await gitRemotePushUrls(project.path, 'origin')
    if (originUrls.length > 0) {
      process.stdout.write(`push(origin): ${originUrls.join(' | ')}\n`)
    }

    const forkUrls = await gitRemotePushUrls(project.path, 'fork')
    if (forkUrls.length > 0) {
      process.stdout.write(`push(fork): ${forkUrls.join(' | ')}\n`)
    }
  }
}
