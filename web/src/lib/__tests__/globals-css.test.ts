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
  /**
   * The bug this catches, in full, because it came back three times wearing
   * different clothes ("View All Prayer Times" white, then the sign-up code
   * field, then "Sign Up" in the marketing header):
   *
   *   button { background: rgba(255, 255, 255, 0.95); ... }
   *   .dark button { background: rgba(15, 23, 42, 0.95); ... }
   *
   * An element selector, sitting outside any `@layer`. Unlayered rules beat
   * layered ones in the cascade regardless of specificity, and every Tailwind
   * utility lives in `@layer utilities` — so this painted OVER `bg-*` instead
   * of sitting under it. Worse, `background` is a shorthand and reset
   * `background-image`, so gradient CTAs lost their fill entirely while their
   * `text-white` label stayed white. And because `.dark button` supplied a dark
   * fill, it could only ever be wrong in light mode.
   */
  it('never paints bare elements from outside a cascade layer', () => {
    // Strip comments, then remove every @layer block by brace matching, leaving
    // only the unlayered rules — the ones that outrank utilities.
    const noComments = css.replace(/\/\*[^]*?\*\//g, '')
    let unlayered = ''
    for (let i = 0; i < noComments.length; i++) {
      if (noComments.startsWith('@layer', i)) {
        const open = noComments.indexOf('{', i)
        if (open === -1) break
        let depth = 1
        let j = open + 1
        for (; j < noComments.length && depth > 0; j++) {
          if (noComments[j] === '{') depth++
          else if (noComments[j] === '}') depth--
        }
        i = j - 1
        continue
      }
      unlayered += noComments[i]
    }

    // Selectors that reach a bare element: `button`, `.dark button`,
    // `input, textarea, select`, and so on. A class-only selector is fine —
    // those are opt-in.
    const ELEMENTS = ['button', 'input', 'textarea', 'select', 'a']
    const offenders: string[] = []

    for (const m of unlayered.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
      const selector = m[1].trim().replace(/\s+/g, ' ')
      const body = m[2]
      if (!/(^|[\s;])(background|background-color|background-image|color)\s*:/.test(body)) continue

      const reachesElement = selector.split(',').some((part) =>
        part
          .trim()
          .split(/\s+/)
          .some((token) => ELEMENTS.includes(token))
      )
      if (reachesElement) offenders.push(`${selector} { ${body.trim().slice(0, 70)}… }`)
    }

    expect(
      offenders,
      'these paint every element of their kind and outrank all Tailwind utilities:\n' +
        offenders.join('\n')
    ).toEqual([])
  })

  it('keeps the background shorthand to deliberate glass surfaces', () => {
    // The shorthand resets background-image, so it must never land on something
    // that might carry a gradient. The frosted `.glass*` / `.card` surfaces use
    // it on purpose — they are opt-in and flat by design — so they are listed
    // rather than pretended away. Anything NEW gets caught.
    const ALLOWED = /^\.(dark\s+)?\.?(glass|glass-card|glass-effect|glass-panel|card|enhanced-card)$/
    const noComments = css.replace(/\/\*[^]*?\*\//g, '')
    const offenders: string[] = []

    for (const m of noComments.matchAll(/([^{}@]+)\{([^{}]*)\}/g)) {
      const body = m[2]
      if (!/background:\s*(rgba?\([^)]*\)|#[0-9a-f]{3,8})\s*;/i.test(body)) continue
      const selector = m[1].trim().replace(/\s+/g, ' ')
      const parts = selector.split(',').map((p) => p.trim())
      if (parts.every((p) => ALLOWED.test(p))) continue
      offenders.push(selector)
    }

    expect(
      offenders,
      'use background-color — the shorthand wipes background-image:\n' + offenders.join('\n')
    ).toEqual([])
  })
})
