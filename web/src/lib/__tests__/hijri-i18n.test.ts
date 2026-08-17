import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'
import { hijriMonthKey, getIslamicMonthKeys, RAMADAN_MONTH } from '@/lib/hijri'

/**
 * The Islamic date, in the reader's language.
 *
 * Every Hijri string in this app came from one of two English sources: the
 * Aladhan API's `month.en` field, or a hardcoded English sentence in a library
 * function. So an Uzbek reader's prayers page said "5 Rabi' al-Awwal 1448" above
 * an otherwise fully Uzbek screen, the calendar grid said "Eid al-Fitr", and the
 * special-day card was an English sentence with no way to translate it.
 *
 * The fix is the same everywhere: pass the month NUMBER and the message KEY, and
 * look up the words at the render site, which is the only place that knows the
 * locale.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) =>
  s.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '').replace(/^\s*\/\/.*$/gm, '')

const hijri = read('src/lib/hijri.ts')
const monthApi = read('src/app/api/hijri/month/route.ts')
const prayerTimes = read('src/lib/prayer-times.ts')
const calendar = strip(read('src/app/(dashboard)/calendar/page.tsx'))
const prayers = strip(read('src/app/(dashboard)/prayers/page.tsx'))
const ramadan = strip(read('src/app/(dashboard)/ramadan/page.tsx'))

const message = (locale: 'en' | 'uz', key: string) =>
  (locale === 'en' ? (en as Record<string, string>) : (uz as Record<string, string>))[key]

describe('hijri month names', () => {
  it('maps all twelve months to a key that exists in both languages', () => {
    const keys = new Set<string>()
    for (let n = 1; n <= 12; n++) {
      const key = hijriMonthKey(n)
      keys.add(key)
      expect(message('en', key), `en ${key}`).toBeTruthy()
      expect(message('uz', key), `uz ${key}`).toBeTruthy()
    }
    // Twelve distinct keys — an off-by-one in the table would give two months the
    // same name and leave one unreachable.
    expect(keys.size).toBe(12)
    expect(getIslamicMonthKeys()).toHaveLength(12)
  })

  it('names the months differently in Uzbek where Uzbek differs', () => {
    /*
      Not every month changes — Muharram, Safar and Rajab are the same word. The
      ones that do are the tell that this is a real translation and not the English
      list copied across: Ramadan/Ramazon above all, since it is the one month name
      users see every day for a month.
    */
    expect(message('uz', hijriMonthKey(RAMADAN_MONTH))).toBe('Ramazon')
    expect(message('en', hijriMonthKey(RAMADAN_MONTH))).toBe('Ramadan')
    expect(message('uz', hijriMonthKey(3))).toBe('Rabiul avval')
    expect(message('uz', hijriMonthKey(12))).toBe('Zulhijja')
    expect(message('uz', hijriMonthKey(8))).toBe("Sha'bon")

    const changed = Array.from({ length: 12 }, (_, i) => i + 1).filter(
      (n) => message('uz', hijriMonthKey(n)) !== message('en', hijriMonthKey(n))
    )
    expect(changed.length, 'most month names should differ in Uzbek').toBeGreaterThanOrEqual(8)

    /*
      The keys are the ones that already existed in the dictionary, translated by
      an earlier sweep and wired to nothing. Adding a parallel `hijri.month*` set
      would have left two copies to keep in step.
    */
    expect(hijri).not.toMatch(/hijri\.month\$\{/)
    expect(hijri).toMatch(/'ui\.muharram'/)
  })

  it('never returns an out-of-range key', () => {
    // The month number arrives from an API response and from a cached payload, so
    // it can be absent or nonsense. A key that resolves to nothing would render
    // the raw key string on the page.
    for (const bad of [0, 13, -1, NaN, Infinity, 99]) {
      const key = hijriMonthKey(bad)
      expect(message('en', key), `${bad} resolved to ${key}`).toBeTruthy()
    }
  })
})

