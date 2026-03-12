import { createCipheriv, createDecipheriv, createHash, pbkdf2Sync, randomBytes } from 'node:crypto'

import { InvalidEncryptedPayload } from './errors'

const AUTH_TAG_LENGTH = 16
const IV_LENGTH = 12
const KEY_LENGTH = 32
const KDF_ITERATIONS = 250_000
const SALT_LENGTH = 16

export interface CryptoFormat {
  readonly magic: string
}

const deriveKey = (passphrase: string, salt: Buffer) =>
  pbkdf2Sync(passphrase, salt, KDF_ITERATIONS, KEY_LENGTH, 'sha256')

export const sha256Hex = (payload: Uint8Array) => createHash('sha256').update(payload).digest('hex')

export const encryptPayload = (plaintext: Uint8Array, passphrase: string, format: CryptoFormat) => {
  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  const key = deriveKey(passphrase, salt)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([Buffer.from(format.magic), salt, iv, authTag, ciphertext])
}

export const decryptPayload = (payload: Uint8Array, passphrase: string, format: CryptoFormat) => {
  const magic = Buffer.from(format.magic)
  const minimumLength = magic.length + SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH

  if (payload.length < minimumLength) {
    throw new InvalidEncryptedPayload({
      message: 'Encrypted payload is malformed or truncated.',
    })
  }

  const buffer = Buffer.from(payload)
  const actualMagic = buffer.subarray(0, magic.length).toString('utf8')
  if (actualMagic !== format.magic) {
    throw new InvalidEncryptedPayload({
      message: `Unexpected format magic: ${actualMagic} (expected ${format.magic})`,
    })
  }

  let offset = magic.length
  const salt = buffer.subarray(offset, offset + SALT_LENGTH)
  offset += SALT_LENGTH
  const iv = buffer.subarray(offset, offset + IV_LENGTH)
  offset += IV_LENGTH
  const authTag = buffer.subarray(offset, offset + AUTH_TAG_LENGTH)
  offset += AUTH_TAG_LENGTH
  const ciphertext = buffer.subarray(offset)

  try {
    const decipher = createDecipheriv('aes-256-gcm', deriveKey(passphrase, salt), iv)
    decipher.setAuthTag(authTag)
    return Buffer.concat([decipher.update(ciphertext), decipher.final()])
  } catch (error) {
    throw new InvalidEncryptedPayload({
      message:
        error instanceof Error ? error.message : 'Failed to decrypt and authenticate payload.',
    })
  }
}
