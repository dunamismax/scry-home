import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export const commandExists = (binary: string) => {
  const searchPath = process.env.PATH ?? ''
  for (const segment of searchPath.split(path.delimiter)) {
    const absolutePath = path.join(segment, binary)
    if (fs.existsSync(absolutePath)) {
      return true
    }
  }

  return false
}

export const homePath = (...parts: Array<string>) => path.join(process.env.HOME ?? '', ...parts)

export const hasEnv = (name: string) => Object.hasOwn(process.env, name)

export const printLines = (lines: ReadonlyArray<string>) => {
  for (const line of lines) {
    process.stdout.write(`${line}\n`)
  }
}