describe('special islamic days', () => {
  it('returns message keys, never English text', () => {
    /*
      This function returned `name: 'First Day of Ramadan'` and a full English
      description sentence, rendered straight onto the prayers page. A key follows
      the language switch; a string cannot.
    */
    expect(hijri).not.toMatch(/^\s*name: '/m)
    expect(hijri).not.toMatch(/^\s*description: '/m)
    expect(hijri).toMatch(/nameKey: string/)
    expect(hijri).toMatch(/descriptionKey: string/)
  })

  it('has both languages for every key it can return', () => {
    const keys = [...hijri.matchAll(/(?:nameKey|descriptionKey): '([^']+)'/g)].map((m) => m[1])
    expect(keys.length, 'expected the special-day table to be found').toBeGreaterThanOrEqual(18)
    for (const key of keys) {
      expect(message('en', key), `en ${key}`).toBeTruthy()
      expect(message('uz', key), `uz ${key}`).toBeTruthy()
    }
  })

  it('interpolates the Ramadan day rather than concatenating it', () => {
    // It used to build `'Ramadan Day ' + hijri.day`, which cannot be translated at
    // all — Uzbek puts the number first ("15-kun").
    expect(hijri).toMatch(/values: \{ day: Math\.floor\(hijri\.day\) \}/)
    expect(message('en', 'ui.ramadanDayNumber')).toContain('{day}')
    expect(message('uz', 'ui.ramadanDayNumber')).toContain('{day}')
  })

  it('renders the card through t() on the prayers page', () => {
    expect(prayers).toMatch(/t\(specialDay\.nameKey, specialDay\.values\)/)
    expect(prayers).toMatch(/t\(specialDay\.descriptionKey\)/)
    expect(prayers).not.toMatch(/specialDay\.name\b/)
    expect(prayers).not.toMatch(/specialDay\.description\b/)
  })
})

describe('calendar month grid', () => {
  it('is given the month number, not the English name', () => {
    expect(monthApi).toMatch(/monthNumber: parseInt\(hijri\.month\.number, 10\)/)
  })

  it('names holidays by key, with the emoji kept separate', () => {
    // An emoji is the same in every language; a name is not. They were one string.
    expect(monthApi).toMatch(/ISLAMIC_EVENTS: Record<string, \{ key: string; emoji: string \}>/)
    expect(monthApi).toMatch(/eventKey: event\.key, eventEmoji: event\.emoji/)

    const keys = [...monthApi.matchAll(/key: '([^']+)'/g)].map((m) => m[1])
    expect(keys.length, 'expected the holiday table').toBeGreaterThanOrEqual(10)
    for (const key of keys) {
      expect(message('en', key), `en ${key}`).toBeTruthy()
      expect(message('uz', key), `uz ${key}`).toBeTruthy()
    }
  })

  it('bumped the session cache, so a payload without the new fields is dropped', () => {
    /*
      The month map is cached in sessionStorage. A v3 payload has no `monthNumber`
      and no `eventKey`, so reusing it would make the holiday badge silently
      disappear for anyone with a warm cache — a regression caused by the fix.
    */
    expect(calendar).toMatch(/hijri-v4-\$\{year\}-\$\{month\}/)
    expect(calendar).toMatch(/!key\.includes\('hijri-v4-'\)/)
    expect(calendar).not.toMatch(/hijri-v3-/)
  })

  it('translates the month, the era and the holiday', () => {
    expect(calendar).toMatch(/hijriMonthLabel\(hijriInfo\)/)
    expect(calendar).toMatch(/hijriMonthLabel\(selectedHijri\)/)
    expect(calendar).toMatch(/tr\('ui\.ah'\)/)

    /*
      Both the visible badge and its `title` — the first version of this assertion
      only required `tr(hijriInfo.eventKey)` to appear SOMEWHERE, which the title
      satisfied on its own while the badge rendered the raw key. A bare
      `{...eventKey}` anywhere means a message key is on screen.
    */
    expect(calendar.match(/tr\(hijriInfo\.eventKey\)/g) ?? []).toHaveLength(2)
    expect(calendar).toMatch(/tr\(selectedHijri\.eventKey\)/)
    expect(calendar).not.toMatch(/\{hijriInfo\.eventKey\}/)
    expect(calendar).not.toMatch(/\{selectedHijri\.eventKey\}/)
    // "AH" was hardcoded next to the year in the grid.
    expect(calendar).not.toMatch(/\{hijriInfo\.year\} AH/)
    expect(calendar).not.toMatch(/hijriInfo\.event\b/)
  })

  it('keeps a name on screen when a stale response has no month number', () => {
    // Wrong language beats blank. The fallback is deliberate, not an oversight.
    expect(calendar).toMatch(/h\.monthNumber \? tr\(hijriMonthKey\(h\.monthNumber\)\) : h\.month/)
  })

  it('does not render the API-built formatted string', () => {
    // `formatted` is assembled server-side as "5 Safar 1448 AH" — English month
    // name and English era, with no way to translate either.
    expect(calendar).not.toMatch(/hijriDate\.formatted/)
    expect(calendar).toMatch(/tr\(hijriMonthKey\(hijriDate\.month\?\.number\)\)/)
  })
})

describe('the other pages that show a hijri date', () => {
  it('translates it on the prayers page, and says Loading in the right language', () => {
    expect(prayers).toMatch(/t\(hijriMonthKey\(hijriDate\.monthNumber\)\)/)
    expect(prayers).toMatch(/t\('ui\.loading'\)/)
    expect(prayers).not.toMatch(/: 'Loading\.\.\.'/)
  })

  it('translates it on the ramadan page', () => {
    expect(ramadan).toMatch(/t\(hijriMonthKey\(hijri\.monthNumber\)\)/)
    expect(ramadan).not.toMatch(/\{hijri\.month\}/)
  })
})

describe('detecting ramadan', () => {
  it('compares the month number instead of matching an English word', () => {
    /*
      `isRamadan()` lowercased the formatted Hijri date and looked for the
      substring "ramadan". The Uzbek name is "Ramazon", so in Uzbek it would have
      quietly answered false — a language bug in a function that has nothing to do
      with language.
    */
    expect(prayerTimes).toMatch(/hijri\?\.monthNumber === RAMADAN_MONTH/)
    expect(prayerTimes).not.toMatch(/includes\('ramadan'\)/)
  })

  it('has one definition of which month Ramadan is', () => {
    expect(RAMADAN_MONTH).toBe(9)
    expect(hijri).toMatch(/export const RAMADAN_MONTH = 9/)
    // Not redeclared on the page that cares about it most.
    expect(ramadan).not.toMatch(/const RAMADAN_MONTH = 9/)
    expect(ramadan).toMatch(/RAMADAN_MONTH/)
  })
})
