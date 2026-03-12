#!/usr/bin/env bun

import process from 'node:process'

import { bootstrap } from './commands/bootstrap'
import { cabNew } from './commands/cab'
import { doctor } from './commands/doctor'
import { doctorProjects, installProjects, listProjects, verifyProjects } from './commands/projects'
import { setupConfigBackup } from './commands/setup-config-backup'
import { setupSshBackup, setupSshRestore } from './commands/setup-ssh'
import { syncRemotes } from './commands/sync-remotes'
import { syncCloudWorkDesktop } from './commands/sync-work-desktop'
import { verifyConfigBackup } from './commands/verify-config-backup'

type CommandFn = (argv: ReadonlyArray<string>) => Promise<void>

const commandTable: Record<string, { flags?: string; run: CommandFn }> = {
  bootstrap: { run: () => bootstrap() },
  'cab:new': {
    flags: '--project=<managed-project> --packet=<packet-name> [--output=<path>] [--dry-run]',
    run: (argv) => cabNew(argv),
  },
  doctor: { run: () => doctor() },
  'projects:doctor': { run: () => doctorProjects() },
  'projects:install': { run: () => installProjects() },
  'projects:list': { run: () => listProjects() },
  'projects:verify': { run: () => verifyProjects() },
  'setup:config_backup': { run: () => setupConfigBackup() },
  'setup:ssh_backup': { run: () => setupSshBackup() },
  'setup:ssh_restore': { run: () => setupSshRestore() },
  'sync:remotes': { flags: '--fix', run: (argv) => syncRemotes(argv) },
  'sync:work-desktop': { flags: '--dry-run', run: (argv) => syncCloudWorkDesktop(argv) },
  'verify:config_backup': { run: () => verifyConfigBackup() },
}

const printAvailableCommands = () => {
  process.stderr.write('Available commands:\n')
  for (const [name, command] of Object.entries(commandTable)) {
    process.stderr.write(`  ${name}${command.flags ? `  ${command.flags}` : ''}\n`)
  }
}

const main = async () => {
  const [, , command, ...argv] = process.argv

  if (!command || !commandTable[command]) {
    process.stderr.write(`Unknown or missing command: ${command ?? '(none)'}\n`)
    printAvailableCommands()
    process.exitCode = 1
    return
  }

  if (argv.includes('--help')) {
    process.stdout.write(`Usage: scry-home ${command}\n`)
    if (commandTable[command].flags) {
      process.stdout.write(`\nFlags:\n  ${commandTable[command].flags}\n`)
    }
    return
  }

  try {
    await commandTable[command].run(argv)
  } catch (error) {
    process.stderr.write(`error: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  }
}

void main()
