import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'

/**
 * The focus timer, after a rewrite that fixed four things at once.
 *
 * The ring was a hard-coded `w-80 h-80` (320px) with SVG geometry in absolute
 * pixels. On a 360px phone, plus page padding, the timer — the entire point of
 * the page — was clipped. Everything is in viewBox units now and scales.
 *
 * The mode label fell through to `{mode}`, rendering the raw identifier "focus"
 * on an Uzbek dashboard. And the completion badge appended an English "s" to a
 * translated noun, which is not how Uzbek pluralises anything.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (src: string) =>
  src.replace(/\{?\/\*[^]*?\*\/\}?/g, '').replace(/^\s*\/\/.*$/gm, '')

const timer = strip(read('src/components/focus/FocusTimer.tsx'))
const page = strip(read('src/app/(dashboard)/focus/page.tsx'))

describe('focus timer', () => {
  it('scales the ring instead of pinning it to 320px', () => {
    expect(
      /w-80 h-80/.test(timer),
      '320px plus page padding overflows a 360px screen'
    ).toBe(false)
    expect(timer, 'the ring must be defined in viewBox units').toMatch(/viewBox=/)
    // Geometry derived from constants, not typed in twice.
    expect(timer).toMatch(/const RADIUS = /)
    expect(timer).toMatch(/const CIRCUMFERENCE = 2 \* Math\.PI \* RADIUS/)
  })

  it('never divides by a zero-length session', () => {
    // A 0-minute setting would make progress NaN and paint a full ring.
    expect(timer).toMatch(/totalSeconds > 0 \?/)
  })

  it('translates the current mode rather than printing the identifier', () => {
    // `: mode` as the final branch rendered the literal string "focus".
    expect(timer).toMatch(/t\('ui\.focusMode'\)/)
    expect(
      /:\s*mode\s*\}/.test(timer),
      'falling through to {mode} prints the raw English identifier'
    ).toBe(false)
  })

  it('builds duration labels from a parameterised message', () => {
    // The keys used to be `'Focus ('` — a dangling bracket baked into the
    // translation, with the number and `m)` concatenated after it in JSX. That
    // cannot be reordered by a translator.
    for (const key of [
      'ui.focusWithDuration',
      'ui.shortBreakWithDuration',
      'ui.longBreakWithDuration',
    ]) {
      const value = (en as Record<string, string>)[key]
      expect(value, `${key} missing`).toBeTruthy()
      expect(value, `${key} must take the number as a parameter`).toContain('{minutes}')
      expect((uz as Record<string, string>)[key], `${key} needs Uzbek`).toBeTruthy()
    }
    expect(timer).toMatch(/ui\.focusWithDuration', \{ minutes:/)
  })

  it('does not bolt an English plural onto a translated noun', () => {
    // `{completedSessions > 1 ? 's' : ''}` — too short for the JSX-string guard
    // to flag, and wrong in every language that does not pluralise with -s.
    expect(
      /\? 's' : ''/.test(page),
      "an appended 's' is not translation"
    ).toBe(false)
    expect(page).toMatch(/ui\.sessionsToday/)
  })

  it('keeps the completion badge clear of the mobile bottom nav', () => {
    // `fixed bottom-8 right-8` put it underneath the nav bar on a phone.
    expect(page).toMatch(/bottom-24/)
    expect(page).toMatch(/sm:bottom-8/)
  })

  it('gives every icon-only control an accessible name', () => {
    // Reset and mute are glyphs with no text beside them.
    const iconButtons = timer.match(/aria-label=\{/g) ?? []
    expect(iconButtons.length).toBeGreaterThanOrEqual(2)
    expect(timer, 'mute is a toggle, so its state must be exposed').toMatch(/aria-pressed=\{isMuted\}/)
  })

  it('states the mode switch as a tablist', () => {
    expect(timer).toMatch(/role="tablist"/)
    expect(timer).toMatch(/aria-selected=\{active\}/)
    // Switching mid-session discards it, so the control is disabled rather
    // than quietly destructive.
    expect(timer).toMatch(/disabled=\{isActive\}/)
  })

  it('uses the page accent rather than three private palettes', () => {
    // purple / emerald / blue were hard-coded across a dozen class strings,
    // none of them the page's own colour.
    expect(timer).toMatch(/rgb\(var\(--acc-2\)\)/)
    expect(
      /from-purple-500|to-indigo-500/.test(timer),
      'the private purple palette should be gone'
    ).toBe(false)
  })

  it('honours reduced motion on the sweeping ring', () => {
    expect(timer).toMatch(/useReducedMotion/)
    expect(timer).toMatch(/reduceMotion \? 0 :/)
  })
})
