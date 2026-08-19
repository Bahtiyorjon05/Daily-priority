import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { cleanAppUrl } from '@/lib/telegram/app-url'

/**
 * The one character that took the whole bot down.
 *
 * Production held `NEXT_PUBLIC_APP_URL` with a trailing `\n`. Quoted in an
 * environment file that parses as a real newline, so every button the bot built
 * pointed at "https://host\n/dashboard". Telegram rejects a sendMessage whose
 * button URL is invalid — the entire message, not just the button — so every
 * single reply failed and the only visible symptom was a webhook happily
 * answering 200.
 *
 * Two lessons, both encoded below: sanitise the value, and never let a failed
 * send return silently.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const bot = strip(read('src/lib/telegram/bot.ts'))
const messages = strip(read('src/lib/telegram/messages.ts'))
const webhook = strip(read('src/app/api/telegram/webhook/route.ts'))

const GOOD = 'https://daily-priority.vercel.app'

describe('cleaning the base url', () => {
  it('survives the exact value that broke production', () => {
    expect(cleanAppUrl('https://daily-priority.vercel.app\n')).toBe(GOOD)
    expect(cleanAppUrl('  https://daily-priority.vercel.app  ')).toBe(GOOD)
    expect(cleanAppUrl('https://daily-priority.vercel.app\r\n')).toBe(GOOD)
  })

  it('removes a newline hiding in the middle', () => {
    // Just as fatal, and even harder to see in a dashboard field.
    expect(cleanAppUrl('https://daily-\npriority.vercel.app')).toBe(GOOD)
  })

  it('keeps hyphens', () => {
    /*
      The first version of the strip used a character class that quietly included
      `-`, turning daily-priority into dailypriority: a URL that parses, resolves
      to nothing, and would have been far harder to find than the newline.
    */
    expect(cleanAppUrl(GOOD)).toContain('daily-priority')
  })

  it('drops a trailing slash so paths do not double up', () => {
    // `${APP_URL}/dashboard` on a trailing slash gives `//dashboard`.
    expect(cleanAppUrl('https://daily-priority.vercel.app/')).toBe(GOOD)
    expect(cleanAppUrl('https://daily-priority.vercel.app///')).toBe(GOOD)
  })

  it('refuses anything Telegram would reject', () => {
    // Mini App and web_app buttons are https-only. Falling back beats sending a
    // URL that fails the whole message.
    expect(cleanAppUrl('http://daily-priority.vercel.app')).toBe(GOOD)
    expect(cleanAppUrl('not a url')).toBe(GOOD)
    expect(cleanAppUrl('')).toBe(GOOD)
    expect(cleanAppUrl(undefined)).toBe(GOOD)
  })

  it('is what the bot actually builds its buttons from', () => {
    // The point of the module is that nothing reads the raw variable any more.
    expect(messages).toMatch(/import \{ APP_URL \} from '@\/lib\/telegram\/app-url'/)
    expect(messages).not.toMatch(/process\.env\.NEXT_PUBLIC_APP_URL/)
    expect(bot).not.toMatch(/process\.env\.NEXT_PUBLIC_APP_URL/)
  })
})

describe('a reply that fails must say so', () => {
  it('routes every reply through the reporting helper', () => {
    /*
      `sendMessage` returns a result instead of throwing, which is right for the
      cron and wrong here: it meant the person pressed a button, nothing arrived,
      and the log said nothing either.
    */
    expect(bot).toMatch(/export async function reply\(/)
    expect(bot).toMatch(/console\.error\('\[telegram\] send failed', result\.error\)/)

    /*
      Exactly one `sendMessage` call in the file, and it is the one inside
      `reply`. Anything else is a handler that can fail in silence again.
    */
    expect(bot.match(/await sendMessage\(/g) ?? []).toHaveLength(1)
    const helper = bot.slice(bot.indexOf('export async function reply('))
    expect(helper).toMatch(/await sendMessage\(/)
  })

  it('carries the send failure into the outcome', () => {
    /*
      The first version of this diagnostic returned "start" whether or not the
      message went out, which is the same blindness it was written to remove.
      The outcome has to name the failure.
    */
    expect(bot).toMatch(/failures\.length \? `\$\{name\}:send-failed:\$\{failures\[0\]\}` : name/)
    // Per invocation, not module scope: two updates can be in flight in one
    // instance and a shared buffer would blame the wrong person.
    expect(bot).toMatch(/const failures: string\[\] = \[\]/)
    /*
      Exactly one `await reply(` inside handleMessage: the one in `say`. Every
      other path has to go through the collector or its failure vanishes again.
    */
    const handler = bot.slice(
      bot.indexOf('export async function handleMessage'),
      bot.indexOf('export async function reply(')
    )
    expect(handler.match(/await reply\(/g) ?? []).toHaveLength(1)
  })

  it('reports the outcome back through the webhook', () => {
    /*
      Telegram ignores the body and the endpoint is secret-gated, so this costs
      nothing — and it is the difference between "the bot is broken" and one call
      that names the failing step. Added because a totally dead bot was returning
      a perfectly healthy 200.
    */
    expect(webhook).toMatch(/const outcome = await handleMessage\(/)
    expect(webhook).toMatch(/const outcome = await handleCallback\(/)
    expect(webhook.match(/ok: true, outcome/g) ?? []).toHaveLength(2)
  })

  it('still answers 200 even when the send failed', () => {
    // The reply failing is our problem, not Telegram's. A non-2xx would have it
    // redeliver the same update forever on top of everything else.
    expect(webhook).not.toMatch(/status: 500/)
  })
})
