import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

export const logStep = (message: string) => {
  process.stdout.write(`\n==> ${message}\n`)
}

export const ensureDir = async (target: string) => {
  await fs.mkdir(target, { recursive: true })
}

export const ensureParentDir = (target: string) => ensureDir(path.dirname(target))
