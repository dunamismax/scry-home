import fs from 'node:fs'
import path from 'node:path'

import { logStep } from '@scry-home/core'

const home = process.env.HOME ?? ''
const gdriveWorkDesktop = path.join(home, 'Google Drive', 'My Drive', 'Work Desktop')
const oneDriveWorkDesktop = path.join(home, 'OneDrive - Imaging Services Inc', 'Work Desktop')
const gitWorkDesktop = path.join(home, 'github', 'work', 'Work Desktop')

const skipExact = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini'])
const skipPrefixes = ['.~lock.', '~$']
const mtimeToleranceMs = 2_000

interface FileEntry {
  readonly absPath: string
  readonly mtimeMs: number
  readonly relPath: string
  readonly size: number
}

const shouldSkip = (name: string) =>
  skipExact.has(name) || skipPrefixes.some((prefix) => name.startsWith(prefix))

const walkDirectory = (root: string): Record<string, FileEntry> => {
  const entries: Record<string, FileEntry> = {}

  const walk = (current: string) => {
    let items: Array<fs.Dirent>
    try {
      items = fs
        .readdirSync(current, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))
    } catch {
      process.stdout.write(`  [WARN] cannot read directory: ${current}\n`)
      return
    }

    for (const item of items) {
      if (shouldSkip(item.name)) {
        continue
      }

      const absolutePath = path.join(current, item.name)
      if (item.isSymbolicLink()) {
        continue
      }
      if (item.isDirectory()) {
        walk(absolutePath)
        continue
      }
      if (!item.isFile()) {
        continue
      }

      try {
        const stats = fs.statSync(absolutePath)
        const relativePath = path.relative(root, absolutePath)
        entries[relativePath] = {
          absPath: absolutePath,
          mtimeMs: stats.mtimeMs,
          relPath: relativePath,
          size: stats.size,
        }
      } catch {
        process.stdout.write(`  [WARN] cannot stat: ${absolutePath}\n`)
      }
    }
  }

  if (fs.existsSync(root)) {
    walk(root)
  }
  return entries
}

const copyWithMtime = (source: string, destination: string) => {
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.copyFileSync(source, destination)
  const stats = fs.statSync(source)
  fs.utimesSync(destination, stats.atime, stats.mtime)
}

