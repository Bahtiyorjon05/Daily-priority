import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Contrast of white text over the `.sky` gradient, for every phase and both
 * schemes.
 *
 * The last time a phase palette shipped, all six phases failed WCAG AA and it
 * was only caught by looking at the rendered page. The sky palette is
 * deliberately luminous — Dhuhr's horizon is rgb(146 208 240), which white text
 * cannot sit on — so the `.sky-scrim` overlay is what makes it legible. That
 * makes the scrim load-bearing, and load-bearing things get a test.
 *
 * Modelled the same way the browser composites it: the linear gradient sampled
 * at the position, then the scrim's black alpha over the top.
 */

const CSS = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')

type RGB = [number, number, number]

function parseTriple(s: string): RGB {
  const [r, g, b] = s.trim().split(/\s+/).map(Number)
  return [r, g, b]
}

/** Pull `--sky-N` for a phase, honouring the `.dark[data-phase=…]` override. */
function skyStops(phase: string, dark: boolean): [RGB, RGB, RGB] {
  // `[data-phase='dawn']` is a substring of `.dark[data-phase='dawn']`, so the
  // light selector needs the lookbehind or it reads the dark block and both
  // schemes silently report the same numbers.
  const selector = dark
    ? `\\.dark\\[data-phase='${phase}'\\]`
    : `(?<!\\.dark)\\[data-phase='${phase}'\\]`
  const block = new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 'g')

  let stops: Partial<Record<string, RGB>> = {}
  let m: RegExpExecArray | null
  while ((m = block.exec(CSS)) !== null) {
    for (const key of ['--sky-1', '--sky-2', '--sky-3']) {
      const v = new RegExp(`${key}:\\s*([\\d\\s]+);`).exec(m[1])
      if (v) stops[key] = parseTriple(v[1])
    }
  }

  // Dark blocks only override; anything absent falls back to the light value.
  if (dark) {
    const light = skyStops(phase, false)
    return [stops['--sky-1'] ?? light[0], stops['--sky-2'] ?? light[1], stops['--sky-3'] ?? light[2]]
  }
  return [stops['--sky-1']!, stops['--sky-2']!, stops['--sky-3']!]
}

/** Sample the three-stop gradient (stops at 0%, 52%, 100%). */
function sampleSky(stops: [RGB, RGB, RGB], pos: number): RGB {
  const [a, b, c] = stops
  if (pos <= 0.52) {
    const t = pos / 0.52
    return [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * t) as RGB
  }
  const t = (pos - 0.52) / 0.48
  return [0, 1, 2].map(i => b[i] + (c[i] - b[i]) * t) as RGB
}

/** Composite black at `alpha` over a colour. */
function scrim(base: RGB, alpha: number): RGB {
  return base.map(v => v * (1 - alpha)) as RGB
}

function relativeLuminance([r, g, b]: RGB): number {
  const f = (v: number) => {
    const s = v / 255
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function contrastWithWhite(bg: RGB): number {
  return 1.05 / (relativeLuminance(bg) + 0.05)
}

/** The scrim's own gradient, read from the stylesheet so they can't drift. */
function scrimAlphaAt(pos: number): number {
  const block = /\.sky-scrim\.sky-scrim\s*\{([^}]*)\}/.exec(CSS)
  expect(block, '.sky-scrim rule must exist').not.toBeNull()
  const stops = [...block![1].matchAll(/rgb\(0 0 0 \/ ([\d.]+)\)\s+([\d.]+)%/g)].map(m => ({
    alpha: Number(m[1]),
    at: Number(m[2]) / 100,
  }))
  expect(stops.length, 'scrim must declare stops').toBeGreaterThanOrEqual(2)

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (pos >= a.at && pos <= b.at) {
      const t = (pos - a.at) / (b.at - a.at || 1)
      return a.alpha + (b.alpha - a.alpha) * t
    }
  }
  return stops[stops.length - 1].alpha
}

const PHASES = ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'night']

/** Any `--phase-*` triple for a phase, honouring the dark override. */
function phaseVar(name: string, phase: string, dark: boolean): RGB | null {
  const selector = dark
    ? `\\.dark\\[data-phase='${phase}'\\]`
    : `(?<!\\.dark)\\[data-phase='${phase}'\\]`
  const block = new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 'g')
  let found: RGB | null = null
  let m: RegExpExecArray | null
  while ((m = block.exec(CSS)) !== null) {
    const v = new RegExp(`${name}:\\s*([\\d\\s]+);`).exec(m[1])
    if (v) found = parseTriple(v[1])
  }
  if (!found && dark) return phaseVar(name, phase, false)
  return found
}

function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('dashboard phase palette', () => {
  it('tints the canvas enough to be visible', () => {
    // The point of the phase system is that the dashboard *looks* different at
    // Fajr and at Isha. The original tints sat 14–20 from pure white — about a
    // 6% wash, which reads as plain white, so the whole system did nothing.
    const tooFaint: string[] = []
    for (const phase of PHASES) {
      const from = phaseVar('--phase-from', phase, false)!
      const deviation = 255 - Math.min(...from)
      if (deviation < 25) tooFaint.push(`${phase} = ${deviation}/255 from white`)
    }
    expect(tooFaint).toEqual([])
  })

  it('gives every phase a distinct canvas', () => {
    // Two phases resolving to the same colour would make the shift meaningless.
    const seen = new Map<string, string>()
    const clashes: string[] = []
    for (const phase of PHASES) {
      const key = phaseVar('--phase-from', phase, false)!.join(',')
      if (seen.has(key)) clashes.push(`${phase} matches ${seen.get(key)}`)
      seen.set(key, phase)
    }
    expect(clashes).toEqual([])
  })

  it('keeps phase ink readable on its own canvas, rail and card', () => {
    const failures: string[] = []
    for (const phase of PHASES) {
      for (const dark of [false, true]) {
        const ink = phaseVar('--phase-ink-on-surface', phase, dark)
        expect(ink, `${phase}/${dark ? 'dark' : 'light'} ink must be declared`).not.toBeNull()

        const surfaces: [string, RGB][] = [
          ['canvas', phaseVar('--phase-from', phase, dark)!],
          ['rail', phaseVar('--phase-rail-from', phase, dark)!],
          ['card', dark ? [17, 24, 39] : [255, 255, 255]],
          // The header's phase button and the prayer list both put this ink on
          // a neutral gray tile, so that surface is load-bearing too.
          ['header button', dark ? [31, 41, 55] : [243, 244, 246]],
        ]
        for (const [what, bg] of surfaces) {
          const ratio = contrast(ink!, bg)
          if (ratio < 4.5) {
            failures.push(
              `${phase}/${dark ? 'dark' : 'light'} ink on ${what} = ${ratio.toFixed(2)}:1`
            )
          }
        }
      }
    }
    expect(failures).toEqual([])
  })
})

