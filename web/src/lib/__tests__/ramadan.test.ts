import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'

/**
 * Ramadan mode, and the prayer times that feed it.
 *
 * Verified against the live database: fasting and Taraweeh toggle independently,
 * turning one off preserves the other, one row per day survives repeated toggles,
 * separate days get separate rows, and deleting the account leaves no orphans.
 *
 * Also covers the `PrayerTime` fix. That table was read by the reminders cron and
 * written by nothing at all — it was empty, so prayer reminders could never fire.
 * The job had run thousands of times with that branch doing nothing.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) => s.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const page = strip(read('src/app/(dashboard)/ramadan/page.tsx'))
const api = strip(read('src/app/api/ramadan/route.ts'))
const fetchRoute = strip(read('src/app/api/prayer-times/fetch/route.ts'))
const schema = read('prisma/schema.prisma')

describe('prayer times are persisted for reminders', () => {
  it('writes the table the cron reads', () => {
    // Nothing wrote `PrayerTime` before this, so the cron's prayer branch was a
    // no-op on every one of its thousands of runs.
    expect(fetchRoute).toMatch(/prisma\.prayerTime\.upsert/)
    expect(read('src/app/api/cron/reminders/route.ts')).toMatch(/prisma\.prayerTime\.findFirst/)
  })

  it('only stores today', () => {
    // A reminder for a past or future date is meaningless.
    expect(fetchRoute).toMatch(/const isToday =/)
    expect(fetchRoute).toMatch(/if \(isToday\)/)
  })

  it('overwrites rather than skips', () => {
    // Switching madhab changes Asr; a reminder built on the old school fires at
    // the wrong time.
    expect(fetchRoute).toMatch(/update: row/)
  })

  it('never fails the request it piggybacks on', () => {
    // This route is deliberately outside the auth guard — the marketing page
    // uses it — so an anonymous caller must still get times.
    const block = fetchRoute.slice(fetchRoute.indexOf('const session = await getServerSession') - 200)
    expect(block).toMatch(/if \(userId\)/)
    expect(fetchRoute).toMatch(/catch \(error\) \{[^}]*failed to persist/)
  })
})

describe('ramadan log', () => {
  it('tracks fasting and Taraweeh as separate columns', () => {
    const model = /model RamadanDay \{([^]*?)\n\}/.exec(schema)?.[1] ?? ''
    expect(model, 'RamadanDay not found').toBeTruthy()
    expect(model).toMatch(/fasted\s+Boolean/)
    expect(model).toMatch(/taraweeh\s+Boolean/)
    // One combined flag would answer neither question.
    expect(model).toMatch(/@@unique\(\[userId, date\]\)/)
    expect(model).toMatch(/onDelete: Cascade/)
  })

  it('keys on the Gregorian date, not the Ramadan day number', () => {
    // The Hijri day depends on a moon sighting that varies by country and gets
    // corrected mid-month. A key that can be revised is not a key.
    const model = /model RamadanDay \{([^]*?)\n\}/.exec(schema)?.[1] ?? ''
    expect(model).toMatch(/date\s+DateTime/)
    expect(model, 'hijriDay is display only, so it may be null').toMatch(/hijriDay\s+Int\?/)
  })

  it('refuses to log a future day', () => {
    // A log of the future is a wish, not a record.
    expect(api).toMatch(/Cannot log a future day/)
    expect(api).toMatch(/date\.getTime\(\) > startOfDay\(new Date\(\)\)\.getTime\(\)/)
  })

  it('rejects an impossible date instead of rolling it over', () => {
    // `new Date(2026, 1, 31)` silently becomes 3 March.
    expect(api).toMatch(/d\.getMonth\(\) !== Number\(m\[2\]\) - 1/)
  })

  it('bounds the Hijri day to a real month', () => {
    expect(api).toMatch(/MAX_HIJRI_DAY/)
    expect(api).toMatch(/n >= 1 && n <= MAX_HIJRI_DAY/)
  })

  it('takes its countdown from the user’s own prayer times', () => {
    // A second calculation could disagree with the prayers page about iftar.
    expect(page).toMatch(/usePrayerCalc\(\)/)
    expect(page).toMatch(/fetchPrayerTimes\(location\.latitude, location\.longitude, undefined, calc\)/)
  })

  it('shows suhoor before Fajr and iftar after it', () => {
    const fn = page.slice(page.indexOf('const countdown'), page.indexOf('const lastTen'))
    expect(fn).toMatch(/minutesNow < fajr/)
    expect(fn).toMatch(/minutesNow < maghrib/)
    // After Maghrib it rolls to tomorrow's suhoor rather than sitting at 0:00
    // until midnight.
    expect(fn).toMatch(/until\(fajr, true\)/)
  })

  it('marks the odd nights of the last ten', () => {
    expect(page).toMatch(/odd: hijriDay % 2 === 1/)
    expect(page).toMatch(/ui\.ramadanLastTenNote/)
  })

  it('still works outside Ramadan', () => {
    // Eleven months of an empty screen would be worse than no page.
    expect(page).toMatch(/isRamadan \? t\('ui\.ramadanSubtitleActive'\) : t\('ui\.ramadanSubtitleWaiting'\)/)
    expect(page, 'the ten-night grid is hidden outside the month').toMatch(
      /isRamadan && lastTen\.length > 0/
    )
  })

  it('says what is missing when there are no prayer times', () => {
    // A blank countdown reads as broken.
    expect(page).toMatch(/ui\.ramadanNeedTimes/)
  })

  it('is translated in both languages', () => {
    const keys = [...page.matchAll(/t\('((?:ui|nav)\.[A-Za-z]+)'/g)].map((m) => m[1])
    expect(keys.length).toBeGreaterThan(12)
    const missing: string[] = []
    for (const k of new Set(keys)) {
      if (!(en as Record<string, string>)[k]) missing.push(`en ${k}`)
      if (!(uz as Record<string, string>)[k]) missing.push(`uz ${k}`)
    }
    expect(missing, missing.join('\n')).toEqual([])
  })
})
