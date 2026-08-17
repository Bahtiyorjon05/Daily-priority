import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'
import { streakFromDates, streakAtRisk, startOfDay } from '@/lib/streaks'

/**
 * Streaks, and the week-in-review card.
 *
 * The streak logic is pure, so it is tested directly rather than through the
 * source — these are real assertions about behaviour, not pattern matches.
 *
 * There were already two streak implementations (the Qur'an route and the prayers
 * page) and this card needed a third. Three answers to "how many days in a row",
 * differing exactly at the edges people notice, is worse than one imperfect one.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) => s.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const api = strip(read('src/app/api/dashboard/review/route.ts'))
const ui = strip(read('src/components/dashboard/WeekReview.tsx'))
const dashboard = strip(read('src/app/(dashboard)/dashboard/page.tsx'))
const css = read('src/app/globals.css')

const DAY = 86_400_000
const NOW = new Date(2026, 7, 15, 14, 30) // fixed, so nothing depends on the clock
const ago = (n: number) => new Date(NOW.getTime() - n * DAY)

describe('streak logic', () => {
  it('counts consecutive days ending today', () => {
    expect(streakFromDates([ago(0), ago(1), ago(2)], NOW)).toBe(3)
  })

  it('treats yesterday as still alive', () => {
    /*
     * The important case. Someone who read Qur'an last night and opens the app at
     * 8am has not broken anything; a counter that resets at midnight tells them
     * they have, which is untrue and the fastest way to make them stop.
     */
    expect(streakFromDates([ago(1)], NOW)).toBe(1)
    expect(streakFromDates([ago(1), ago(2), ago(3)], NOW)).toBe(3)
  })

  it('ends the streak once a whole day is missed', () => {
    expect(streakFromDates([ago(2)], NOW)).toBe(0)
    expect(streakFromDates([ago(2), ago(3)], NOW)).toBe(0)
  })

  it('stops at the first gap', () => {
    expect(streakFromDates([ago(0), ago(1), ago(3), ago(4)], NOW)).toBe(2)
  })

  it('does not double-count two entries on one day', () => {
    // Two prayers logged today is one day.
    expect(streakFromDates([ago(0), ago(0), ago(0), ago(1)], NOW)).toBe(2)
  })

  it('does not care about input order', () => {
    // Callers pass rows straight from the database.
    expect(streakFromDates([ago(2), ago(0), ago(1)], NOW)).toBe(3)
  })

  it('is zero with no history', () => {
    expect(streakFromDates([], NOW)).toBe(0)
  })

  it('ignores the time of day', () => {
    // 23:59 and 00:01 on the same date are one day.
    const lateYesterday = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 1, 23, 59)
    const earlyToday = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate(), 0, 1)
    expect(streakFromDates([lateYesterday, earlyToday], NOW)).toBe(2)
  })

  it('flags a streak that has nothing today yet', () => {
    expect(streakAtRisk([ago(1), ago(2)], NOW)).toBe(true)
    // Already done today — nothing to nudge about.
    expect(streakAtRisk([ago(0), ago(1)], NOW)).toBe(false)
    // Already broken — a nudge would be about a streak that no longer exists.
    expect(streakAtRisk([ago(3)], NOW)).toBe(false)
    expect(streakAtRisk([], NOW)).toBe(false)
  })

  it('normalises to local midnight', () => {
    const d = startOfDay(new Date(2026, 7, 15, 23, 59, 59))
    expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([0, 0, 0])
    expect(d.getDate()).toBe(15)
  })
})

