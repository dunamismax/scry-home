import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { type Snapshot, SnapshotSchema } from './schema'

const octalMode = (mode: number) => (mode & 0o777).toString(8).padStart(3, '0')

const sha256Hex = (value: Buffer | string) => createHash('sha256').update(value).digest('hex')

const addEntries = (
  absolutePath: string,
  relativePath: string,
  entries: Array<string>,
  counters: { fileCount: number; totalBytes: number },
) => {
  const lstat = fs.lstatSync(absolutePath)

  if (lstat.isSymbolicLink()) {
    counters.fileCount += 1
    entries.push(
      `symlink ${relativePath} mode=${octalMode(lstat.mode)} -> ${fs.readlinkSync(absolutePath)}`,
    )
    return
  }

  if (lstat.isDirectory()) {
    entries.push(`dir ${relativePath} mode=${octalMode(lstat.mode)}`)
    for (const child of fs.readdirSync(absolutePath).sort()) {
      addEntries(
        path.join(absolutePath, child),
        relativePath ? `${relativePath}/${child}` : child,
        entries,
        counters,
      )
    }
    return
  }

  if (lstat.isFile()) {
    const bytes = fs.readFileSync(absolutePath)
    counters.fileCount += 1
    counters.totalBytes += bytes.length
    entries.push(
      `file ${relativePath} mode=${octalMode(lstat.mode)} size=${bytes.length} sha256=${sha256Hex(bytes)}`,
    )
    return
  }

  entries.push(`other ${relativePath} mode=${octalMode(lstat.mode)}`)
}

export const sourceSnapshot = (root: string, relativePaths: ReadonlyArray<string>): Snapshot => {
  const entries: Array<string> = []
  const counters = { fileCount: 0, totalBytes: 0 }

  for (const relativePath of relativePaths) {
    addEntries(path.join(root, relativePath), relativePath, entries, counters)
  }

  return SnapshotSchema.parse({
    fileCount: counters.fileCount,
    fingerprint: sha256Hex(entries.join('\n')),
    totalBytes: counters.totalBytes,
  })
}

export const directorySnapshot = (root: string): Snapshot => {
  const entries: Array<string> = []
  const counters = { fileCount: 0, totalBytes: 0 }

  for (const child of fs.readdirSync(root).sort()) {
    addEntries(path.join(root, child), child, entries, counters)
  }

  return SnapshotSchema.parse({
    fileCount: counters.fileCount,
    fingerprint: sha256Hex(entries.join('\n')),
    totalBytes: counters.totalBytes,
  })
}
