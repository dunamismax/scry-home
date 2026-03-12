import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import { Effect, ParseResult, Schema } from 'effect'

import { MissingPath, ValidationFailure } from './errors'

export const logStep = (message: string) => {
  process.stdout.write(`\n==> ${message}\n`)
}

export const ensureDir = (target: string): Effect.Effect<void, never> =>
  Effect.promise(() => fs.mkdir(target, { recursive: true }))

export const ensureParentDir = (target: string): Effect.Effect<void, never> =>
  ensureDir(path.dirname(target))

export const pathExists = (target: string): Effect.Effect<boolean, never> =>
  Effect.promise(async () => {
    try {
      await fs.access(target)
      return true
    } catch {
      return false
    }
  })

export const readText = (target: string): Effect.Effect<string, MissingPath | ValidationFailure> =>
  Effect.tryPromise({
    try: () => fs.readFile(target, 'utf8'),
    catch: (error) => {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('ENOENT')) {
        return new MissingPath({ path: target })
      }

      return new ValidationFailure({ message })
    },
  })

export const writeText = (
  target: string,
  content: string,
): Effect.Effect<void, ValidationFailure> =>
  Effect.tryPromise({
    try: async () => {
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.writeFile(target, content, 'utf8')
    },
    catch: (error) =>
      new ValidationFailure({
        message: error instanceof Error ? error.message : String(error),
      }),
  })

export const readJson = <A, I>(
  target: string,
  schema: Schema.Schema<A, I>,
): Effect.Effect<A, MissingPath | ValidationFailure> =>
  Effect.gen(function* () {
    const raw = yield* readText(target)
    const parsed = yield* Effect.try({
      try: () => JSON.parse(raw),
      catch: (error) =>
        new ValidationFailure({
          message: error instanceof Error ? error.message : String(error),
        }),
    })

    return yield* Schema.decodeUnknown(schema)(parsed).pipe(
      Effect.mapError(
        (error) =>
          new ValidationFailure({
            message: ParseResult.TreeFormatter.formatErrorSync(error),
          }),
      ),
    )
  })
