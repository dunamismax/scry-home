import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gitRemotePushUrls, isGitRepo, managedProjects } from '@scry-home/core'
import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'

const workspaceRoot = path.resolve(fileURLToPath(new URL('../../../..', import.meta.url)))

export interface ArtifactRecord {
  readonly modifiedAt: string
  readonly path: string
  readonly sizeBytes: number
}

export interface ProjectRecord {
  readonly installCommand: ReadonlyArray<string>
  readonly name: string
  readonly path: string
  readonly present: boolean
  readonly pushUrls: ReadonlyArray<string>
  readonly verifyCommands: ReadonlyArray<ReadonlyArray<string>>
}

export interface OverviewRecord {
  readonly aiConfigured: boolean
  readonly authConfigured: boolean
  readonly backup: {
    readonly config: boolean
    readonly ssh: boolean
  }
  readonly cabTemplateCount: number
  readonly databaseConfigured: boolean
  readonly projects: {
    readonly present: number
    readonly total: number
  }
  readonly projectRows: ReadonlyArray<ProjectRecord>
  readonly repoPath: string
}

export interface BackupRecord {
  readonly configured: boolean
  readonly items: ReadonlyArray<ArtifactRecord>
}

const statExists = async (target: string) =>
  fs
    .access(target)
    .then(() => true)
    .catch(() => false)

const collectArtifacts = async (root: string) => {
  if (!(await statExists(root))) {
    return [] as Array<ArtifactRecord>
  }

  const entries = await fs.readdir(root, { withFileTypes: true })
  const files: Array<ArtifactRecord> = []

  for (const entry of entries) {
    const absolutePath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectArtifacts(absolutePath)))
      continue
    }

    const stats = await fs.stat(absolutePath)
    files.push({
      modifiedAt: stats.mtime.toISOString(),
      path: path.relative(workspaceRoot, absolutePath),
      sizeBytes: stats.size,
    })
  }

  return files.sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt))
}

export const getOverview = createServerFn({ method: 'GET' }).handler(
  async (): Promise<OverviewRecord> => {
    const repoPath = workspaceRoot
    const projectRows: Array<ProjectRecord> = await Promise.all(
      managedProjects.map(async (project) => {
        const present = isGitRepo(project.path)
        const pushUrls = present
          ? await Effect.runPromise(gitRemotePushUrls(project.path, 'origin'))
          : []

        return {
          installCommand: project.installCommand,
          name: project.name,
          path: project.path,
          present,
          pushUrls,
          verifyCommands: project.verifyCommands,
        }
      }),
    )

    const configBackupPath = path.join(repoPath, 'vault', 'config', 'critical-configs.meta.json')
    const sshBackupPath = path.join(repoPath, 'vault', 'ssh', 'ssh-keys.meta.json')
    const cabTemplatesPath = path.join(repoPath, 'packages', 'cab', 'templates')

    return {
      aiConfigured: Boolean(process.env.OPENAI_API_KEY),
      authConfigured: Boolean(process.env.BETTER_AUTH_SECRET),
      backup: {
        config: await statExists(configBackupPath),
        ssh: await statExists(sshBackupPath),
      },
      cabTemplateCount: (await collectArtifacts(cabTemplatesPath)).length,
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      projects: {
        present: projectRows.filter((project) => project.present).length,
        total: projectRows.length,
      },
      projectRows,
      repoPath,
    }
  },
)

export const getBackups = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BackupRecord> => {
    const vaultRoot = path.join(workspaceRoot, 'vault')
    return {
      configured: await statExists(vaultRoot),
      items: await collectArtifacts(vaultRoot),
    }
  },
)

export const getProjects = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<ProjectRecord>> =>
    Promise.all(
      managedProjects.map(async (project) => {
        const present = isGitRepo(project.path)
        const pushUrls = present
          ? await Effect.runPromise(gitRemotePushUrls(project.path, 'origin'))
          : []
        return {
          installCommand: project.installCommand,
          name: project.name,
          path: project.path,
          present,
          pushUrls,
          verifyCommands: project.verifyCommands,
        }
      }),
    ),
)
