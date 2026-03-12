import fs from 'node:fs/promises'
import path from 'node:path'
import {
  CabRequestSchema,
  formatZodError,
  gitRemotePushUrls,
  isGitRepo,
  managedProjects,
  runCommandText,
} from '@scry-home/core'

export interface CabRequest {
  readonly dryRun: boolean
  readonly outputRoot: string
  readonly packetName: string
  readonly projectName: string
}

const templatesRoot = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  '..',
  'templates',
)

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')

const todayHuman = () => {
  const today = new Date()
  return today.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const commandList = (commands: ReadonlyArray<ReadonlyArray<string>>, emptyText: string) =>
  commands.length === 0
    ? `- ${emptyText}`
    : commands.map((command) => `- \`${command.join(' ')}\``).join('\n')

const bulletList = (items: ReadonlyArray<string>, emptyText: string) =>
  items.length === 0 ? `- ${emptyText}` : items.map((item) => `- \`${item}\``).join('\n')

const projectContext = (
  request: CabRequest,
  project: (typeof managedProjects)[number],
  branch: string,
  worktreeState: string,
  originUrls: ReadonlyArray<string>,
  forkUrls: ReadonlyArray<string>,
  outputDir: string,
) => ({
  CAB_WORKFLOW_DOC: 'packages/cab/templates/README.md',
  PACKET_DATE: new Date().toISOString().slice(0, 10),
  PACKET_DATE_HUMAN: todayHuman(),
  PACKET_NAME: request.packetName,
  PACKET_PATH: outputDir,
  PACKET_SLUG: path.basename(outputDir),
  PROJECT_BRANCH: branch || '(detached)',
  PROJECT_CONTROL_PLANE_COMMANDS: [
    '- `bun run cli doctor`',
    '- `bun run cli projects:doctor`',
    project.verifyCommands[0]
      ? `- \`cd ${project.path} && ${project.verifyCommands[0].join(' ')}\``
      : '- Add project-specific verification once the repo has one.',
  ].join('\n'),
  PROJECT_FORK_PUSH_URLS: bulletList(forkUrls, 'No fork remote configured.'),
  PROJECT_INSTALL_COMMAND: project.installCommand.join(' '),
  PROJECT_NAME: project.name,
  PROJECT_ORIGIN_PUSH_URLS: bulletList(originUrls, 'No origin push URLs configured.'),
  PROJECT_PATH: project.path,
  PROJECT_VERIFY_COMMANDS: commandList(
    project.verifyCommands,
    'No repo-specific verify commands are registered yet.',
  ),
  PROJECT_WORKTREE_STATE: worktreeState,
  REPO_ROOT: path.resolve(project.path, '..'),
  RESEARCH_FORGE_NOTE:
    'Research notes are part of the packet: use `09-research-memo.md` and `research/source-log.md`.',
})

const renderTemplate = (template: string, context: Record<string, string>) =>
  Object.entries(context).reduce(
    (rendered, [key, value]) => rendered.replaceAll(`{{${key}}}`, value),
    template,
  )

const walkTemplates = async (root: string) => {
  const entries = await fs.readdir(root, { withFileTypes: true })
  const files: Array<string> = []

  for (const entry of entries) {
    const absolutePath = path.join(root, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkTemplates(absolutePath)))
      continue
    }

    files.push(absolutePath)
  }

  return files.sort()
}

export const scaffoldCabPacket = (request: CabRequest) =>
  (async () => {
    const parsedRequest = CabRequestSchema.safeParse(request)
    if (!parsedRequest.success) {
      throw new Error(`Invalid CAB request: ${formatZodError(parsedRequest.error)}`)
    }

    const nextRequest = parsedRequest.data
    const project = managedProjects.find((entry) => entry.name === nextRequest.projectName)

    if (!project) {
      throw new Error(
        `Unknown managed project: ${nextRequest.projectName}. Available projects: ${managedProjects.map((entry) => entry.name).join(', ')}`,
      )
    }

    if (!isGitRepo(project.path)) {
      throw new Error(
        `Managed project is missing or not a git repo: ${project.name} (${project.path})`,
      )
    }

    const branch = await runCommandText(['git', 'branch', '--show-current'], {
      cwd: project.path,
      quiet: true,
    })
    const status = await runCommandText(['git', 'status', '--short'], {
      cwd: project.path,
      quiet: true,
    })
    const originUrls = await gitRemotePushUrls(project.path, 'origin')
    const forkUrls = await gitRemotePushUrls(project.path, 'fork')
    const packetSlug = `${new Date().toISOString().slice(0, 10)}-${slugify(project.name)}-${slugify(nextRequest.packetName)}`
    const outputDir = path.join(path.resolve(nextRequest.outputRoot), packetSlug)
    const context = projectContext(
      nextRequest,
      project,
      branch,
      status ? 'dirty' : 'clean',
      originUrls,
      forkUrls,
      outputDir,
    )

    const templates = await walkTemplates(templatesRoot)

    if (nextRequest.dryRun) {
      return templates.map((template: string) =>
        path.join(outputDir, path.relative(templatesRoot, template)),
      )
    }

    const outputExists = await fs
      .access(outputDir)
      .then(() => true)
      .catch(() => false)

    if (outputExists) {
      throw new Error(`CAB packet already exists: ${outputDir}`)
    }

    for (const template of templates) {
      const relativePath = path.relative(templatesRoot, template)
      const nextPath = path.join(outputDir, relativePath)
      const raw = await fs.readFile(template, 'utf8')
      await fs.mkdir(path.dirname(nextPath), { recursive: true })
      await fs.writeFile(nextPath, renderTemplate(raw, context), 'utf8')
    }

    return [outputDir]
  })()
