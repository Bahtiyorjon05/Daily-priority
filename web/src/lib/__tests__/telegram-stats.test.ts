import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { isAdmin } from '@/lib/telegram/stats'

/**
 * Knowing who is actually using the bot.
 *
 * The number that matters is the gap: starts say how many people the channel
 * sent, sign-ins say how many the app kept, and only the difference tells you
 * which of the two needs the work. `User.telegramId` cannot answer it — that
 * column only exists once somebody signs in, so everyone who pressed /start and
 * stopped there is invisible in it, and those are precisely the people worth
 * counting.
 *
 * The command is private, and privacy here means more than refusing: it must not
 * reveal that it exists.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const bot = strip(read('src/lib/telegram/bot.ts'))
const stats = strip(read('src/lib/telegram/stats.ts'))
const webhook = strip(read('src/app/api/telegram/webhook/route.ts'))
const setup = strip(read('scripts/telegram-setup.ts'))
const schema = read('prisma/schema.prisma')

const saved = process.env.TELEGRAM_ADMIN_ID
afterEach(() => {
  if (saved === undefined) delete process.env.TELEGRAM_ADMIN_ID
  else process.env.TELEGRAM_ADMIN_ID = saved
})

describe('who may read the stats', () => {
  it('is exactly one Telegram id', () => {
    process.env.TELEGRAM_ADMIN_ID = '7050582441'
    expect(isAdmin('7050582441')).toBe(true)
    expect(isAdmin('7050582442')).toBe(false)
    expect(isAdmin('')).toBe(false)
    // No prefix or substring matching: ids are compared whole.
    expect(isAdmin('705058244')).toBe(false)
    expect(isAdmin('70505824411')).toBe(false)
  })

  it('fails closed when no id is configured', () => {
    /*
      The dangerous reading of "no admin set" is "no restriction". That is how a
      private command becomes a public one after somebody renames an environment
      variable.
    */
    delete process.env.TELEGRAM_ADMIN_ID
    expect(isAdmin('7050582441')).toBe(false)
    expect(isAdmin('anything')).toBe(false)
  })

  it('ignores surrounding whitespace in the configured id', () => {
    // An env value with a stray newline has locked this project out once
    // already; here it would lock the owner out of their own stats.
    process.env.TELEGRAM_ADMIN_ID = ' 7050582441\n'
    expect(isAdmin('7050582441')).toBe(true)
  })
})

describe('the command hides from everyone else', () => {
  it('says nothing at all to anyone else', () => {
    /*
      Not a refusal, not the welcome, no keyboard -- no reply.

      A refusal confirms the command exists. Even the ordinary welcome is a
      tell: the same text arriving for a word nobody else knows is a hint worth
      following. Silence leaks nothing.
    */
    const branch = bot.slice(bot.indexOf("if (command === '/adminstats')"))
    const guard = branch.slice(0, branch.indexOf('const error'))
    expect(guard).toMatch(/if \(!isAdmin\(msg\.telegramId\)\) return 'ignored'/)
    // No send of any kind before the admin check has passed.
    expect(guard).not.toMatch(/reply\(/)
    expect(bot).not.toMatch(/not authorised|unauthorized|forbidden/i)
  })

  it('is not in the published command list', () => {
    // Telegram shows registered commands to everyone who opens the bot.
    expect(setup).not.toMatch(/adminstats/)
  })
})

describe('recording who uses the bot', () => {
  it('keeps a row for every chat, not only signed-in accounts', () => {
    expect(schema).toMatch(/model TelegramChat/)
    expect(schema).toMatch(/telegramId\s+String\s+@unique/)
    expect(stats).toMatch(/prisma\.telegramChat\.upsert/)
  })

  it('records the person before answering them', () => {
    /*
      Awaited, not fired and forgotten: this runs in a serverless function and
      work still in flight when the response returns may simply never happen.
    */
    const handler = bot.slice(bot.indexOf('export async function handleMessage'))

    /*
      The FIRST statement in the try, unconditionally. Matching `await
      recordChat(` anywhere was satisfied by `if (false) await recordChat(` --
      a guard that only proves the characters are present proves nothing.
    */
    const body = handler.slice(handler.indexOf('try {') + 'try {'.length)
    expect(body.trimStart().startsWith('await recordChat({')).toBe(true)
    expect(handler.indexOf('await recordChat(')).toBeLessThan(handler.indexOf('await reply('))
  })

  it('never lets a failed statistic cost somebody their reply', () => {
    expect(stats).toMatch(/catch \(error\)[\s\S]*?console\.error\('\[telegram\] chat record failed'/)
  })

  it('clears a stale block when someone writes in', () => {
    // Messaging us is proof of not blocking us, and a stale flag would keep
    // them out of the active count forever.
    expect(stats).toMatch(/blocked: false,\s*\n\s*blockedAt: null,/)
  })
})

describe('knowing who left', () => {
  it('subscribes to the update that announces it', () => {
    /*
      Without `my_chat_member` the only sign of a block is a failed send, which
      may not come for weeks -- so the blocked count would drift quietly away
      from the truth.
    */
    const line = setup.split('\n').find((l) => l.includes('allowed_updates:')) ?? ''
    expect(line).toContain("'my_chat_member'")
  })

  it('handles it', () => {
    expect(webhook).toMatch(/update\?\.my_chat_member/)
    expect(webhook).toMatch(/status === 'kicked'/)
    expect(webhook).toMatch(/setBlocked\(/)
  })
})

describe('the report itself', () => {
  it('leads with the counts, including the one that matters', () => {
    /*
      Anchored on the numbers, not the labels: the wording is Uzbek and will be
      reworded again, but every one of these figures has to be on screen. Started
      vs signed in is the whole point -- a raw user count answers nothing.
    */
    expect(stats).toMatch(/Botni ochganlar: <b>\$\{total\}/)
    expect(stats).toMatch(/<b>\$\{linked\}<\/b> \(\$\{conversion\}%\)/)
    expect(stats).toMatch(/Bugun faol: <b>\$\{active1\}/)
    expect(stats).toMatch(/Shu hafta faol: <b>\$\{active7\}/)
    expect(stats).toMatch(/bloklaganlar: <b>\$\{blocked\}/)
  })

  it('does not divide by zero on an empty bot', () => {
    expect(stats).toMatch(/total > 0 \? Math\.round\(\(linked \/ total\) \* 100\) : 0/)
  })

  it('caps the list so the message can actually send', () => {
    // Telegram rejects anything past 4096 characters, and a wall of 300 rows is
    // not a report anyway.
    expect(stats).toMatch(/LIST_LIMIT = \d+/)
    expect(stats).toMatch(/take: LIST_LIMIT/)
  })

  it('escapes names', () => {
    // They come from Telegram profiles, they can contain anything, and the
    // message is sent as HTML.
    expect(stats).toMatch(/const name = escapeHtml\(full \|\| r\.username \|\| r\.telegramId\)/)
    expect(stats).toMatch(/escapeHtml\(r\.username\)/)
    // A blank Telegram name must still print something identifiable.
    expect(stats).toMatch(/full \|\| r\.username \|\| r\.telegramId/)
  })
})
