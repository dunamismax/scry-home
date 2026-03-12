import { createHash } from 'node:crypto'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  decryptPayload,
  directorySnapshot,
  encryptPayload,
  ensureDir,
  ensureParentDir,
  logStep,
  runCommand,
} from '@scry-home/core'

import { commandExists } from '../lib/system'

const sshFormat = { magic: 'SCRYSSH2' } as const

const buildManagedBlock = (
  githubHostAlias: string,
  githubHostName: string,
  githubIdentity: string,
  codebergHostAlias: string,
  codebergHostName: string,
  codebergIdentity: string,
) => {
  const block = (hostAlias: string, hostName: string, identity: string) =>
    [
      `Host ${hostAlias}`,
      `  HostName ${hostName}`,
      '  User git',
      `  IdentityFile ${identity}`,
      '  IdentitiesOnly yes',
    ].join('\n')

  return [
    '# >>> scry managed git hosts >>>',
    block(githubHostAlias, githubHostName, githubIdentity),
    '',
    block(codebergHostAlias, codebergHostName, codebergIdentity),
    '# <<< scry managed git hosts <<<',
    '',
  ].join('\n')
}

export const setupSshBackup = async () => {
  const passphrase = process.env.SCRY_SSH_BACKUP_PASSPHRASE ?? ''
  const home = process.env.HOME ?? os.homedir()
  const sshDir = path.join(home, '.ssh')
  const repoRoot = process.cwd()
  const vaultDir = path.join(repoRoot, 'vault', 'ssh')
  const encryptedFile = process.env.SCRY_SSH_BACKUP_FILE ?? path.join(vaultDir, 'ssh-keys.tar.enc')
  const metadataFile =
    process.env.SCRY_SSH_METADATA_FILE ?? path.join(vaultDir, 'ssh-keys.meta.json')

  logStep('Checking SSH backup prerequisites')
  if (!commandExists('tar')) {
    throw new Error('Missing required tool: tar')
  }
  process.stdout.write('ok: tar\n')

  if (!fs.existsSync(sshDir)) {
    throw new Error(`SSH directory not found: ${sshDir}`)
  }
  if (passphrase.length < 16) {
    throw new Error('Set SCRY_SSH_BACKUP_PASSPHRASE with at least 16 characters.')
  }

  const snapshot = directorySnapshot(sshDir)
  const hasExisting =
    (await fsp
      .access(encryptedFile)
      .then(() => true)
      .catch(() => false)) &&
    (await fsp
      .access(metadataFile)
      .then(() => true)
      .catch(() => false))

  if (hasExisting) {
    try {
      const metadata = JSON.parse(await fsp.readFile(metadataFile, 'utf8')) as {
        sourceFingerprint?: string
      }
      if (metadata.sourceFingerprint === snapshot.fingerprint) {
        logStep('SSH backup unchanged')
        process.stdout.write(`source fingerprint: ${snapshot.fingerprint}\n`)
        process.stdout.write('backup is already current; no files changed\n')
        return
      }
    } catch {
      // stale metadata will be replaced
    }
  }

  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'scry-ssh-backup-'))
  try {
    logStep('Creating encrypted SSH archive')
    await ensureDir(vaultDir)
    await ensureParentDir(encryptedFile)
    const tempTar = path.join(tempDir, 'ssh-keys.tar')
    await runCommand(['tar', '-C', home, '-cf', tempTar, '.ssh'])

    const plaintext = await fsp.readFile(tempTar)
    const payload = encryptPayload(plaintext, passphrase, sshFormat)
    await fsp.writeFile(encryptedFile, payload)
    await fsp.chmod(encryptedFile, 0o600)

    logStep('Writing backup metadata')
    const metadata = {
      cipher: 'aes-256-gcm',
      createdAt: new Date().toISOString(),
      encryptedBackupFile: path.relative(repoRoot, encryptedFile),
      encryptedBackupSha256: createHash('sha256')
        .update(await fsp.readFile(encryptedFile))
        .digest('hex'),
      host: os.hostname(),
      kdf: 'pbkdf2',
      kdfDigest: 'sha256',
      kdfIterations: 250_000,
      sourceDir: '~/.ssh',
      sourceFileCount: snapshot.fileCount,
      sourceFingerprint: snapshot.fingerprint,
      sourceTotalBytes: snapshot.totalBytes,
    }
    await ensureDir(path.dirname(metadataFile))
    await fsp.writeFile(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8')
    await fsp.chmod(metadataFile, 0o600)
  } finally {
    await fsp.rm(tempDir, { force: true, recursive: true })
  }

  logStep('SSH backup complete')
  process.stdout.write(`created: ${encryptedFile}\n`)
  process.stdout.write(`created: ${metadataFile}\n`)
}

const normalizePermissions = (target: string) => {
  const stats = fs.lstatSync(target)
  if (stats.isSymbolicLink()) {
    return
  }
  if (stats.isDirectory()) {
    fs.chmodSync(target, 0o700)
    for (const child of fs.readdirSync(target)) {
      normalizePermissions(path.join(target, child))
    }
    return
  }
  if (stats.isFile()) {
    const mode =
      target.endsWith('.pub') || path.basename(target).includes('known_hosts') ? 0o644 : 0o600
    fs.chmodSync(target, mode)
  }
}

