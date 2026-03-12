import { execFile } from 'node:child_process'
import process from 'node:process'
import { promisify } from 'node:util'

import { Effect } from 'effect'

import { CommandFailure } from './errors'

const execFileAsync = promisify(execFile)

export interface RunOptions {
  readonly cwd?: string
  readonly env?: NodeJS.ProcessEnv
  readonly quiet?: boolean
}

export interface CommandOutput {
  readonly command: readonly string[]
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

export const runCommand = (
  command: readonly string[],
  options: RunOptions = {},
): Effect.Effect<CommandOutput, CommandFailure> =>
  Effect.tryPromise({
    try: async () => {
      if (command.length === 0) {
        throw new Error('Command must not be empty.')
      }

      if (!options.quiet) {
        process.stdout.write(`$ ${command.join(' ')}\n`)
      }

      try {
        const result = await execFileAsync(command[0], [...command.slice(1)], {
          cwd: options.cwd,
          env: {
            ...process.env,
            ...(options.env ?? {}),
          },
          encoding: 'utf8',
          maxBuffer: 1024 * 1024 * 16,
        })

        return {
          command,
          exitCode: 0,
          stderr: result.stderr.trim(),
          stdout: result.stdout.trim(),
        }
      } catch (error) {
        const failure = error as NodeJS.ErrnoException & {
          stdout?: string
          stderr?: string
          code?: number | string
        }

        throw new CommandFailure({
          command,
          exitCode: typeof failure.code === 'number' ? failure.code : 1,
          stderr: (failure.stderr ?? '').trim(),
          stdout: (failure.stdout ?? '').trim(),
        })
      }
    },
    catch: (error) =>
      error instanceof CommandFailure
        ? error
        : new CommandFailure({
            command,
            exitCode: 1,
            stderr: String(error),
            stdout: '',
          }),
  })

export const runCommandText = (
  command: readonly string[],
  options: RunOptions = {},
): Effect.Effect<string, CommandFailure> =>
  Effect.map(runCommand(command, options), (result) => result.stdout)
