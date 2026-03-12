import os from 'node:os'
import path from 'node:path'

import type { ManagedProject } from './schema'

const githubRoot = path.join(os.homedir(), 'github')

export const managedProjects: ReadonlyArray<ManagedProject> = [
  {
    name: 'scry-home',
    path: path.join(githubRoot, 'scry-home'),
    installCommand: ['pnpm', 'install'],
    verifyCommands: [['pnpm', 'check']],
  },
  {
    name: 'dunamismax',
    path: path.join(githubRoot, 'dunamismax'),
    installCommand: ['echo', 'no install needed'],
    verifyCommands: [],
  },
  {
    name: 'boring-go-web',
    path: path.join(githubRoot, 'boring-go-web'),
    installCommand: ['go', 'mod', 'download'],
    verifyCommands: [['go', 'test', './...']],
  },
  {
    name: 'c-from-the-ground-up',
    path: path.join(githubRoot, 'c-from-the-ground-up'),
    installCommand: ['echo', 'no install needed'],
    verifyCommands: [],
  },
  {
    name: 'scryfall-discord-bot',
    path: path.join(githubRoot, 'scryfall-discord-bot'),
    installCommand: ['pnpm', 'install'],
    verifyCommands: [['pnpm', 'test']],
  },
  {
    name: 'hello-world-from-hell',
    path: path.join(githubRoot, 'hello-world-from-hell'),
    installCommand: ['echo', 'no install needed'],
    verifyCommands: [['make', 'test']],
  },
  {
    name: 'trade-desk-cli',
    path: path.join(githubRoot, 'trade-desk-cli'),
    installCommand: ['pnpm', 'install'],
    verifyCommands: [['pnpm', 'test']],
  },
  {
    name: 'Sawyer-Visual-Media',
    path: path.join(githubRoot, 'Sawyer-Visual-Media'),
    installCommand: ['echo', 'no install needed'],
    verifyCommands: [],
  },
]
