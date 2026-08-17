import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The per-page accents, measured rather than eyeballed.
 *
 * Prayers and the dashboard follow the prayer day. Journal, goals, habits and
 * focus do not — they each have a fixed identity, because tying four different
 * jobs to the time of day made the whole app read as one undifferentiated
 * surface.
 *
 * Getting a palette wrong here is invisible in review and obvious to a user, so
 * every value is checked: the ink against both page backgrounds and its own soft
 * plate, and white against the header field at the weakest point of the scrim.
 * The sky palette failed exactly this way — all six phases shipped below AA in
 * light mode and it took a screenshot to notice.
 */

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')

type RGB = [number, number, number]

const luminance = ([r, g, b]: RGB) => {
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

const contrast = (a: RGB, b: RGB) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Black scrim at `alpha` composited over a colour. */
const scrim = (c: RGB, alpha: number): RGB =>
  c.map((x) => Math.round(x * (1 - alpha))) as RGB

/** Reads `--name: r g b` from a rule, e.g. `[data-accent='goals']`. */
function token(selector: string, name: string): RGB {
  const rule = new RegExp(`${selector.replace(/[[\]']/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)
  expect(rule, `${selector} not found in globals.css`).toBeTruthy()
  const decl = new RegExp(`--${name}:\\s*([\\d]+)\\s+([\\d]+)\\s+([\\d]+)`).exec(rule![1])
  expect(decl, `${selector} is missing --${name}`).toBeTruthy()
  return [Number(decl![1]), Number(decl![2]), Number(decl![3])]
}

const ACCENTS = ['journal', 'goals', 'habits', 'focus', 'calendar', 'quran'] as const

const LIGHT_BG: RGB = [250, 251, 252] // --color-background
const DARK_BG: RGB = [18, 18, 18]
const WHITE: RGB = [255, 255, 255]

// `.sky-scrim` runs 0.56 -> 0.43. The bottom is the weakest, so that is the
// one that has to hold.
const WEAKEST_SCRIM = 0.43

describe('per-page accents', () => {
  it('defines a full palette for every accented page', () => {
    for (const accent of ACCENTS) {
      for (const name of ['acc-1', 'acc-2', 'acc-3', 'acc-glow', 'acc-ink', 'acc-soft']) {
        expect(() => token(`[data-accent='${accent}']`, name)).not.toThrow()
      }
      // Dark scheme must restate ink and soft, or the light values carry over
      // onto a near-black page.
      expect(css, `${accent} needs dark-scheme ink`).toMatch(
        new RegExp(`\\.dark \\[data-accent='${accent}'\\][^}]*--acc-ink`)
      )
    }
  })

  it('writes a dark-scheme selector that can actually match', () => {
    /*
     * The first version of this file checked that `.dark[data-accent='x']`
     * existed and passed — while the rule could never match anything. `.dark` is
     * on <html> and `data-accent` is on the page's own <div>, so the compound
     * form asks for a single element that is both. Every accented page kept its
     * light ink in dark mode and the calendar's selected day came up white on
     * black.
     *
     * `data-phase` uses the compound form legitimately, because it is set on
     * <html> alongside `.dark`. Checking for the rule's presence is not the same
     * as checking that it applies.
     */
    expect(
      /\.dark\[data-accent=/.test(css),
      'compound .dark[data-accent] cannot match — data-accent is not on <html>'
    ).toBe(false)

    for (const accent of ACCENTS) {
      expect(css, `${accent} needs a descendant dark rule`).toMatch(
        new RegExp(`\.dark \[data-accent='${accent}'\]`)
      )
    }
  })

  it('keeps accent ink readable on the page background', () => {
    for (const accent of ACCENTS) {
      const light = contrast(token(`[data-accent='${accent}']`, 'acc-ink'), LIGHT_BG)
      const dark = contrast(token(`.dark [data-accent='${accent}']`, 'acc-ink'), DARK_BG)
      expect(light, `${accent} ink on light: ${light.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
      expect(dark, `${accent} ink on dark: ${dark.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps accent ink readable on its own soft plate', () => {
    // `.accent-soft` sets both together, so they are only ever seen as a pair.
    for (const accent of ACCENTS) {
      const light = contrast(
        token(`[data-accent='${accent}']`, 'acc-ink'),
        token(`[data-accent='${accent}']`, 'acc-soft')
      )
      const dark = contrast(
        token(`.dark [data-accent='${accent}']`, 'acc-ink'),
        token(`.dark [data-accent='${accent}']`, 'acc-soft')
      )
      expect(light, `${accent} soft plate, light: ${light.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
      expect(dark, `${accent} soft plate, dark: ${dark.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps white legible on the header field, at the weakest point of the scrim', () => {
    // Raw lime and cyan are far too light for white text — 1.98:1 and 2.43:1.
    // The scrim is what makes them safe, so the scrim is part of the check.
    for (const accent of ACCENTS) {
      const stops = (['acc-1', 'acc-2', 'acc-3'] as const).map((n) =>
        token(`[data-accent='${accent}']`, n)
      )
      const worst = Math.min(...stops.map((s) => contrast(WHITE, scrim(s, WEAKEST_SCRIM))))
      expect(worst, `${accent} header worst stop: ${worst.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('gives each page a visibly different identity', () => {
    // Four palettes that all land in the same place would defeat the point.
    const firsts = ACCENTS.map((a) => token(`[data-accent='${a}']`, 'acc-1'))
    for (let i = 0; i < firsts.length; i++) {
      for (let j = i + 1; j < firsts.length; j++) {
        const distance = Math.hypot(
          firsts[i][0] - firsts[j][0],
          firsts[i][1] - firsts[j][1],
          firsts[i][2] - firsts[j][2]
        )
        expect(
          distance,
          `${ACCENTS[i]} and ${ACCENTS[j]} are too close (${distance.toFixed(0)})`
        ).toBeGreaterThan(60)
      }
    }
  })

  it('does not animate a fixed palette', () => {
    // `.sky` carries --phase-transition because the phase genuinely changes.
    // These do not, and a transition would imply they might.
    const field = /\.accent-field\.accent-field\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(field).toBeTruthy()
    expect(field).not.toMatch(/transition/)
  })

  it('paints the canvas with a background-color floor', () => {
    // The shorthand-with-undefined-var bug blanked the dashboard hero once
    // already; a colour floor means a conflicting rule can never leave a page
    // surface empty.
    const canvas = /\.accent-canvas\.accent-canvas\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(canvas).toMatch(/background-color:/)
    expect(canvas, 'use background-image, not the shorthand').not.toMatch(/background:\s/)
  })
})
