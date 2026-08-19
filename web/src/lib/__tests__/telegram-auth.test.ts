import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  verifyInitData,
  signInitDataForTest,
  MAX_AUTH_AGE_SECONDS,
} from '@/lib/telegram/init-data'
import { langOf } from '@/lib/telegram/bot'
import {
  telegramPlaceholderEmail,
  isPlaceholderEmail,
  telegramDisplayName,
} from '@/lib/telegram/account'

/**
 * The signature that stands between "user 12345" and anyone typing it.
 *
 * Inside a Mini App there is no password. The entire identity claim is a blob
 * Telegram signs with the bot token, so this verifier IS the authentication —
 * every weakness in it is an account takeover, not a bug.
 *
 * Tested with real signatures rather than fixtures: each case signs its own
 * payload with a throwaway token using the documented algorithm, so these fail if
 * the implementation drifts from the specification in either direction. No real
 * token appears anywhere in this repository.
 */

const TOKEN = '123456:test-token-not-real'
const OTHER_TOKEN = '999999:a-different-bot'

const nowSeconds = () => Math.floor(Date.now() / 1000)

const user = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ id: 42, first_name: 'Aisha', username: 'aisha', language_code: 'uz', ...over })

const validInitData = (fields: Record<string, string> = {}, token = TOKEN) =>
  signInitDataForTest(
    { auth_date: String(nowSeconds()), query_id: 'AAF', user: user(), ...fields },
    token
  )

describe('verifying init data', () => {
  it('accepts a blob signed with our bot token', () => {
    const result = verifyInitData(validInitData(), TOKEN)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.user.id).toBe('42')
      expect(result.user.firstName).toBe('Aisha')
      expect(result.user.username).toBe('aisha')
    }
  })

  it('follows the documented key derivation', () => {
    /*
      The one detail that is easy to get backwards: the secret is
      HMAC(key: "WebAppData", data: token), not HMAC(key: token, data:
      "WebAppData"). Swapping them produces a verifier that is internally
      consistent, passes any test written against itself, and rejects every real
      login from Telegram. So this asserts against the algorithm, independently
      computed here.
    */
    const authDate = String(nowSeconds())
    const params = new URLSearchParams({ auth_date: authDate, user: user() })
    const check = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n')
    const secret = createHmac('sha256', 'WebAppData').update(TOKEN).digest()
    const hash = createHmac('sha256', secret).update(check).digest('hex')
    params.set('hash', hash)

    expect(verifyInitData(params.toString(), TOKEN).ok).toBe(true)
  })

  it('rejects a blob signed with a different bot token', () => {
    // Somebody else's bot must not be able to log people into this app.
    const result = verifyInitData(validInitData({}, OTHER_TOKEN), TOKEN)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('bad-signature')
  })

  it('rejects a tampered user id', () => {
    // The attack this whole file exists to stop: keep a real signature, change
    // who it claims to be.
    const signed = validInitData()
    const params = new URLSearchParams(signed)
    params.set('user', user({ id: 999999 }))

    const result = verifyInitData(params.toString(), TOKEN)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('bad-signature')
  })

  it('rejects an added field', () => {
    // Every field is inside the hash, so smuggling one in must invalidate it.
    const params = new URLSearchParams(validInitData())
    params.set('chat_instance', 'injected')
    expect(verifyInitData(params.toString(), TOKEN).ok).toBe(false)
  })

  it('rejects an unsigned blob', () => {
    const params = new URLSearchParams({ auth_date: String(nowSeconds()), user: user() })
    const result = verifyInitData(params.toString(), TOKEN)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('malformed')
  })

  it('rejects a hash that is not a hash', () => {
    const params = new URLSearchParams(validInitData())
    params.set('hash', 'nonsense')
    const result = verifyInitData(params.toString(), TOKEN)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('malformed')
  })

  it('expires old data', () => {
    /*
      A valid blob is valid forever without this check, so one captured from a
      screenshot, a shared link or a proxy log would be a permanent key to the
      account.
    */
    const stale = String(nowSeconds() - MAX_AUTH_AGE_SECONDS - 30)
    const result = verifyInitData(validInitData({ auth_date: stale }), TOKEN)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('expired')
  })

  it('accepts data from just inside the window', () => {
    const fresh = String(nowSeconds() - (MAX_AUTH_AGE_SECONDS - 30))
    expect(verifyInitData(validInitData({ auth_date: fresh }), TOKEN).ok).toBe(true)
  })

  it('rejects data timestamped far in the future', () => {
    // Otherwise a forged future date buys an attacker an unlimited window.
    const future = String(nowSeconds() + MAX_AUTH_AGE_SECONDS + 600)
    const result = verifyInitData(validInitData({ auth_date: future }), TOKEN)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('expired')
  })

  it('refuses to verify anything when no token is configured', () => {
    /*
      The dangerous failure mode is "no token, so nothing to compare against, so
      everything passes". It has to fail closed.

      The env var is removed rather than a falsy argument passed, because the
      default parameter is what production actually uses and only `undefined`
      triggers it.
    */
    const saved = process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_BOT_TOKEN
    try {
      const result = verifyInitData(validInitData())
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.reason).toBe('no-token')
    } finally {
      if (saved !== undefined) process.env.TELEGRAM_BOT_TOKEN = saved
    }
  })

  it('rejects empty and junk input', () => {
    for (const bad of ['', '   ', 'not-a-query-string']) {
      expect(verifyInitData(bad, TOKEN).ok, bad).toBe(false)
    }
  })

  it('requires a user, not just a valid signature', () => {
    // A signed blob with no user is authentic and still says nothing about who
    // is asking.
    const signed = signInitDataForTest({ auth_date: String(nowSeconds()) }, TOKEN)
    const result = verifyInitData(signed, TOKEN)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('no-user')
  })

  it('accepts a blob carrying a signature field', () => {
    /*
      Telegram added `signature` after this scheme was written and the docs do not
      say whether it sits inside the hash. Both readings are accepted, because
      guessing wrong means nobody can log in — and forging either still needs the
      bot token, so it is no weaker.
    */
    const authDate = String(nowSeconds())
    const inner = signInitDataForTest(
      { auth_date: authDate, user: user(), signature: 'abc123' },
      TOKEN
    )
    expect(verifyInitData(inner, TOKEN).ok, 'signature inside the hash').toBe(true)

    const outerParams = new URLSearchParams(
      signInitDataForTest({ auth_date: authDate, user: user() }, TOKEN)
    )
    outerParams.set('signature', 'abc123')
    expect(verifyInitData(outerParams.toString(), TOKEN).ok, 'signature outside the hash').toBe(true)
  })

  it('keeps the telegram id as a string', () => {
    // Telegram ids already exceed 32 bits and are only promised to fit in 52.
    // This one is a database key; rounding it would merge two people.
    const big = signInitDataForTest(
      { auth_date: String(nowSeconds()), user: user({ id: 7999999999999999 }) },
      TOKEN
    )
    const result = verifyInitData(big, TOKEN)
    expect(result.ok).toBe(true)
    if (result.ok) expect(typeof result.user.id).toBe('string')
  })
})

