import os from 'node:os'
import path from 'node:path'

import { type ManagedProject, ManagedProjectListSchema } from './schema'

const githubRoot = path.join(os.homedir(), 'github')

export const managedProjects: ReadonlyArray<ManagedProject> = ManagedProjectListSchema.parse([
  {
    name: 'scry-home',
    path: path.join(githubRoot, 'scry-home'),
    installCommand: ['bun', 'install'],
    verifyCommands: [['bun', 'run', 'check']],
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
    installCommand: ['bun', 'install'],
    verifyCommands: [['bun', 'run', 'test']],
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
    installCommand: ['bun', 'install'],
    verifyCommands: [['bun', 'run', 'test']],
  },
  {
    name: 'Sawyer-Visual-Media',
    path: path.join(githubRoot, 'Sawyer-Visual-Media'),
    installCommand: ['echo', 'no install needed'],
    verifyCommands: [],
  },
])
