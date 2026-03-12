import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  ConfigBackupMetadataSchema,
  decryptPayload,
  formatZodError,
  logStep,
  runCommand,
} from '@scry-home/core'

const configFormat = { magic: 'SCRYCFG1' } as const

export const verifyConfigBackup = async () => {
  const passphrase = process.env.SCRY_CONFIG_BACKUP_PASSPHRASE ?? ''
  const repoRoot = process.cwd()
  const encryptedFile =
    process.env.SCRY_CONFIG_BACKUP_FILE ??
    path.join(repoRoot, 'vault', 'config', 'critical-configs.tar.enc')
  const metadataFile =
    process.env.SCRY_CONFIG_METADATA_FILE ??
    path.join(repoRoot, 'vault', 'config', 'critical-configs.meta.json')

  logStep('Checking config backup verification prerequisites')

  if (passphrase.length < 16) {
    throw new Error(
      'Set SCRY_CONFIG_BACKUP_PASSPHRASE with at least 16 characters before verification.',
    )
  }

  const encrypted = await fs.readFile(encryptedFile)
  const metadataResult = ConfigBackupMetadataSchema.safeParse(
    JSON.parse(await fs.readFile(metadataFile, 'utf8')),
  )

  if (!metadataResult.success) {
    throw new Error(`Config backup metadata is invalid: ${formatZodError(metadataResult.error)}`)
  }

  const metadata = metadataResult.data

  if (metadata.encryptedBackupSha256) {
    const actualSha = createHash('sha256').update(encrypted).digest('hex')
    if (actualSha !== metadata.encryptedBackupSha256) {
      throw new Error(
        `Encrypted backup SHA-256 does not match metadata. metadata=${metadata.encryptedBackupSha256} actual=${actualSha}`,
      )
    }
  }

  logStep('Decrypting and extracting backup payload to temp workspace')
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scry-config-verify-'))

  try {
    const plaintext = decryptPayload(encrypted, passphrase, configFormat)
    const tarPath = path.join(tempDir, 'critical-configs.tar')
    await fs.writeFile(tarPath, plaintext)
    await runCommand(['tar', '-xf', tarPath, '-C', tempDir])

    logStep('Validating recorded backup contents')
    const missing = []
    for (const relativePath of metadata.includedPaths) {
      const absolutePath = path.join(tempDir, relativePath)
      const exists = await fs
        .access(absolutePath)
        .then(() => true)
        .catch(() => false)
      if (!exists) {
        missing.push(relativePath)
      }
    }

    if (missing.length > 0) {
      throw new Error(`Restore preview missing recorded paths: ${missing.join(', ')}`)
    }

    const tarSize = (await fs.stat(tarPath)).size
    logStep('Config backup verification passed')
    process.stdout.write(`artifact: ${encryptedFile}\n`)
    process.stdout.write(`metadata: ${metadataFile}\n`)
    process.stdout.write(`decrypted tar bytes: ${tarSize}\n`)
    process.stdout.write(`recorded backup paths: ${metadata.includedPaths.length} present\n`)
    process.stdout.write(`source fingerprint: ${metadata.sourceFingerprint ?? 'unknown'}\n`)
    process.stdout.write(`home reference: ${process.env.HOME ?? os.homedir()}\n`)
  } finally {
    await fs.rm(tempDir, { force: true, recursive: true })
  }
}
