import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LOCALES } from '@/lib/i18n/locales'

/**
 * The header language control is a toggle, not a menu.
 *
 * With two languages, a menu asks you to choose between the language you are
 * already reading and the other one — a dialog to dismiss in exchange for
 * nothing. One tap swaps it.
 *
 * The branch matters: a toggle cannot express a choice between three or more,
 * and silently cycling through languages one tap at a time would be worse than
 * the menu it replaced. So the component keeps the menu for that case and picks
 * automatically, rather than depending on somebody remembering to change it when
 * Russian or Turkish lands.
 */

const raw = readFileSync(
  join(process.cwd(), 'src/components/shared/LocaleSwitcher.tsx'),
  'utf8'
)
const src = raw.replace(/\{?\/\*[^]*?\*\/\}?/g, '').replace(/^\s*\/\/.*$/gm, '')

/**
 * Just the two-language branch. The inline (marketing) variant uses several of
 * the same strings, so a file-wide search finds them there and reports success
 * for a toggle that is doing something else entirely.
 */
const toggleBranch = (() => {
  /*
    Sliced from the RAW source, between two structural landmarks, then stripped.
    The first version ended the slice at `aria-haspopup="menu"` — the very thing
    these assertions check is absent — so moving that attribute INTO the toggle
    simply moved the end of the slice and the test still passed. Never anchor a
    boundary on the string you are testing for.
  */
  const start = raw.indexOf('if (LOCALES.length === 2)')
  const end = raw.indexOf('// --- Three or more', start)
  expect(start, 'two-language branch not found').toBeGreaterThan(-1)
  expect(end, 'fallback marker not found').toBeGreaterThan(start)

  const body = raw.slice(start, end).replace(/\{?\/\*[^]*?\*\/\}?/g, '').replace(/^\s*\/\/.*$/gm, '')
  expect(body.length, 'sliced an empty branch').toBeGreaterThan(200)
  return body
})()

describe('language toggle', () => {
  it('switches on tap when there are exactly two languages', () => {
    expect(src).toMatch(/if \(LOCALES\.length === 2\)/)
    // The destination is derived, never hard-coded to 'uz' — that would make
    // the button a no-op for anyone already reading Uzbek.
    expect(src).toMatch(/LOCALES\.find\(code => code !== locale\)/)
    expect(toggleBranch).toMatch(/onClick=\{\(\) => setLocale\(next\)\}/)
  })

  it('is a plain button in that path, with no menu to dismiss', () => {
    // This slice used to be recomputed here against a `// --- Three or more`
    // marker that the comment-stripping above removes, so it silently fell
    // through to a different end anchor. One shared branch instead.
    expect(toggleBranch, 'no popup semantics').not.toMatch(/aria-haspopup/)
    expect(toggleBranch, 'nothing to expand').not.toMatch(/aria-expanded/)
    expect(toggleBranch, 'no backdrop to tap away').not.toMatch(/fixed inset-0/)
  })

  it('still falls back to a menu for three or more', () => {
    // Guards the roadmap: Russian, Turkish and Arabic are all planned.
    expect(src).toMatch(/aria-haspopup="menu"/)
    expect(src).toMatch(/role="menuitem"/)
  })

  it('names the destination, not the current language', () => {
    // A screen reader announcing the language you are already reading tells you
    // nothing about what the button does.
    expect(toggleBranch).toMatch(/aria-label=\{t\('locale\.switchTo', \{ language: LOCALE_LABELS\[next\]/)
    expect(
      /aria-label=\{t\('locale\.current'/.test(toggleBranch),
      'announcing the current language says nothing about what the button does'
    ).toBe(false)
  })

  it('keeps the header control at 44px like its neighbours', () => {
    expect(src).toMatch(/min-h-\[44px\] min-w-\[44px\]/)
    expect(src).toMatch(/rounded-2xl/)
  })

  it('shows which language is active without opening anything', () => {
    // The code sits on the face of the tile.
    expect(src).toMatch(/\{locale\}/)
  })

  it('honours reduced motion on the badge swap', () => {
    expect(src).toMatch(/reduceMotion \? false :/)
    expect(src).toMatch(/duration: reduceMotion \? 0 :/)
  })

  it('matches the number of languages actually shipped', () => {
    // If this fails, the component has switched branches — worth a look rather
    // than a surprise.
    expect(LOCALES.length).toBe(2)
  })
})
