/**
 * Reversible password vault (AES-256-GCM).
 *
 * Stores a decryptable copy of a user's password alongside the one-way bcrypt
 * hash. Authentication always uses the bcrypt hash — this vault exists solely so
 * the admin dashboard can display the original password.
 *
 * The key lives in PASSWORD_VAULT_KEY (64 hex chars = 32 bytes) and must never
 * be committed. Anyone holding the key + a database dump can read every
 * password, so treat the key as the most sensitive secret in the project.
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit nonce, the standard for GCM
const KEY_LENGTH = 32
const VERSION = 'v1'

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey

  const raw = process.env.PASSWORD_VAULT_KEY
  if (!raw) {
    throw new Error(
      'PASSWORD_VAULT_KEY is not set. Generate one with: openssl rand -hex 32'
    )
  }

  const key = Buffer.from(raw.trim(), 'hex')
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `PASSWORD_VAULT_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex chars), got ${key.length}`
    )
  }

  cachedKey = key
  return key
}

export function isVaultConfigured(): boolean {
  try {
    getKey()
    return true
  } catch {
    return false
  }
}

/**
 * Encrypts a plaintext password. Output format: v1:<iv>:<authTag>:<ciphertext>
 * (all base64url). Returns null if the vault key is missing so that callers can
 * degrade gracefully instead of breaking signup/login.
 */
export function encryptPassword(plaintext: string): string | null {
  if (!plaintext) return null

  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)

    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ])
    const authTag = cipher.getAuthTag()

    return [
      VERSION,
      iv.toString('base64url'),
      authTag.toString('base64url'),
      ciphertext.toString('base64url'),
    ].join(':')
  } catch (error) {
    console.error('[password-vault] encrypt failed:', (error as Error).message)
    return null
  }
}

/**
 * Reverses encryptPassword. Returns null when the value is missing, malformed,
 * or fails GCM authentication (e.g. the key was rotated).
 */
export function decryptPassword(payload: string | null | undefined): string | null {
  if (!payload) return null

  try {
    const parts = payload.split(':')
    if (parts.length !== 4 || parts[0] !== VERSION) return null

    const [, ivB64, tagB64, dataB64] = parts
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getKey(),
      Buffer.from(ivB64, 'base64url')
    )
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))

    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    // Wrong key or tampered ciphertext — never throw into a request path.
    return null
  }
}
