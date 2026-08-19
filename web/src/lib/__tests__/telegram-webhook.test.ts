import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The bot's front door.
 *
 * Two ways it silently dies, both found by actually calling the deployed URL
 * rather than by reading the code:
 *
 *  - The middleware protects `/api/*` with a session check. Telegram has no
 *    session cookie, so every update was answered 401 before the handler ran and
 *    the bot appeared completely dead while looking perfectly correct in source.
 *  - Anything other than a 2xx makes Telegram redeliver the same update, so one
 *    unhandled error becomes that update arriving forever.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const middleware = strip(read('src/middleware.ts'))
const route = strip(read('src/app/api/telegram/webhook/route.ts'))
const link = strip(read('src/app/api/telegram/link/route.ts'))

describe('the webhook is reachable by Telegram', () => {
  it('is exempt from the session check', () => {
    // Without this the bot is dead and the code looks fine.
    expect(middleware).toMatch(/'\/api\/telegram\/webhook'/)
  })

  it('still authenticates, with the secret Telegram was given', () => {
    // Exempt from the cookie check is not the same as unprotected. The URL is
    // public and guessable; the header is the whole defence.
    expect(route).toMatch(/x-telegram-bot-api-secret-token/)
    expect(route).toMatch(/TELEGRAM_WEBHOOK_SECRET/)
    expect(route).toMatch(/status: 401/)
  })

  it('refuses everything when no secret is configured', () => {
    // Fail closed. "No secret set, so nothing to compare, so let it through" is
    // how an open endpoint gets shipped.
    expect(route).toMatch(/if \(!expected\)/)
    expect(route).toMatch(/status: 503/)
  })

  it('answers 200 to anything it managed to read', () => {
    /*
      Telegram retries non-2xx responses. A 500 on one malformed update turns
      into that update being redelivered indefinitely, which is both a loop and a
      bill.
    */
    expect(route).toMatch(/catch \(error\)[\s\S]*?console\.error/)
    const tail = route.slice(route.lastIndexOf('catch'))
    expect(tail).toMatch(/NextResponse\.json\(\{ ok: true \}\)/)
  })

  it('leaves the link endpoint behind the session check', () => {
    /*
      The opposite call, deliberately. Linking says "attach this Telegram account
      to ME", so it needs to know who ME is -- a signed initData alone would let
      anyone attach their Telegram to any account.
    */
    expect(middleware).not.toMatch(/'\/api\/telegram\/link'/)
    expect(link).toMatch(/getServerSession/)
    expect(link).toMatch(/verifyInitData/)
  })

  it('refuses to move a Telegram account that belongs to someone else', () => {
    expect(link).toMatch(/status: 409/)
  })
})
