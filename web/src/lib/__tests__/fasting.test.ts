import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'
import { fastingOccasion, isForbiddenToFast } from '@/lib/fasting'
import type { HijriDate } from '@/lib/hijri'

/**
 * Voluntary fasting, and the performance of the Islamic data behind it.
 *
 * The fasting rules are tested as real assertions rather than pattern matches:
 * they encode which days Islam recommends and the two it forbids, and getting
 * those wrong is the kind of error a user would rightly be angry about. Only
 * widely-agreed occasions are claimed — where schools differ, the day is simply
 * not marked.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) => s.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const page = strip(read('src/app/(dashboard)/ramadan/page.tsx'))
const hijri = read('src/lib/hijri.ts')
const surahRoute = read('src/app/api/quran/surah/[n]/route.ts')
const quran = read('src/app/(dashboard)/quran/page.tsx')

const h = (day: number, monthNumber: number): HijriDate => ({
  day,
  monthNumber,
  month: 'x',
  year: 1448,
  weekday: 'x',
  formatted: 'x',
})

const MONDAY = new Date(2026, 7, 17)
const THURSDAY = new Date(2026, 7, 20)
const SATURDAY = new Date(2026, 7, 15)

describe('voluntary fasting days', () => {
  it('recommends Mondays and Thursdays', () => {
    expect(fastingOccasion(MONDAY, h(20, 5))?.key).toBe('fasting.monday')
    expect(fastingOccasion(THURSDAY, h(20, 5))?.key).toBe('fasting.thursday')
    expect(fastingOccasion(SATURDAY, h(20, 5))).toBeNull()
  })

  it('recommends the white days, 13th to 15th', () => {
    for (const d of [13, 14, 15]) {
      expect(fastingOccasion(SATURDAY, h(d, 5))?.key, `day ${d}`).toBe('fasting.whiteDays')
    }
    expect(fastingOccasion(SATURDAY, h(12, 5))).toBeNull()
    expect(fastingOccasion(SATURDAY, h(16, 5))).toBeNull()
  })

  it('knows Ashura, Tasua and Arafah', () => {
    expect(fastingOccasion(SATURDAY, h(10, 1))?.key).toBe('fasting.ashura')
    expect(fastingOccasion(SATURDAY, h(9, 1))?.key).toBe('fasting.tasua')
    expect(fastingOccasion(SATURDAY, h(9, 12))?.key).toBe('fasting.arafah')
  })

  it('refuses to recommend fasting on either Eid', () => {
    // Unanimous, and the one thing a fasting tracker must not get wrong.
    expect(fastingOccasion(SATURDAY, h(1, 10))?.kind).toBe('forbidden')
    for (const d of [10, 11, 12, 13]) {
      expect(fastingOccasion(SATURDAY, h(d, 12))?.kind, `day ${d} of Dhul Hijjah`).toBe('forbidden')
    }
    // The 14th is past Eid, and is a white day again.
    expect(fastingOccasion(SATURDAY, h(14, 12))?.kind).toBe('sunnah')
    expect(isForbiddenToFast(SATURDAY, h(1, 10))).toBe(true)
    expect(isForbiddenToFast(SATURDAY, h(20, 5))).toBe(false)
  })

  it('recommends the six days of Shawwal but not Eid itself', () => {
    expect(fastingOccasion(SATURDAY, h(3, 10))?.key).toBe('fasting.shawwalSix')
    expect(fastingOccasion(SATURDAY, h(1, 10))?.kind).toBe('forbidden')
  })

  it('says nothing about nafl during Ramadan', () => {
    // Ramadan is obligatory; the page handles that month directly.
    expect(fastingOccasion(MONDAY, h(5, 9))).toBeNull()
  })

  it('reports the most significant occasion when a day qualifies twice', () => {
    // A Monday that is also Eid is Eid — saying "Monday" would bury the fact that
    // fasting is forbidden.
    expect(fastingOccasion(MONDAY, h(1, 10))?.key).toBe('fasting.eidFitr')
    expect(fastingOccasion(MONDAY, h(10, 1))?.key).toBe('fasting.ashura')
    expect(fastingOccasion(MONDAY, h(14, 5))?.key).toBe('fasting.whiteDays')
  })

  it('still works with no Hijri date', () => {
    // The month grid only has the Hijri date for today, so other cells fall back
    // to weekday occasions rather than guessing at Ashura.
    expect(fastingOccasion(MONDAY, null)?.key).toBe('fasting.monday')
    expect(fastingOccasion(SATURDAY, null)).toBeNull()
  })

  it('has both languages for every occasion it can name', () => {
    for (const k of [
      'fasting.monday', 'fasting.thursday', 'fasting.whiteDays', 'fasting.ashura',
      'fasting.tasua', 'fasting.arafah', 'fasting.shawwalSix', 'fasting.eidFitr',
      'fasting.eidAdha',
    ]) {
      expect((en as Record<string, string>)[k], `en ${k}`).toBeTruthy()
      expect((uz as Record<string, string>)[k], `uz ${k}`).toBeTruthy()
    }
  })
})

describe('ramadan page, year round', () => {
  it('does not offer to record a fast on Eid', () => {
    expect(page).toMatch(/blocked: forbidden/)
    expect(page).toMatch(/disabled=\{busy \|\| days === null \|\| blocked\}/)
  })

  it('names the occasion outside Ramadan, and says so when there is none', () => {
    expect(page).toMatch(/ui\.ramadanNaflToday/)
    expect(page).toMatch(/ui\.ramadanNaflNone/)
  })

  it('lays the month out seven columns wide', () => {
    // Same rule as the calendar: a month grid that is not seven wide is not one.
    expect(page).toMatch(/grid-cols-7/)
    expect(
      /(sm|md|lg):grid-cols-7/.test(page),
      'the 7-column rule must not sit behind a breakpoint'
    ).toBe(false)
  })

  it('uses the shared streak definition for its longest run', () => {
    expect(page).toMatch(/streakFromDates\(fastedDates, now\)/)
  })

  it('does not guess at occasions it cannot know', () => {
    // Only today's Hijri date is fetched, so grid cells pass null. Being wrong
    // about Ashura on a calendar is worse than not marking it.
    expect(page).toMatch(/fastingOccasion\(cell\.date, null\)/)
  })
})

describe('performance of the islamic data', () => {
  it('caches Hijri conversions', () => {
    /*
     * Measured at ~850ms per call, and the Ramadan page, the calendar and the
     * dashboard each made it on every mount. The Hijri date for a given Gregorian
     * date never changes, so it is cacheable forever.
     */
    expect(hijri).toMatch(/const memoryCache = new Map/)
    expect(hijri).toMatch(/localStorage\.getItem\(HIJRI_CACHE_PREFIX/)
    expect(hijri).toMatch(/writeCache\(key, converted\)/)

    // Reads the cache BEFORE the network, or it saves nothing.
    const fn = hijri.slice(hijri.indexOf('export async function gregorianToHijri'))
    expect(fn.indexOf('readCache(key)')).toBeGreaterThan(-1)
    expect(fn.indexOf('readCache(key)')).toBeLessThan(fn.indexOf('await fetch'))
  })

  it('does not trust a malformed cache entry', () => {
    expect(hijri).toMatch(/typeof parsed\?\.monthNumber !== 'number'/)
  })

  it('kept the authoritative source rather than computing locally', () => {
    /*
     * The obvious optimisation, and wrong. A tabular Islamic conversion checked
     * against Aladhan across 16 dates came out off by up to TWO days — in an app
     * that tells someone which day of Ramadan it is, that could miss the start of
     * the month entirely. Only the round trip went away.
     */
    expect(hijri).toMatch(/api\/hijri\/convert/)
  })

  it('skips the translation edition when it is switched off', () => {
    // Measured on Al-Baqara: 387 KB with both editions, 140 KB with Arabic alone.
    expect(surahRoute).toMatch(/const wantsTranslation = /)
    expect(surahRoute).toMatch(/wantsTranslation \? `\$\{ARABIC\},\$\{translation\}` : ARABIC/)
    expect(quran).toMatch(/translation=\$\{showTranslation \? '1' : '0'\}/)
  })

  it('refetches when the translation is switched back on', () => {
    // The text is not in memory — the previous request asked for Arabic only, so
    // without this, turning it on reveals nothing.
    expect(quran).toMatch(/if \(next\) setNeedsRefetch\(true\)/)
    expect(quran).toMatch(/translation=1/)
  })

  it('caches the surah text for a year', () => {
    // The Quran does not change. Unlike prayer times, this external source should
    // leave the critical path after the first request per surah.
    expect(surahRoute).toMatch(/const REVALIDATE = 31_536_000/)
    expect(surahRoute).toMatch(/next: \{ revalidate: REVALIDATE \}/)
    expect(surahRoute).toMatch(/s-maxage=\$\{REVALIDATE\}/)
  })
})
