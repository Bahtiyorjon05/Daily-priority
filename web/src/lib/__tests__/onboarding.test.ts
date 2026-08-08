import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Onboarding shipped with three faults that were all invisible from the code.
 *
 *  1. Location detection resolved the city and then sat there. Nothing advanced
 *     the step, so the one screen that asks permission looked broken.
 *  2. Finishing sent people back to onboarding. The POST marks `onboardedAt`,
 *     but the JWT still carried `needsOnboarding: true` and the dashboard shell
 *     redirects on that flag — so only a hard refresh escaped.
 *  3. The page borrowed the prayer-phase palette, which meant a 5am sign-up was
 *     welcomed by a near-black screen.
 *
 * These are string checks, which is weak, but the alternative is mounting a page
 * that needs geolocation, a service worker and a NextAuth session. Each
 * assertion names the exact construct whose absence was the bug.
 */

const PAGE = 'src/app/(auth)/onboarding/page.tsx'
const src = readFileSync(join(process.cwd(), PAGE), 'utf8')

describe('onboarding flow', () => {
  it('advances past the location step once detection succeeds', () => {
    // The success handler set coords and the label and stopped.
    const handler = src.slice(
      src.indexOf('getCurrentPosition'),
      src.indexOf('const finish')
    )
    expect(handler).toMatch(/setStep\('habits'\)/)
  })

  it('refreshes the session before leaving for the dashboard', () => {
    expect(src, 'useSession must be imported').toMatch(
      /import \{[^}]*useSession[^}]*\} from 'next-auth\/react'/
    )

    const finish = src.slice(src.indexOf('const finish'), src.indexOf('const toggleHabit'))
    expect(finish, 'finish() must await update()').toMatch(/await update\(\)/)

    // Order matters: refreshing after navigating leaves the stale flag in place
    // for exactly as long as the redirect needs to fire.
    expect(finish.indexOf('await update()')).toBeLessThan(
      finish.indexOf("router.replace('/dashboard")
    )
  })

  it('does not depend on the prayer-phase palette', () => {
    // `phase-canvas`, `phase-hero`, `phase-chip`, `phase-bg-accent`, `phase-border`
    // and `phase-accent` all resolve from `data-phase`, i.e. the time of day.
    expect(src).not.toMatch(/\bphase-[a-z-]+/)
  })

  it('states its own colours rather than inheriting the theme', () => {
    // The card is a fixed dark glass panel. Theme-aware tokens resolve against
    // the page theme and would paint dark-on-dark in light mode.
    for (const token of ['text-muted-foreground', 'hover:bg-muted', 'bg-background']) {
      expect(src, `${token} is theme-aware and unsafe on this card`).not.toContain(token)
    }
  })

  it('has no untranslated user-facing labels', () => {
    // The suggested habits and the "Continue" button label were hardcoded
    // English: both are prop/data values, which is where the i18n sweep was
    // blind.
    expect(src).not.toMatch(/nextLabel="[^"]+"/)
    expect(src).not.toMatch(/nextLabel=\{'[^']+'\}/)
    expect(src).not.toMatch(/title: '(Read|Morning|Evening|Pray|Give|Sleep)/)
  })

  it('tracks habit selection by message key, not by label', () => {
    // Tracking by label emptied the selection when the locale changed, because
    // the stored strings no longer matched any rendered chip.
    const block = src.slice(src.indexOf('const SUGGESTED_HABITS'), src.indexOf('type Step'))
    expect(block).toMatch(/key: 'ui\./)
    expect(src).toMatch(/selectedKeys\.includes\(h\.key\)/)
  })
})
