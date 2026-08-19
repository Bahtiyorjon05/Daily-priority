import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Proving who a Mini App visitor is.
 *
 * Telegram hands the page a signed blob (`initData`) describing the viewer. It is
 * the ONLY thing standing between "this is user 12345" and anyone typing
 * `?user=12345` into a URL, so it is verified server-side, every time, before it
 * is allowed to mean anything. Nothing here trusts the client.
 *
 * The scheme, from core.telegram.org/bots/webapps:
 *
 *   secret  = HMAC_SHA256(key: "WebAppData", data: <bot token>)
 *   check   = every field except `hash`, as `key=value`, sorted by key, joined
 *             by newlines
 *   valid   = hex(HMAC_SHA256(key: secret, data: check)) === hash
 *
 * Server-only: it needs the bot token, and importing it anywhere the browser can
 * reach would ship the token to every visitor.
 */

/**
 * How old a login blob may be.
 *
 * Telegram recommends checking `auth_date` but names no window. Five minutes is
 * the usual choice and was wrong here: `initData` is stamped when the Mini App
 * OPENS and never refreshes, so it has to stay valid for as long as someone
 * might reasonably take inside the app before the account gets linked -- reading
 * the sign-in page, typing a password, going through onboarding. Five minutes
 * expired mid-signup and the link then failed silently.
 *
 * An hour still bounds a captured blob to a short window, which is what the
 * check is for; nothing is signed in permanently by it.
 */
export const MAX_AUTH_AGE_SECONDS = 60 * 60

export type TelegramUser = {
  id: string
  firstName: string
  lastName?: string
  username?: string
  languageCode?: string
  photoUrl?: string
  isPremium?: boolean
}

export type InitDataResult =
  | { ok: true; user: TelegramUser; authDate: Date; startParam?: string }
  | { ok: false; reason: 'missing' | 'malformed' | 'bad-signature' | 'expired' | 'no-user' | 'no-token' }

/**
 * The string Telegram signed.
 *
 * `signature` is a newer field, added after this scheme was defined, and the
 * documentation does not say whether it is inside or outside the hash. Rather
 * than guess -- guessing wrong means nobody can ever log in -- both readings are
 * tried. That costs nothing: forging either string still requires the bot token,
 * so two well-defined targets are no easier to hit than one.
 */
function checkString(params: URLSearchParams, dropSignature: boolean): string {
  const pairs: string[] = []
  for (const [key, value] of params.entries()) {
    if (key === 'hash') continue
    if (dropSignature && key === 'signature') continue
    pairs.push(`${key}=${value}`)
  }
  return pairs.sort().join('\n')
}

/** Constant-time compare of two hex digests of the same length. */
function hexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

/**
 * Verify a raw `initData` query string and return who sent it.
 *
 * @param initData the raw string from `window.Telegram.WebApp.initData`
 * @param botToken defaults to the environment, passed explicitly in tests
 * @param now injectable so expiry can be tested without waiting five minutes
 */
export function verifyInitData(
  initData: string,
  botToken = process.env.TELEGRAM_BOT_TOKEN,
  now: Date = new Date()
): InitDataResult {
  if (!botToken) return { ok: false, reason: 'no-token' }
  if (!initData || typeof initData !== 'string') return { ok: false, reason: 'missing' }

  let params: URLSearchParams
  try {
    params = new URLSearchParams(initData)
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  const hash = params.get('hash')
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return { ok: false, reason: 'malformed' }

  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const signed = [checkString(params, false), checkString(params, true)].some((candidate) =>
    hexEqual(createHmac('sha256', secret).update(candidate).digest('hex'), hash)
  )
  if (!signed) return { ok: false, reason: 'bad-signature' }

  /*
    Freshness. A valid blob is valid forever without this, so one captured from a
    shared screenshot or a proxy log would be a permanent key to the account.
  */
  const authDateRaw = Number(params.get('auth_date'))
  if (!Number.isFinite(authDateRaw) || authDateRaw <= 0) return { ok: false, reason: 'malformed' }
  const authDate = new Date(authDateRaw * 1000)
  const ageSeconds = (now.getTime() - authDate.getTime()) / 1000
  // A small negative age is ordinary clock skew, not an attack.
  if (ageSeconds > MAX_AUTH_AGE_SECONDS || ageSeconds < -MAX_AUTH_AGE_SECONDS) {
    return { ok: false, reason: 'expired' }
  }

  const rawUser = params.get('user')
  if (!rawUser) return { ok: false, reason: 'no-user' }

  try {
    const parsed = JSON.parse(rawUser)
    if (!parsed?.id) return { ok: false, reason: 'no-user' }
    return {
      ok: true,
      authDate,
      startParam: params.get('start_param') ?? undefined,
      user: {
        // A string, not a number: Telegram ids already exceed 32 bits and are
        // only promised to fit in 52, and this is a database key.
        id: String(parsed.id),
        firstName: String(parsed.first_name ?? ''),
        lastName: parsed.last_name ? String(parsed.last_name) : undefined,
        username: parsed.username ? String(parsed.username) : undefined,
        languageCode: parsed.language_code ? String(parsed.language_code) : undefined,
        photoUrl: parsed.photo_url ? String(parsed.photo_url) : undefined,
        isPremium: parsed.is_premium === true,
      },
    }
  } catch {
    return { ok: false, reason: 'no-user' }
  }
}

/**
 * Build a signed `initData` string. Test helper, and the only honest way to
 * assert the verifier accepts what Telegram actually sends.
 */
export function signInitDataForTest(
  fields: Record<string, string>,
  botToken: string
): string {
  const params = new URLSearchParams(fields)
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  const hash = createHmac('sha256', secret).update(checkString(params, false)).digest('hex')
  params.set('hash', hash)
  return params.toString()
}
