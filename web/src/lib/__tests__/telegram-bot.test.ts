import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CB, parseCallback, tasksMessage, habitsMessage, dailyMessage,
} from '@/lib/telegram/messages'

/**
 * What the bot can do besides open the app.
 *
 * A bot whose every answer is "here is a button to open the app" is a link, not
 * a bot. These cover the parts that change something from inside the chat, and
 * the message-shaping that decides whether the daily message is worth keeping on
 * or worth muting.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const bot = strip(read('src/lib/telegram/bot.ts'))
const actions = strip(read('src/lib/telegram/actions.ts'))
const webhook = strip(read('src/app/api/telegram/webhook/route.ts'))
const setup = strip(read('scripts/telegram-setup.ts'))
const cron = strip(read('src/app/api/cron/telegram-daily/route.ts'))
const vercel = JSON.parse(read('vercel.json'))

const task = (id: string, title: string, overdue = false) => ({ id, title, overdue })
const habit = (id: string, title: string, done = false, streak = 0) => ({ id, title, done, streak })

describe('callback payloads', () => {
  it('round-trips a task and a habit', () => {
    expect(parseCallback(CB.task('abc123'))).toEqual({ kind: 'task', id: 'abc123' })
    expect(parseCallback(CB.habit('xyz789'))).toEqual({ kind: 'habit', id: 'xyz789' })
    expect(parseCallback(CB.tasks)).toEqual({ kind: 'tasks' })
    expect(parseCallback(CB.habits)).toEqual({ kind: 'habits' })
  })

  it('rejects anything it does not recognise', () => {
    for (const bad of ['', 'nonsense', 'x:1', 't:', ':abc']) {
      expect(parseCallback(bad), bad).toBeNull()
    }
  })

  it('stays inside Telegram’s 64-byte limit', () => {
    // A cuid is 25 characters and `callback_data` is capped at 64 bytes. Going
    // over is rejected by Telegram at send time, so the whole message fails.
    const longest = CB.task('c'.repeat(30))
    expect(Buffer.byteLength(longest, 'utf8')).toBeLessThanOrEqual(64)
  })
})

describe('the task list message', () => {
  it('gives every task its own button', () => {
    const { keyboard } = tasksMessage([task('1', 'Call the plumber'), task('2', 'Pay rent')], 'en')
    // One per row: titles are user-written and long, and two to a row truncates
    // them to uselessness on a phone.
    expect(keyboard.filter((row) => row[0]?.callback_data).length).toBe(2)
    expect(keyboard.every((row) => row.length === 1)).toBe(true)
  })

  it('marks what is overdue', () => {
    const { text } = tasksMessage([task('1', 'Late thing', true), task('2', 'Normal')], 'en')
    expect(text).toContain('🔴 Late thing')
    expect(text).toContain('• Normal')
  })

  it('says something useful when there is nothing', () => {
    // An empty list is the common case and must not read as an error.
    const en = tasksMessage([], 'en')
    expect(en.text).toMatch(/Nothing open/i)
    expect(habitsMessage([], 'uz').text).toMatch(/odat/i)
  })

  it('escapes titles', () => {
    // Titles are user text and the messages are sent as HTML.
    const { text } = tasksMessage([task('1', '<b>not bold</b> & co')], 'en')
    expect(text).toContain('&lt;b&gt;not bold&lt;/b&gt; &amp; co')
    expect(text).not.toContain('<b>not bold')
  })
})

describe('the habit list message', () => {
  it('only offers a button for habits that are not done', () => {
    // A button that says "done" and does nothing when pressed is worse than no
    // button at all.
    const { keyboard } = habitsMessage([habit('1', 'Read', true), habit('2', 'Walk')], 'en')
    const actionRows = keyboard.filter((row) => row[0]?.callback_data)
    expect(actionRows).toHaveLength(1)
    expect(actionRows[0][0].callback_data).toBe(CB.habit('2'))
  })

  it('shows the tick and the streak', () => {
    const { text } = habitsMessage([habit('1', 'Read', true, 12)], 'en')
    expect(text).toContain('✅ Read')
    expect(text).toContain('🔥12')
  })

  it('says so when everything is done', () => {
    const { text } = habitsMessage([habit('1', 'Read', true)], 'en')
    expect(text).toMatch(/All done today/i)
  })
})

describe('the daily message', () => {
  const empty = { tasks: [], habits: [], prayersDone: 0, quranReadToday: true }

  it('lists only what there is', () => {
    /*
      A digest that prints four zeroes every morning is an accusation, and it is
      exactly why people mute bots. Nothing pending must read as nothing pending.
    */
    const { text } = dailyMessage(empty, 'en')
    expect(text).not.toMatch(/\b0 tasks?\b/)
    expect(text).toMatch(/Nothing pending/i)
  })

  it('counts tasks, habits and prayers when there are some', () => {
    const { text } = dailyMessage(
      {
        tasks: [task('1', 'A'), task('2', 'B', true)],
        habits: [habit('1', 'Read'), habit('2', 'Walk', true)],
        prayersDone: 3,
        quranReadToday: false,
      },
      'en'
    )
    expect(text).toMatch(/2 tasks open, 1 overdue/)
    expect(text).toMatch(/1 habit still to tick/)
    expect(text).toMatch(/3\/5 prayers/)
    expect(text).toMatch(/No Quran read yet/)
  })

  it('offers buttons only for the sections that have something', () => {
    const quiet = dailyMessage(empty, 'en')
    expect(quiet.keyboard.some((r) => r[0]?.callback_data)).toBe(false)

    const busy = dailyMessage({ ...empty, tasks: [task('1', 'A')] }, 'en')
    expect(busy.keyboard.some((r) => r[0]?.callback_data === CB.tasks)).toBe(true)
  })

  it('speaks Uzbek', () => {
    const { text } = dailyMessage({ ...empty, tasks: [task('1', 'A')] }, 'uz')
    expect(text).toContain('Assalomu alaykum')
    expect(text).toMatch(/vazifa/i)
  })

  it('greets by name when there is one', () => {
    expect(dailyMessage(empty, 'en', { name: 'Aisha' }).text).toContain('Aisha')
  })
})