describe('review endpoint', () => {
  it('uses the shared streak definition', () => {
    // Not a fourth local implementation.
    expect(api).toMatch(/from '@\/lib\/streaks'/)
    expect(api).toMatch(/streakFromDates\(prayerDays, now\)/)
    expect(api).toMatch(/streakAtRisk\(/)
  })

  it('counts the week from midnight, not 168 hours ago', () => {
    // "168 hours ago" cuts a day in half and makes the numbers disagree with the
    // label.
    expect(api).toMatch(/startOfDay\(new Date\(now\.getTime\(\) - 6 \* DAY_MS\)\)/)
  })

  it('counts in the database, in one batch', () => {
    expect(api).toMatch(/await Promise\.all\(\[/)
    // No downloading rows to total them in JS.
    expect(api).toMatch(/prisma\.task\.count/)
    expect(api).toMatch(/prisma\.habitCompletion\.count/)
    expect(api).toMatch(/prisma\.focusSession\.aggregate/)
  })

  it('reports whether anything happened at all', () => {
    // So the client can offer a start instead of six zeroes.
    expect(api).toMatch(/anyActivity:/)
  })

  it('never divides by zero for the on-time rate', () => {
    expect(api).toMatch(/prayersWeek > 0 \? Math\.round/)
  })
})

describe('review card', () => {
  it('is on the dashboard, above the stat grid', () => {
    expect(dashboard).toMatch(/<WeekReview \/>/)
    /*
      Anchored on the stat grid's className, not on the `{/* Stats Grid *​/}`
      comment beside it — `strip()` removes comments, so `indexOf` on one returns
      -1 and the comparison is vacuously false. Third time this has bitten me.
    */
    const gridAt = dashboard.indexOf('grid grid-cols-2 lg:grid-cols-4')
    expect(gridAt, 'stat grid not found').toBeGreaterThan(-1)
    expect(
      dashboard.indexOf('<WeekReview />') < gridAt,
      'streaks are the reason to come back; they go first'
    ).toBe(true)
  })

  it('hides streaks that do not exist', () => {
    // A row of zeroes is not a streak display.
    expect(ui).toMatch(/\.filter\(\(s\) => s\.value > 0\)/)
  })

  it('offers a start instead of a wall of zeroes', () => {
    // The honest state of most new accounts.
    expect(ui).toMatch(/anyActivity \?/)
    expect(ui).toMatch(/ui\.reviewNothingYet/)
    expect(ui).toMatch(/ui\.reviewLogAPrayer/)
  })

  it('names the at-risk state rather than only colouring it', () => {
    // Amber alone says nothing to anyone who cannot distinguish it.
    expect(ui).toMatch(/s\.risk && \(/)
    expect(ui).toMatch(/ui\.reviewToday/)
  })

  it('fails quietly', () => {
    // Everything here is visible elsewhere; an error banner on the busiest screen
    // in the app would be noise.
    expect(ui).toMatch(/if \(failed\) return null/)
  })

  it('shows a skeleton rather than collapsing the layout', () => {
    expect(ui).toMatch(/animate-pulse/)
  })

  it('is translated in both languages', () => {
    const keys = [...ui.matchAll(/t\('((?:ui|nav)\.[A-Za-z0-9]+)'/g)].map((m) => m[1])
    expect(keys.length).toBeGreaterThan(10)
    const missing: string[] = []
    for (const k of new Set(keys)) {
      if (!(en as Record<string, string>)[k]) missing.push(`en ${k}`)
      if (!(uz as Record<string, string>)[k]) missing.push(`uz ${k}`)
    }
    expect(missing, missing.join('\n')).toEqual([])
  })
})

describe('interactive things look interactive', () => {
  it('gives enabled buttons a pointer', () => {
    /*
     * Browsers give `<button>` `cursor: default` and Tailwind's preflight does not
     * change it, so every button in the app looked like text. On pages built
     * almost entirely from buttons — the surah list, the Ramadan toggles — there
     * was no way to tell what could be pressed.
     */
    expect(css).toMatch(/button:not\(:disabled\)[^{]*\{[^}]*cursor: pointer/)
  })

  it('does not promise a pointer on something disabled', () => {
    expect(css).toMatch(/button:disabled[^{]*\{[^}]*cursor: not-allowed/)
    expect(css, 'a disabled link is not :disabled').toMatch(/\[aria-disabled='true'\]/)
  })

  it('keeps the rule inside @layer base so utilities still win', () => {
    /*
     * The blanket `button { background: … }` rules that used to sit OUTSIDE any
     * layer beat every Tailwind utility and caused the white-on-white header bug.
     * This rule must not repeat that.
     */
    const noComments = css.replace(/\/\*[^]*?\*\//g, '')
    const baseStart = noComments.indexOf('@layer base {')
    expect(baseStart).toBeGreaterThan(-1)

    // Walk to the end of the base layer and check the rule is inside it.
    let depth = 0
    let end = baseStart
    for (let i = noComments.indexOf('{', baseStart); i < noComments.length; i++) {
      if (noComments[i] === '{') depth++
      else if (noComments[i] === '}') {
        depth--
        if (depth === 0) {
          end = i
          break
        }
      }
    }
    const base = noComments.slice(baseStart, end)
    expect(base, 'the cursor rule must live in @layer base').toMatch(/cursor: pointer/)
  })
})
