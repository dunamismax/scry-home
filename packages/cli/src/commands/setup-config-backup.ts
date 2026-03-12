import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  encryptPayload,
  ensureDir,
  ensureParentDir,
  logStep,
  runCommand,
  sourceSnapshot,
} from '@scry-home/core'

import { commandExists } from '../lib/system'

const configFormat = { magic: 'SCRYCFG1' } as const

const defaultConfigPaths = [
  '.ssh',
  '.gitconfig',
  '.zshrc',
  '.zprofile',
  '.codex/.codex-global-state.json',
  '.codex/config.toml',
  '.codex/rules',
  '.codex/auth.json',
  '.codex/state_5.sqlite',
  'Library/LaunchAgents',
  'Library/Application Support/Code - Insiders/User/mcp.json',
  'Library/Application Support/Code/User/mcp.json',
] as const

const parsePathList = (value: string) =>
  value
    .replaceAll(',', '\n')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

const normalizeHomeRelativePath = (home: string, raw: string) => {
  const trimmed = raw.trim().replace(/^~\//, '').replace(/^\.\//, '')
  const resolved = path.resolve(home, trimmed)
  const relative = path.relative(path.resolve(home), resolved)

  if (!trimmed || !relative || relative.startsWith('..') || relative.includes('\0')) {
    throw new Error(`Invalid config backup path: ${raw}`)
  }

  return relative
}

const buildConfigPathSet = async (home: string) => {
  const extraRaw = process.env.SCRY_CONFIG_EXTRA_PATHS ?? ''
  const excludeRaw = process.env.SCRY_CONFIG_EXCLUDE_PATHS ?? ''
  const requested: Array<string> = [...defaultConfigPaths]
  if (extraRaw) {
    requested.push(...parsePathList(extraRaw))
  }

  const excludes = new Set(
    parsePathList(excludeRaw).map((item) => normalizeHomeRelativePath(home, item)),
  )
  const deduped = new Set<string>()
  const requestedPaths: Array<string> = []
  const includedPaths: Array<string> = []
  const missingPaths: Array<string> = []

  for (const rawPath of requested) {
    const relative = normalizeHomeRelativePath(home, rawPath)
    if (deduped.has(relative)) {
      continue
    }
    deduped.add(relative)
    requestedPaths.push(relative)
    if (excludes.has(relative)) {
      continue
    }

    try {
      await fs.access(path.join(home, relative))
      includedPaths.push(relative)
    } catch {
      missingPaths.push(relative)
    }
  }

  return { includedPaths, missingPaths, requestedPaths }
}

export const setupConfigBackup = async () => {
  const passphrase = process.env.SCRY_CONFIG_BACKUP_PASSPHRASE ?? ''
  const home = process.env.HOME ?? os.homedir()
  const repoRoot = process.cwd()
  const vaultDir = path.join(repoRoot, 'vault', 'config')
  const encryptedFile =
    process.env.SCRY_CONFIG_BACKUP_FILE ?? path.join(vaultDir, 'critical-configs.tar.enc')
  const metadataFile =
    process.env.SCRY_CONFIG_METADATA_FILE ?? path.join(vaultDir, 'critical-configs.meta.json')

  logStep('Checking config backup prerequisites')
  if (!commandExists('tar')) {
    throw new Error('Missing required tool: tar')
  }
  process.stdout.write('ok: tar\n')

  if (passphrase.length < 16) {
    throw new Error('Set SCRY_CONFIG_BACKUP_PASSPHRASE with at least 16 characters.')
  }

  const pathSet = await buildConfigPathSet(home)
  if (pathSet.includedPaths.length === 0) {
    throw new Error(
      'No backup paths were found. Check SCRY_CONFIG_EXTRA_PATHS and SCRY_CONFIG_EXCLUDE_PATHS.',
    )
  }

  const snapshot = sourceSnapshot(home, pathSet.includedPaths)
  const hasExisting =
    (await fs
      .access(encryptedFile)
      .then(() => true)
      .catch(() => false)) &&
    (await fs
      .access(metadataFile)
      .then(() => true)
      .catch(() => false))

  if (hasExisting) {
    try {
      const metadata = JSON.parse(await fs.readFile(metadataFile, 'utf8')) as {
        includedPaths?: Array<string>
        sourceFingerprint?: string
      }

      if (
        metadata.sourceFingerprint === snapshot.fingerprint &&
        JSON.stringify(metadata.includedPaths ?? []) === JSON.stringify(pathSet.includedPaths)
      ) {
        logStep('Config backup unchanged')
        process.stdout.write(`source fingerprint: ${snapshot.fingerprint}\n`)
        process.stdout.write('backup is already current; no files changed\n')
        return
      }
    } catch {
      // Ignore stale metadata; a new backup will be written.
    }
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scry-config-backup-'))
  try {
    logStep('Creating encrypted critical config archive')
    await ensureDir(vaultDir)
    await ensureParentDir(encryptedFile)

    const tempTar = path.join(tempDir, 'critical-configs.tar')
    await runCommand(['tar', '-C', home, '-cf', tempTar, ...pathSet.includedPaths])
    const plaintext = await fs.readFile(tempTar)
    const payload = encryptPayload(plaintext, passphrase, configFormat)
    await fs.writeFile(encryptedFile, payload)
    await fs.chmod(encryptedFile, 0o600)

    logStep('Writing backup metadata')
    const encryptedBytes = await fs.readFile(encryptedFile)
    const metadata = {
      cipher: 'aes-256-gcm',
      createdAt: new Date().toISOString(),
      encryptedBackupFile: path.relative(repoRoot, encryptedFile),
      encryptedBackupSha256: createHash('sha256').update(encryptedBytes).digest('hex'),
      host: os.hostname(),
      includedPaths: pathSet.includedPaths,
      kdf: 'pbkdf2',
      kdfDigest: 'sha256',
      kdfIterations: 250_000,
      missingPaths: pathSet.missingPaths,
      requestedPaths: pathSet.requestedPaths,
      sourceFileCount: snapshot.fileCount,
      sourceFingerprint: snapshot.fingerprint,
      sourceHome: '~',
      sourceTotalBytes: snapshot.totalBytes,
    }

    await ensureDir(path.dirname(metadataFile))
    await fs.writeFile(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8')
    await fs.chmod(metadataFile, 0o600)
  } finally {
    await fs.rm(tempDir, { force: true, recursive: true })
  }

  logStep('Critical config backup complete')
  process.stdout.write(`created: ${encryptedFile}\n`)
  process.stdout.write(`created: ${metadataFile}\n`)
  process.stdout.write(`included paths: ${pathSet.includedPaths.length}\n`)
  if (pathSet.missingPaths.length > 0) {
    process.stdout.write(`missing paths: ${pathSet.missingPaths.length}\n`)
  }
}