describe('turning a telegram identity into an account', () => {
  it('builds a placeholder address nobody can receive mail at', () => {
    // `User.email` is unique and required, and a Telegram account has no email.
    // The placeholder must be unmistakably fake so nothing ever tries to send to
    // it, and stable so reopening finds the same row.
    const email = telegramPlaceholderEmail('42')
    expect(email).toBe('tg42@telegram.local')
    expect(telegramPlaceholderEmail('42')).toBe(email)
    expect(isPlaceholderEmail(email)).toBe(true)
    expect(isPlaceholderEmail('someone@gmail.com')).toBe(false)
    expect(isPlaceholderEmail(null)).toBe(false)
  })

  it('always finds something to call someone', () => {
    expect(telegramDisplayName({ id: '1', firstName: 'Aisha', lastName: 'Karimova' })).toBe('Aisha Karimova')
    expect(telegramDisplayName({ id: '1', firstName: 'Aisha' })).toBe('Aisha')
    // Telegram allows a blank name; falling through to the username beats
    // greeting somebody as an empty string.
    expect(telegramDisplayName({ id: '1', firstName: '', username: 'aisha' })).toBe('aisha')
    expect(telegramDisplayName({ id: '1', firstName: '' })).toBe('Friend')
  })
})

describe('which language the bot answers in', () => {
  it('speaks Uzbek to Uzbek and Russian clients', () => {
    // Uzbek users very often run Telegram in Russian, and Uzbek is much closer
    // than English for them.
    expect(langOf('uz')).toBe('uz')
    expect(langOf('ru')).toBe('uz')
    expect(langOf('ru-RU')).toBe('uz')
  })

  it('falls back to English for everything else', () => {
    expect(langOf('en')).toBe('en')
    expect(langOf('en-GB')).toBe('en')
    expect(langOf('de')).toBe('en')
    expect(langOf(undefined)).toBe('en')
  })
})
