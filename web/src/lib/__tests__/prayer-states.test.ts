import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'

/**
 * The prayers page could not say the most useful thing about a prayer.
 *
 * It tracked "completed" and "is next" and nothing else, so a prayer whose time
 * had passed unprayed rendered exactly like one three hours away: same white
 * card, same emerald. Four states now — done, current, missed, upcoming — each
 * with its own colour AND its own word, because colour alone excludes anyone who
 * cannot distinguish it.
 *
 * The page also hard-coded the five prayer names in English. They are not the
 * same in Uzbek (Bomdod, Peshin, Shom, Xufton), and a one-word object property
 * trips neither the JSX-text guard nor the copy-in-data guard — the latter
 * requires a space.
 */

const raw = readFileSync(
  join(process.cwd(), 'src/app/(dashboard)/prayers/page.tsx'),
  'utf8'
)
const page = raw.replace(/\{?\/\*[^]*?\*\/\}?/g, '').replace(/^\s*\/\/.*$/gm, '')

/**
 * The body of `prayerStateOf`. Anchored FORWARD from the declaration — searching
 * for a closing token from position 0 finds a component early-return hundreds of
 * lines above, and the slice comes back empty, which made three of these
 * assertions pass against ''.
 */
function stateFn(): string {
  const start = page.indexOf('const prayerStateOf')
  expect(start, 'prayerStateOf not found').toBeGreaterThan(-1)
  const end = page.indexOf('\n  }', start)
  const body = page.slice(start, end)
  expect(body.length, 'sliced an empty body').toBeGreaterThan(100)
  return body
}

describe('prayer states', () => {
  it('distinguishes missed, current, upcoming and done', () => {
    expect(page).toMatch(/type PrayerState = 'done' \| 'current' \| 'missed' \| 'upcoming'/)
    expect(page).toMatch(/const prayerStateOf = /)
    for (const flag of ['isMissed', 'isCurrent', 'isCompleted']) {
      expect(page, `${flag} must reach the card`).toContain(flag)
    }
  })

  it('treats a prayer as current only inside its own window', () => {
    // Between its adhan and the next one. Comparing against the prayer's start
    // alone would leave every past prayer "current" for the rest of the day.
    const fn = stateFn()
    expect(fn).toMatch(/PRAYER_SEQUENCE\.indexOf\(name\)/)
    expect(fn).toMatch(/minutesNow < end \? 'current' : 'missed'/)
  })

  it('does not call Isha missed at midnight', () => {
    // Isha has no following prayer to close its window, so with no `end` it
    // stays current rather than being marked missed at 23:59.
    const fn = stateFn()
    expect(fn).toMatch(/if \(end === null\) return 'current'/)
  })

  it('never accuses someone because a fetch failed', () => {
    // No time means nothing to compare. Defaulting to "missed" would mark every
    // prayer as skipped whenever the prayer-times request fell over.
    const fn = stateFn()
    expect(fn).toMatch(/if \(start === null\) return 'upcoming'/)
  })

  it('names each state in words, not only in colour', () => {
    for (const key of ['ui.prayed', 'ui.prayNow', 'ui.missed', 'ui.upcoming']) {
      expect((en as Record<string, string>)[key], `${key} missing`).toBeTruthy()
      expect((uz as Record<string, string>)[key], `${key} needs Uzbek`).toBeTruthy()
    }
    expect(page).toMatch(/t\('ui\.prayed'\)/)
    expect(page).toMatch(/t\('ui\.missed'\)/)
  })

  it('translates the five prayer names', () => {
    // Bomdod / Peshin / Asr / Shom / Xufton.
    expect(page).toMatch(/displayName: t\('prayer\.fajr'\)/)
    expect(page).toMatch(/displayName: t\('prayer\.maghrib'\)/)
    expect(
      /displayName: 'Fajr'/.test(page),
      'the English names were hard-coded'
    ).toBe(false)
    for (const p of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      expect((uz as Record<string, string>)[`prayer.${p}`], `prayer.${p} needs Uzbek`).toBeTruthy()
    }
  })

  it('matches "up next" on the canonical key, not the label', () => {
    // `nextPrayer.name` is English from prayer-times.ts. Comparing it to a
    // translated `displayName` is "bomdod" === "fajr" — never true, so the
    // highlight would vanish in Uzbek only.
    expect(page).toMatch(/nextPrayer\?\.name\.toLowerCase\(\) === prayer\.name/)
    expect(
      /nextPrayer\?\.name\.toLowerCase\(\) === prayer\.displayName/.test(page),
      'comparing against a translated label breaks in every non-English locale'
    ).toBe(false)
  })

  it('stops the card grid twitching under the cursor', () => {
    // `hover:scale-105` on five cards moved the whole page, and never fired on
    // touch anyway.
    const grid = page.slice(page.indexOf('prayers.map'), page.indexOf('prayers.map') + 3000)
    expect(grid).not.toMatch(/hover:scale-105/)
  })
})
