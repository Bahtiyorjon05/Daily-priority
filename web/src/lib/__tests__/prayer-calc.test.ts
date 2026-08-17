import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DEFAULT_CALC } from '@/lib/prayer-times'

/**
 * Which convention prayer times are calculated with.
 *
 * Measured against Aladhan for Tashkent on 15 Aug 2026:
 *
 *   school=0 (Shafi)  Asr 16:19
 *   school=1 (Hanafi) Asr 17:21     <- 62 minutes apart
 *   method=2 (ISNA)   Fajr 04:07 · Isha 20:47
 *   method=14 (Russia) Fajr 04:00 · Isha 20:47
 *
 * So the school is the consequential one and the method is worth 7 minutes on
 * Fajr here. Both were constants: the two live screens passed Hanafi as a
 * literal, while a hook and a server route defaulted to Shafi'i — two
 * conventions inside one app, which is how you end up with two different Asr
 * times depending on the screen. Both are now per-user, resolved in one place.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) => s.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const lib = strip(read('src/lib/prayer-times.ts'))
const route = strip(read('src/app/api/prayer-times/fetch/route.ts'))
const api = strip(read('src/app/api/user/prayer-calc/route.ts'))
const page = strip(read('src/app/(dashboard)/prayers/page.tsx'))
const widget = strip(read('src/app/(dashboard)/dashboard/components/PrayerTimesWidget.tsx'))

describe('prayer calculation settings', () => {
  it('defaults to Hanafi', () => {
    expect(DEFAULT_CALC.school).toBe(1)
    // A number, not a string — it goes straight into a URL and into a DB column.
    expect(typeof DEFAULT_CALC.method).toBe('number')
  })

  it('no longer hard-codes the method server-side', () => {
    expect(route).toMatch(/method=\$\{method\}/)
    expect(route, 'ISNA was baked in for everyone').not.toMatch(/method=2&school=/)
  })

  it('validates both values instead of passing them through', () => {
    // A junk school or method returns times for a *different* convention rather
    // than failing, which is the worst possible outcome here.
    expect(route).toMatch(/searchParams\.get\('school'\) === '0' \? '0' : '1'/)
    expect(route).toMatch(/VALID_METHODS\.has\(requestedMethod\)/)
    expect(api).toMatch(/school !== 0 && school !== 1/)
    expect(api).toMatch(/!METHODS\.has\(method\)/)
  })

  it('keys the cache on the convention, not just date and place', () => {
    // Without this, switching school returns the times already on screen and the
    // toggle looks broken.
    expect(lib).toMatch(/\(data\.school \?\? DEFAULT_CALC\.school\) === want\.school/)
    expect(lib).toMatch(/\(data\.method \?\? DEFAULT_CALC\.method\) === want\.method/)
    expect(lib, 'and it must be recorded on write').toMatch(/school: calc\.school/)
    /*
      Required rather than optional on both cache functions.

      It WAS optional, and the prayers page called savePrayerTimes without it —
      so freshly fetched Shafi'i times were cached tagged as Hanafi, and
      switching back returned the wrong school's times under the right label.
      That is the "Asr never changes" bug, and an optional parameter is what
      allowed it: making it required turned a silent default into a compile
      error at the one call site that had forgotten.
    */
    expect(lib, 'the convention must be a required parameter').toContain('calc: PrayerCalc')
    expect(
      lib,
      'an optional convention lets a call site silently default to Hanafi'
    ).not.toContain('calc?: PrayerCalc')
  })

  it('resolves the convention in one place for every surface', () => {
    for (const [name, src] of [
      ['prayers page', page],
      ['dashboard widget', widget],
    ] as const) {
      expect(src, `${name} must read the user preference`).toMatch(/usePrayerCalc\(\)/)
      // `calcRef.current` on the prayers page: its loader is a
      // `useCallback(..., [])` and would otherwise fetch with a frozen calc.
      expect(src, `${name} must pass it through`).toMatch(/undefined, (calc|calcRef\.current)\)/)
      // The literals that used to be here.
      expect(
        /fetchPrayerTimes\([^)]*, 1\)|fetchPrayerTimes\([^)]*, 0\)/.test(src),
        `${name} still passes a hard-coded school`
      ).toBe(false)
    }
  })

  it('leaves no path silently on the other school', () => {
    // `use-prayer-times.ts` has no consumers today but defaulted to Shafi'i,
    // waiting to disagree with the rest of the app the moment it was revived.
    const hook = strip(read('src/hooks/use-prayer-times.ts'))
    expect(hook).toMatch(/DEFAULT_CALC/)
  })

  it('offers the toggle where the times are, not only in settings', () => {
    expect(page).toMatch(/ui\.hanafi/)
    expect(page).toMatch(/ui\.shafi/)
    // Scoped to the handler. `loadPrayerData` is called from effects elsewhere
    // in this page, so a file-wide match passed even with the refetch deleted.
    // Start before the call, or the `await` immediately preceding it falls
    // outside the slice and the assertion can never match.
    const start = page.indexOf('onClick={async () => {')
    const handler = page.slice(start, page.indexOf('aria-pressed={active}', start))
    expect(handler.length, 'sliced an empty handler').toBeGreaterThan(40)
    expect(handler).toMatch(/await savePrayerCalc\(\{ school \}\)/)
    // Saving alone leaves the previous school's times on screen.
    expect(handler, 'must refetch after switching').toMatch(/await loadPrayerData\(/)
  })

  it('does not block prayer times on loading the preference', () => {
    // Starting from null and waiting would add a round trip to the one number
    // people open the app for.
    const hook = strip(read('src/hooks/usePrayerCalc.ts'))
    expect(hook).toMatch(/useState<PrayerCalc>\(DEFAULT_CALC\)/)
    expect(hook, 'a failed read must not break the page').toMatch(/\.catch\(\(\) => \{/)
  })

  it('rolls back a rejected save', () => {
    // Showing a school the server refused would misrepresent which times are on
    // screen.
    const hook = strip(read('src/hooks/usePrayerCalc.ts'))
    expect(hook).toMatch(/setCalc\(calc\)/)
  })
})
