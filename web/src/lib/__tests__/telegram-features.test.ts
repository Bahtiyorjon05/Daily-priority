import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CB, parseCallback, qadaMessage, ayahMessage } from '@/lib/telegram/messages'

/**
 * The things the bot can do without anyone opening the app.
 *
 * Every one of these exists because "here is a link" is not an answer. A
 * reminder you have to leave to act on is a notification; a reminder with the
 * action attached is the feature.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const bot = strip(read('src/lib/telegram/bot.ts'))
const actions = strip(read('src/lib/telegram/actions.ts'))
const cron = strip(read('src/app/api/cron/reminders/route.ts'))
const webhook = strip(read('src/app/api/telegram/webhook/route.ts'))

describe('callback payloads for the new actions', () => {
  it('round-trip', () => {
    expect(parseCallback(CB.prayer('asr'))).toEqual({ kind: 'prayer', slot: 'asr' })
    expect(parseCallback(CB.qadaMade('fajr'))).toEqual({ kind: 'qadaMade', slot: 'fajr' })
    expect(parseCallback(CB.qadaOwe('isha'))).toEqual({ kind: 'qadaOwe', slot: 'isha' })
    expect(parseCallback(CB.ayah(2, 255))).toEqual({ kind: 'ayah', surah: 2, ayah: 255 })
  })

  it('refuses a surah that does not exist', () => {
    // Callback data is client-controlled, so the bounds live here rather than
    // in whatever the payload claims.
    expect(parseCallback('a:0:1')).toBeNull()
    expect(parseCallback('a:115:1')).toBeNull()
    expect(parseCallback('a:2:0')).toBeNull()
    expect(parseCallback('a:x:y')).toBeNull()
  })

  it('stays inside the 64-byte limit', () => {
    expect(Buffer.byteLength(CB.ayah(114, 286), 'utf8')).toBeLessThanOrEqual(64)
  })
})

describe('qada, counted in the chat', () => {
  const rows = [
    { prayer: 'fajr' as const, outstanding: 3 },
    { prayer: 'dhuhr' as const, outstanding: 0 },
    { prayer: 'asr' as const, outstanding: 1 },
    { prayer: 'maghrib' as const, outstanding: 0 },
    { prayer: 'isha' as const, outstanding: 0 },
  ]

  it('shows what is outstanding, per prayer', () => {
    const { text } = qadaMessage(rows, 'uz')
    expect(text).toContain('Bomdod')
    expect(text).toMatch(/Bomdod — <b>3<\/b>/)
    expect(text).toMatch(/Jami: <b>4<\/b>/)
  })

  it('celebrates zero rather than printing it', () => {
    const clear = rows.map((r) => ({ ...r, outstanding: 0 }))
    expect(qadaMessage(clear, 'uz').text).toMatch(/Alhamdulillah/)
    expect(qadaMessage(clear, 'en').text).toMatch(/Nothing outstanding/)
  })

  it('offers making one up before adding one', () => {
    // Nobody opens this hoping to add to the debt, so that button is the small
    // one and the second one.
    const row = qadaMessage(rows, 'en').keyboard[0]
    expect(row[0].callback_data).toBe(CB.qadaMade('fajr'))
    expect(row[1].callback_data).toBe(CB.qadaOwe('fajr'))
  })

  it('never lets a debt go negative', () => {
    /*
      `madeUp` climbs rather than `owed` falling, so over-counting would show a
      negative debt -- which is not a thing, and would make the total nonsense.
    */
    expect(actions).toMatch(/Math\.max\(0, r\.owed - r\.madeUp\)/)
    expect(actions).toMatch(/if \(outstanding <= 0\) return qadaDebts\(userId\)/)
  })

  it('validates the prayer name before writing', () => {
    expect(actions).toMatch(/if \(!\(PRAYER_SLOTS as readonly string\[\]\)\.includes\(prayer\)\) return null/)
  })
})