export const setupSshRestore = async () => {
  const passphrase = process.env.SCRY_SSH_BACKUP_PASSPHRASE ?? ''
  const home = process.env.HOME ?? os.homedir()
  const sshDir = path.join(home, '.ssh')
  const repoRoot = process.cwd()
  const restoreStamp = `${Date.now()}`
  const stagedSshDir = path.join(home, `.ssh.scry-staged-${restoreStamp}`)
  const backupSshDir = path.join(home, `.ssh.scry-backup-${restoreStamp}`)
  const encryptedFile =
    process.env.SCRY_SSH_BACKUP_FILE ?? path.join(repoRoot, 'vault', 'ssh', 'ssh-keys.tar.enc')
  const githubHostAlias = process.env.SCRY_GITHUB_HOST_ALIAS ?? 'github.com-dunamismax'
  const githubHostName = process.env.SCRY_GITHUB_HOSTNAME ?? 'github.com'
  const codebergHostAlias = process.env.SCRY_CODEBERG_HOST_ALIAS ?? 'codeberg.org-dunamismax'
  const codebergHostName = process.env.SCRY_CODEBERG_HOSTNAME ?? 'codeberg.org'
  const githubIdentity = process.env.SCRY_GITHUB_IDENTITY ?? '~/.ssh/id_ed25519'
  const codebergIdentity = process.env.SCRY_CODEBERG_IDENTITY ?? '~/.ssh/id_ed25519'

  logStep('Checking SSH restore prerequisites')
  if (!commandExists('tar')) {
    throw new Error('Missing required tool: tar')
  }
  process.stdout.write('ok: tar\n')
  if (!fs.existsSync(encryptedFile)) {
    throw new Error(`Encrypted backup not found: ${encryptedFile}`)
  }
  if (passphrase.length < 16) {
    throw new Error('Set SCRY_SSH_BACKUP_PASSPHRASE with at least 16 characters.')
  }

  const tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), `scry-ssh-restore-${restoreStamp}-`))
  let stagedReady = false
  let backupCreated = false
  let restoreCommitted = false

  try {
    const tempTar = path.join(tempDir, 'ssh-keys.tar')
    const extractRoot = path.join(tempDir, 'extract-root')

    logStep('Decrypting and authenticating SSH archive')
    const payload = await fsp.readFile(encryptedFile)
    const plaintext = decryptPayload(payload, passphrase, sshFormat)
    await fsp.writeFile(tempTar, plaintext)

    logStep('Preparing staged ~/.ssh restore')
    await fsp.mkdir(extractRoot, { recursive: true })
    await runCommand(['tar', '-C', extractRoot, '-xf', tempTar])
    const extractedSsh = path.join(extractRoot, '.ssh')
    if (!fs.existsSync(extractedSsh)) {
      throw new Error('Decrypted archive does not contain a .ssh directory.')
    }

    await fsp.cp(extractedSsh, stagedSshDir, { recursive: true })
    stagedReady = true

    logStep('Normalizing staged ~/.ssh permissions')
    normalizePermissions(stagedSshDir)

    logStep('Ensuring managed Git host entries in staged ~/.ssh/config')
    const managedStart = '# >>> scry managed git hosts >>>'
    const managedEnd = '# <<< scry managed git hosts <<<'
    const managedBlock = buildManagedBlock(
      githubHostAlias,
      githubHostName,
      githubIdentity,
      codebergHostAlias,
      codebergHostName,
      codebergIdentity,
    )
    const stagedConfig = path.join(stagedSshDir, 'config')
    const existing = fs.existsSync(stagedConfig)
      ? (await fsp.readFile(stagedConfig, 'utf8')).replaceAll('\r\n', '\n')
      : ''
    const withoutManaged = existing
      .replace(new RegExp(`${managedStart}[\\s\\S]*?${managedEnd}\\n?`, 'g'), '')
      .trim()
    const nextConfig = withoutManaged
      ? `${managedBlock}\n${withoutManaged}${withoutManaged.endsWith('\n') ? '' : '\n'}`
      : managedBlock
    if (nextConfig !== existing) {
      await fsp.writeFile(stagedConfig, nextConfig, 'utf8')
    }
    await fsp.chmod(stagedConfig, 0o600)

    logStep('Atomically swapping staged restore into ~/.ssh')
    if (fs.existsSync(sshDir)) {
      await fsp.rename(sshDir, backupSshDir)
      backupCreated = true
    }

    try {
      await fsp.rename(stagedSshDir, sshDir)
      stagedReady = false
      restoreCommitted = true
    } catch (error) {
      if (backupCreated && !fs.existsSync(sshDir) && fs.existsSync(backupSshDir)) {
        await fsp.rename(backupSshDir, sshDir)
      }
      throw error
    }
  } catch (error) {
    if (
      backupCreated &&
      !restoreCommitted &&
      !fs.existsSync(sshDir) &&
      fs.existsSync(backupSshDir)
    ) {
      await fsp.rename(backupSshDir, sshDir)
    }
    if (stagedReady && fs.existsSync(stagedSshDir)) {
      await fsp.rm(stagedSshDir, { force: true, recursive: true })
    }
    throw error
  } finally {
    await fsp.rm(tempDir, { force: true, recursive: true })
  }

  logStep('SSH restore complete')
  process.stdout.write(`restored: ${sshDir}\n`)
  if (backupCreated) {
    process.stdout.write(`backup: ${backupSshDir}\n`)
  }
  process.stdout.write(`next: ssh -T git@${githubHostAlias}\n`)
  process.stdout.write(`next: ssh -T git@${codebergHostAlias}\n`)
}