describe('acting on someone’s data', () => {
  it('scopes every lookup by the user', () => {
    /*
      A callback carries a task id chosen by the client. Looking one up without
      the user id would let a guessed id complete somebody else's task, and
      Telegram ids are not secret.
    */
    expect(actions).toMatch(/where: \{ id: taskId, userId \}/)
    expect(actions).toMatch(/where: \{ id: habitId, userId \}/)
    expect(actions).toMatch(/where: \{\s*userId,/)
  })

  it('will not double-tick a habit', () => {
    // The unique index is [habitId, date] and the app writes a full timestamp,
    // so the range query is what actually prevents a second row for the day.
    expect(actions).toMatch(/date: \{ gte, lt \}/)
    expect(actions).toMatch(/if \(existing\) return \{ ok: true, title: habit\.title, already: true \}/)
  })

  it('records a habit at the start of the local day', () => {
    expect(actions).toMatch(/data: \{ habitId: habit\.id, date: gte \}/)
  })

  it('uses the reader’s own timezone for what today means', () => {
    expect(actions).toMatch(/todayKeyInTimeZone\(tz\)/)
    expect(actions).toMatch(/localDayRange\(key, tz\)/)
  })

  it('bounds what a chat message can create', () => {
    expect(actions).toMatch(/MAX_TITLE/)
    expect(actions).toMatch(/clean\.length > MAX_TITLE/)
  })
})

describe('the wiring that makes buttons work', () => {
  it('subscribes to callback updates', () => {
    /*
      Without `callback_query` in allowed_updates the buttons render, spin and do
      nothing — and nothing in the code looks wrong. This is a one-word setting
      in a script nobody re-reads.
    */
    expect(setup).toMatch(/allowed_updates: \['message', 'edited_message', 'callback_query'\]/)
  })

  it('handles them in the webhook', () => {
    expect(webhook).toMatch(/update\?\.callback_query/)
    expect(webhook).toMatch(/handleCallback/)
  })

  it('always answers the callback, including on failure', () => {
    // Telegram spins the button until answered. A stuck spinner reads as broken
    // even when the work succeeded.
    expect(bot).toMatch(/answerCallbackQuery\(cb\.id\)/)
    const failure = bot.slice(bot.lastIndexOf('catch (error)'))
    expect(failure).toMatch(/answerCallbackQuery\(cb\.id\)\.catch/)
  })

  it('rewrites the list in place instead of sending another one', () => {
    // Ticking four habits should leave one message that is now correct, not five
    // messages of history.
    expect(bot).toMatch(/editMessageText/)
    expect(bot).toMatch(/message_id: cb\.messageId/)
  })
})

describe('capture from a chat message', () => {
  it('turns plain text into a task', () => {
    expect(bot).toMatch(/if \(!command\.startsWith\('\/'\)\)/)
    expect(bot).toMatch(/return addTaskFrom\(msg, user\.id, lang, msg\.text\)/)
  })

  it('still treats a mistyped command as a command', () => {
    // Otherwise /halp silently becomes a task called "/halp".
    const branch = bot.slice(bot.indexOf('default: {'))
    expect(branch).toMatch(/command\.startsWith\('\/'\)/)
    expect(branch).toMatch(/TEXT\.unknown/)
  })
})

describe('the daily send', () => {
  it('is scheduled', () => {
    const paths = (vercel.crons ?? []).map((c: { path: string }) => c.path)
    expect(paths).toContain('/api/cron/telegram-daily')
  })

  it('is scheduled at a time the plan actually allows', () => {
    /*
      Hourly would let each person be written to in their own eight o'clock. The
      Hobby plan REFUSES any cron that fires more than once a day and rejects the
      whole deployment -- which is how this was found: a green push that never
      produced a build.

      So: once, at 03:00 UTC, which is 08:00 in UTC+5 where these users are.
    */
    const entry = (vercel.crons ?? []).find((c: { path: string }) => c.path === '/api/cron/telegram-daily')
    expect(entry.schedule).toBe('0 3 * * *')
    const daily = /^(\d+) (\d+) \* \* \*$/.test(entry.schedule)
    expect(daily, 'Hobby rejects anything more frequent than daily').toBe(true)
  })

  it('does not silently skip everyone on a daily run', () => {
    /*
      The local-hour check is right for an hourly schedule and catastrophic for a
      daily one: it would post nothing at all to anyone outside a single timezone.
      It is opt-in via ?window=1, so the daily run reaches everyone who asked.
    */
    expect(cron).toMatch(/windowed && !force && localHour\(tz\) !== SEND_HOUR/)
    expect(cron).toMatch(/searchParams\.get\('window'\) === '1'/)
  })

  it('only messages people who asked', () => {
    expect(cron).toMatch(/telegramReminders: true/)
    expect(cron).toMatch(/telegramChatId: \{ not: null \}/)
  })

  it('requires the cron secret', () => {
    expect(cron).toMatch(/CRON_SECRET/)
    expect(cron).toMatch(/status: 401/)
  })

  it('stops messaging someone who blocked the bot', () => {
    // Otherwise it retries a blocked chat every day forever.
    expect(cron).toMatch(/blocked\|chat not found\|deactivated/)
    expect(cron).toMatch(/telegramReminders: false/)
  })
})