export const syncCloudWorkDesktop = async (argv: ReadonlyArray<string>) => {
  const dryRun = argv.includes('--dry-run')
  const tag = dryRun ? '[DRY-RUN] ' : ''

  logStep('Scanning Google Drive / Work Desktop ...')
  const googleFiles = walkDirectory(gdriveWorkDesktop)
  process.stdout.write(`  ${Object.keys(googleFiles).length} files indexed\n`)

  logStep('Scanning OneDrive / Work Desktop ...')
  const oneDriveFiles = walkDirectory(oneDriveWorkDesktop)
  process.stdout.write(`  ${Object.keys(oneDriveFiles).length} files indexed\n`)

  const allPaths = [...new Set([...Object.keys(googleFiles), ...Object.keys(oneDriveFiles)])].sort()
  logStep(`Syncing ${allPaths.length} unique paths (Google Drive <-> OneDrive) ...`)

  let copied = 0
  let updated = 0
  let skipped = 0

  for (const relativePath of allPaths) {
    const googleFile = googleFiles[relativePath]
    const oneDriveFile = oneDriveFiles[relativePath]

    if (googleFile && !oneDriveFile) {
      process.stdout.write(`  ${tag}[COPY] gdrive -> onedrive: ${relativePath}\n`)
      if (!dryRun) {
        try {
          copyWithMtime(googleFile.absPath, path.join(oneDriveWorkDesktop, relativePath))
          copied += 1
        } catch (error) {
          process.stdout.write(`  [WARN] copy failed (cloud-only?): ${relativePath} - ${error}\n`)
        }
      } else {
        copied += 1
      }
      continue
    }

    if (oneDriveFile && !googleFile) {
      process.stdout.write(`  ${tag}[COPY] onedrive -> gdrive: ${relativePath}\n`)
      if (!dryRun) {
        try {
          copyWithMtime(oneDriveFile.absPath, path.join(gdriveWorkDesktop, relativePath))
          copied += 1
        } catch (error) {
          process.stdout.write(`  [WARN] copy failed (cloud-only?): ${relativePath} - ${error}\n`)
        }
      } else {
        copied += 1
      }
      continue
    }

    if (!googleFile || !oneDriveFile) {
      continue
    }

    const diff = googleFile.mtimeMs - oneDriveFile.mtimeMs
    if (Math.abs(diff) <= mtimeToleranceMs && googleFile.size === oneDriveFile.size) {
      skipped += 1
      continue
    }

    const source = diff > mtimeToleranceMs ? googleFile : oneDriveFile
    const destinationRoot = diff > mtimeToleranceMs ? oneDriveWorkDesktop : gdriveWorkDesktop
    const sourceLabel = diff > mtimeToleranceMs ? 'gdrive' : 'onedrive'
    const destinationLabel = diff > mtimeToleranceMs ? 'onedrive' : 'gdrive'

    process.stdout.write(
      `  ${tag}[UPDATE] ${sourceLabel} -> ${destinationLabel}: ${relativePath} (${sourceLabel} newer by ${Math.round(Math.abs(diff) / 1000)}s)\n`,
    )
    if (!dryRun) {
      try {
        copyWithMtime(source.absPath, path.join(destinationRoot, relativePath))
        updated += 1
      } catch (error) {
        process.stdout.write(`  [WARN] update failed (cloud-only?): ${relativePath} - ${error}\n`)
      }
    } else {
      updated += 1
    }
  }

  process.stdout.write(
    `\n  result: ${copied} copied, ${updated} updated, ${skipped} identical/skipped\n`,
  )

  logStep('Mirroring OneDrive Work Desktop -> github/work/Work Desktop ...')
  if (!dryRun) {
    fs.mkdirSync(gitWorkDesktop, { recursive: true })
  }

  const oneDriveMirror = walkDirectory(oneDriveWorkDesktop)
  const gitMirror = walkDirectory(gitWorkDesktop)
  if (Object.keys(oneDriveMirror).length === 0 && Object.keys(gitMirror).length > 0) {
    process.stdout.write(
      '  [ABORT] OneDrive source is empty but git mirror has files.\n          This usually means OneDrive is unmounted or unreadable.\n          Skipping mirror to prevent data loss.\n',
    )
    return
  }

  let mirroredCopied = 0
  let mirroredDeleted = 0
  let mirroredSkipped = 0
  let mirroredUpdated = 0
  let warned = 0

  for (const [relativePath, oneDriveEntry] of Object.entries(oneDriveMirror)) {
    const destination = path.join(gitWorkDesktop, relativePath)
    const gitEntry = gitMirror[relativePath]
    if (!gitEntry) {
      process.stdout.write(`  ${tag}[COPY] onedrive -> git: ${relativePath}\n`)
      if (!dryRun) {
        try {
          copyWithMtime(oneDriveEntry.absPath, destination)
          mirroredCopied += 1
        } catch (error) {
          process.stdout.write(`  [WARN] copy failed (cloud-only?): ${relativePath} - ${error}\n`)
          warned += 1
        }
      } else {
        mirroredCopied += 1
      }
      continue
    }

    const diff = Math.abs(oneDriveEntry.mtimeMs - gitEntry.mtimeMs)
    if (diff <= mtimeToleranceMs && oneDriveEntry.size === gitEntry.size) {
      mirroredSkipped += 1
      continue
    }

    process.stdout.write(`  ${tag}[UPDATE] onedrive -> git: ${relativePath}\n`)
    if (!dryRun) {
      try {
        copyWithMtime(oneDriveEntry.absPath, destination)
        mirroredUpdated += 1
      } catch (error) {
        process.stdout.write(`  [WARN] update failed (cloud-only?): ${relativePath} - ${error}\n`)
        warned += 1
      }
    } else {
      mirroredUpdated += 1
    }
  }

  for (const relativePath of Object.keys(gitMirror)) {
    if (oneDriveMirror[relativePath]) {
      continue
    }

    process.stdout.write(`  ${tag}[DELETE] git stale file: ${relativePath}\n`)
    if (!dryRun) {
      try {
        fs.rmSync(path.join(gitWorkDesktop, relativePath), { force: true })
        mirroredDeleted += 1
      } catch (error) {
        process.stdout.write(`  [WARN] delete failed: ${relativePath} - ${error}\n`)
        warned += 1
      }
    } else {
      mirroredDeleted += 1
    }
  }

  process.stdout.write(
    `\n  mirror result: ${mirroredCopied} copied, ${mirroredUpdated} updated, ${mirroredDeleted} deleted, ${mirroredSkipped} identical/skipped, ${warned} warnings\n`,
  )
}