describe('the ayah itself, in the chat', () => {
  const view = { surah: 2, ayah: 255, arabic: 'ARABIC', translation: 'TRANSLATION', surahAyahs: 286 }

  it('prints the text, not a description of it', () => {
    // "You stopped at Al-Baqara 255" plus a link is a bookmark. This is reading.
    const { text } = ayahMessage(view, 'Baqara', 'uz')
    expect(text).toContain('ARABIC')
    expect(text).toContain('TRANSLATION')
    expect(text).toContain('Baqara')
    expect(text).toContain('255/286')
  })

  it('offers the next ayah, and the previous one', () => {
    const flat = ayahMessage(view, 'Baqara', 'en').keyboard.flat()
    expect(flat.some((b) => b.callback_data === CB.ayah(2, 256))).toBe(true)
    expect(flat.some((b) => b.callback_data === CB.ayah(2, 254))).toBe(true)
  })

  it('does not offer a next ayah past the end of the surah', () => {
    const last = { ...view, ayah: 286 }
    const flat = ayahMessage(last, 'Baqara', 'en').keyboard.flat()
    expect(flat.some((b) => b.callback_data === CB.ayah(2, 287))).toBe(false)
  })

  it('moves the bookmark but does not claim a page was read', () => {
    /*
      Reading one ayah in a chat is not a page of the mushaf. Progress has
      already been wrong once by over-counting; it is not going to be wrong that
      way again.
    */
    expect(bot).toMatch(/async function savePositionFromBot/)
    expect(bot).toMatch(/quranProgress\.upsert/)
    expect(bot).not.toMatch(/savePositionFromBot[\s\S]*?quranPageRead/)
  })

  it('reads through the app’s own cached route', () => {
    // A second call to the external source could disagree with the reader's
    // screen, and would not share the year-long cache.
    expect(actions).toMatch(/\/api\/quran\/surah\/\$\{surah\}\?locale=/)
  })
})

describe('prayer reminders that arrive in the chat', () => {
  it('reach Telegram users, not only push subscribers', () => {
    /*
      The query used to be push subscribers only, which excluded every Telegram
      user -- and push reached 2 accounts out of 29.
    */
    expect(cron).toMatch(/telegramReminders: true, telegramChatId: \{ not: null \}/)
    expect(cron).toMatch(/pushSubscriptions: \{ some: \{\} \}/)
  })

  it('carry the tick that marks the prayer', () => {
    // The reminder and the action it asks about, in the same place.
    expect(cron).toMatch(/callback_data: `p:\$\{slot\}`/)
  })

  it('do not stop the run when one chat is unreachable', () => {
    expect(cron).toMatch(/\)\.catch\(\(\) => \{/)
  })

  it('still work when push is not configured', () => {
    // Refusing the whole run over missing VAPID keys took the working channel
    // down with the broken one.
    expect(cron).toMatch(/const pushReady = isPushConfigured\(\)/)
    expect(cron).toMatch(/if \(pushReady\) await sendPushToUser/)
    expect(cron).not.toMatch(/status: 503/)
  })
})

describe('inline sharing', () => {
  it('is subscribed to and handled', () => {
    expect(webhook).toMatch(/update\?\.inline_query/)
    expect(bot).toMatch(/export async function handleInline/)
  })

  it('never caches one person’s data for the next', () => {
    /*
      Results are personal. Without `is_personal` and a zero cache time Telegram
      may serve one person's prayer times to whoever types the same query next,
      which is a data leak dressed as a performance feature.
    */
    /*
      EVERY answerInlineQuery, not just one somewhere in the file. There are two
      -- the linked and unlinked branches -- and the first version of this
      assertion was satisfied by either, so a mutation that removed the flag from
      the branch carrying real prayer times walked straight through.
    */
    const calls = (bot.match(/answerInlineQuery/g) ?? []).length
    expect(calls).toBeGreaterThanOrEqual(2)
    expect((bot.match(/is_personal: true/g) ?? []).length).toBe(calls)
    expect((bot.match(/cache_time: 0/g) ?? []).length).toBe(calls)
  })

  it('shares a message without live buttons', () => {
    /*
      The buttons act on the SENDER's data. Shared into a group they would let
      anyone tick someone else's prayers, so a shared message carries text only.
    */
    const inline = bot.slice(bot.indexOf('export async function handleInline'))
    expect(inline).not.toMatch(/input_message_content:[\s\S]{0,200}reply_markup/)
  })
})