describe('sky palette contrast', () => {
  it('declares all three stops for every phase in both schemes', () => {
    for (const phase of PHASES) {
      for (const dark of [false, true]) {
        const stops = skyStops(phase, dark)
        for (const stop of stops) {
          expect(stop, `${phase} ${dark ? 'dark' : 'light'}`).toHaveLength(3)
          expect(stop.every(Number.isFinite)).toBe(true)
        }
      }
    }
  })

  it('keeps white body text at AA (4.5:1) everywhere the scrim covers', () => {
    const failures: string[] = []

    for (const phase of PHASES) {
      for (const dark of [false, true]) {
        const stops = skyStops(phase, dark)
        // Content sits in roughly the top 65% of the panel; check across it.
        for (const pos of [0, 0.2, 0.4, 0.55, 0.65]) {
          const bg = scrim(sampleSky(stops, pos), scrimAlphaAt(pos / 0.65))
          const ratio = contrastWithWhite(bg)
          if (ratio < 4.5) {
            failures.push(
              `${phase}/${dark ? 'dark' : 'light'} @${Math.round(pos * 100)}% = ${ratio.toFixed(2)}:1`
            )
          }
        }
      }
    }

    expect(failures).toEqual([])
  })

  it('keeps large display text at AA (3:1) even at the horizon', () => {
    const failures: string[] = []
    for (const phase of PHASES) {
      for (const dark of [false, true]) {
        const bg = scrim(sampleSky(skyStops(phase, dark), 1), scrimAlphaAt(1))
        const ratio = contrastWithWhite(bg)
        if (ratio < 3) failures.push(`${phase}/${dark ? 'dark' : 'light'} = ${ratio.toFixed(2)}:1`)
      }
    }
    expect(failures).toEqual([])
  })

  it('keeps white text on .phase-hero at AA (4.5:1)', () => {
    // The welcome card. It had its own `--phase-hero-from/to` pair that was
    // never migrated when the palette was rebuilt, so it stayed muddy violet
    // while everything else changed — and it was not covered here either. It
    // shares the sky now and bakes its own scrim, so both are pinned.
    const rule = /\.phase-hero\.phase-hero\s*\{([^}]*)\}/.exec(CSS)
    expect(rule, '.phase-hero rule must exist').not.toBeNull()
    expect(rule![1], '.phase-hero must paint from the sky palette').toContain('--sky-1')

    const stops = [...rule![1].matchAll(/rgb\(0 0 0 \/ ([\d.]+)\)/g)].map(m => Number(m[1]))
    expect(stops.length, '.phase-hero must bake in a text scrim').toBeGreaterThanOrEqual(2)

    const failures: string[] = []
    for (const phase of PHASES) {
      for (const dark of [false, true]) {
        const sky = skyStops(phase, dark)
        // Sample where the card's text actually sits, against the weakest scrim
        // stop so the check is the pessimistic one.
        const weakest = Math.min(...stops)
        for (const pos of [0, 0.4, 0.75]) {
          const bg = scrim(sampleSky(sky, pos), weakest)
          const ratio = contrastWithWhite(bg)
          if (ratio < 4.5) {
            failures.push(
              `${phase}/${dark ? 'dark' : 'light'} @${Math.round(pos * 100)}% = ${ratio.toFixed(2)}:1`
            )
          }
        }
      }
    }
    expect(failures).toEqual([])
  })

  it('keeps the prayer list on an opaque surface, not glass over the sky', () => {
    // History: the list was translucent over the gradient, which forced every
    // foreground colour to white and made each contrast ratio depend on which
    // part of the sky happened to sit behind it. A white tint measured 2.86:1 on
    // Asr; darkening it fixed the ratio but left the text stuck white, and the
    // "View All Prayer Times" link was unreadable in light mode as a result.
    //
    // The fix was to stop compositing text over the gradient at all. This pins
    // it: the panel must be opaque and must not reintroduce hardcoded white ink.
    const widget = readFileSync(
      join(process.cwd(), 'src/app/(dashboard)/dashboard/components/PrayerTimesWidget.tsx'),
      'utf8'
    )

    const panel = /border-t[^"]*?bg-(\S+?)\s/.exec(widget)
    expect(panel, 'the list panel background must be declared').not.toBeNull()
    expect(
      panel![1],
      'the list panel must be opaque — a /alpha suffix puts text back over the gradient'
    ).not.toMatch(/\//)

    // Everything below the hero should take theme ink, so no white-only text.
    const listSection = widget.slice(widget.indexOf('── Detail list'))
    expect(
      listSection.includes('text-white'),
      'list content must not hardcode white ink; it sits on a theme surface'
    ).toBe(false)
  })
})
