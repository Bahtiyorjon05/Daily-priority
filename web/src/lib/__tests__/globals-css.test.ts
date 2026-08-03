import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Guards against the class of CSS bug that blanked the dashboard hero.
 *
 * `globals.css` carried `.bg-card { background: rgb(var(--card)) }` — the
 * `background` SHORTHAND, referencing a variable that was never defined. That
 * resets `background-image` to none, so any surface carrying a gradient
 * rendered blank, and its white text became invisible.
 *
 * These are cheap structural assertions on the stylesheet, not visual tests,
 * but they catch exactly what went wrong and would have caught it immediately.
 */
const css = fs.readFileSync(
  path.resolve(__dirname, '../../app/globals.css'),
  'utf8'
)

/** Custom properties actually declared in the stylesheet. */
const declared = new Set(
  [...css.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1])
)

/** Custom properties referenced via var(). */
const referenced = [...css.matchAll(/var\((--[a-z0-9-]+)/gi)].map((m) => m[1])

describe('globals.css', () => {
  it('never references a custom property it does not define', () => {
    // Injected at runtime by next/font (see app/layout.tsx), not declared in CSS.
    const runtimeProvided = new Set([
      '--font-geist-sans',
      '--font-geist-mono',
      '--font-amiri',
    ])
    // Tailwind supplies --tw-* itself; everything else must be ours.
    const missing = [...new Set(referenced)].filter(
      (v) => !declared.has(v) && !v.startsWith('--tw-') && !runtimeProvided.has(v)
    )
    expect(missing, `undefined CSS variables: ${missing.join(', ')}`).toEqual([])
  })

  it('does not use the `background` shorthand with a variable', () => {
    // The shorthand resets background-image. Use background-color instead.
    const offenders = [...css.matchAll(/^\s*background:\s*rgb\(var\([^)]*\)\)/gim)].map(
      (m) => m[0].trim()
    )
    expect(
      offenders,
      `use background-color longhand — the shorthand wipes background-image:\n${offenders.join('\n')}`
    ).toEqual([])
  })

  it('keeps every phase in step with the token set', () => {
    const phases = ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'night']
    for (const p of phases) {
      expect(css, `missing [data-phase='${p}']`).toContain(`[data-phase='${p}']`)
      expect(css, `missing swatch for ${p}`).toContain(`.swatch-${p}`)
    }
  })

  it('defines hero stops and readable ink for every phase', () => {
    const heroStops = [...css.matchAll(/--phase-hero-from:/g)].length
    const inks = [...css.matchAll(/--phase-ink-on-surface:/g)].length
    // 6 phases + :root fallback, ink additionally per colour scheme.
    expect(heroStops).toBeGreaterThanOrEqual(7)
    expect(inks).toBeGreaterThanOrEqual(7)
  })

  it('paints phase surfaces with a background-color floor', () => {
    // So a conflicting rule can never leave the surface blank again.
    for (const cls of ['phase-hero', 'phase-canvas', 'phase-rail']) {
      const rule = new RegExp(`\\.${cls}\\.${cls}\\s*\\{[^}]*background-color:`, 's')
      expect(rule.test(css), `${cls} has no background-color floor`).toBe(true)
    }
  })
})
