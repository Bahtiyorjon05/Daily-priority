/**
 * Admin dashboard authentication.
 *
 * Separate from the app's NextAuth flow — the admin panel has a single set of
 * credentials (env: ADMIN_USERNAME / ADMIN_PASSWORD) and its own signed cookie.
 * The session token is a compact HMAC-signed payload so middleware can verify it
 * on the edge without a database round-trip.
 *
 * Implemented with Web Crypto globals only (no `node:crypto` import) so it runs
 * unchanged in both the Node route-handler runtime and the edge middleware runtime.
 */

export const ADMIN_COOKIE = 'admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 8 // 8 hours
export const ADMIN_SESSION_MAX_AGE = SESSION_TTL_MS / 1000

function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'insecure-dev-admin-secret-change-me'
  )
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    // No hardcoded default — the real password is supplied via env
    // (ADMIN_PASSWORD) in local .env and Vercel. Never commit it to source.
    password: process.env.ADMIN_PASSWORD || '',
  }
}

/** Timing-safe-ish credential check. Fails closed when not configured. */
export function verifyAdminCredentials(username: string, password: string): boolean {
  const creds = getAdminCredentials()
  // If ADMIN_PASSWORD isn't configured, deny everything (never allow empty).
  if (!creds.password) return false
  // Bitwise-AND both comparisons so we don't short-circuit on the first mismatch.
  const ok = timingSafeEqualStr(username, creds.username)
  const pk = timingSafeEqualStr(password, creds.password)
  return ok && pk
}

// --- base64url helpers (Buffer is available in both Node and Next edge) ---
function toB64url(bytes: Uint8Array | ArrayBuffer): string {
  return Buffer.from(bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes).toString('base64url')
}
function strToB64url(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64url')
}
function b64urlToStr(s: string): string {
  return Buffer.from(s, 'base64url').toString('utf8')
}

async function hmac(data: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return toB64url(sig)
}

/** Creates a signed session token of the form <payload>.<hmac>. */
export async function createAdminSession(username: string): Promise<string> {
  const payloadB64 = strToB64url(
    JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL_MS })
  )
  const sig = await hmac(payloadB64)
  return `${payloadB64}.${sig}`
}

/** Verifies a session token. Returns the username or null. */
export async function verifyAdminSession(
  token: string | undefined | null
): Promise<string | null> {
  if (!token) return null

  const [payloadB64, providedSig] = token.split('.')
  if (!payloadB64 || !providedSig) return null

  const expectedSig = await hmac(payloadB64)
  if (!timingSafeEqualStr(providedSig, expectedSig)) return null

  try {
    const payload = JSON.parse(b64urlToStr(payloadB64))
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
    return typeof payload.u === 'string' ? payload.u : null
  } catch {
    return null
  }
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}
