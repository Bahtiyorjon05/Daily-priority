import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Two things that were broken specifically on a phone, and only on a phone —
 * which is why they survived every desktop pass.
 *
 * 1. Card edit/delete used `opacity-0 group-hover:opacity-100`. Tailwind
 *    compiles `group-hover:` inside `@media (hover: hover)`, so on a touch
 *    screen the reveal never fires while the bare `opacity-0` always does. The
 *    buttons were laid out, focusable and permanently invisible. Editing a
 *    habit, goal or journal entry was simply impossible on a phone.
 *
 * 2. The phase picker's dismiss backdrop is `sm:hidden`, and nothing else closed
 *    it — so it stayed open while you clicked around. The profile menu had the
 *    mirror-image bug: it tested `!target.closest('[data-dropdown]')`, which
 *    counts every dropdown as "inside", so pressing a sibling menu left both
 *    open at once.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

function walkTsx(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) {
      if (entry !== '__tests__' && entry !== 'node_modules') walkTsx(p, out)
    } else if (p.endsWith('.tsx')) {
      out.push(p)
    }
  }
  return out
}

/** Assertions must read code, not prose. */
const stripComments = (src: string) =>
  src.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const CARD_PAGES = [
  'src/app/(dashboard)/journal/page.tsx',
  'src/app/(dashboard)/goals/page.tsx',
  'src/app/(dashboard)/habits/page.tsx',
  // The dashboard gated its reveal on `sm:` instead, which loses the buttons on
  // a wide touchscreen. TaskItem and OptimizedTaskCard still had the plain
  // hover-only form — the latter is currently unused, but a broken pattern left
  // in place is a trap for whoever revives it.
  'src/app/(dashboard)/dashboard/page.tsx',
  'src/app/(dashboard)/dashboard/components/TaskItem.tsx',
  'src/app/(dashboard)/dashboard/components/OptimizedTaskCard.tsx',
]

describe('row actions are reachable without a hover', () => {
  it('never hides an action row unconditionally', () => {
    // The exact broken shape: a bare `opacity-0` paired with a hover reveal.
    for (const page of CARD_PAGES) {
      const src = read(page)
      // Also catches the `sm:opacity-0 sm:group-hover:` variant, which merely
      // moves the problem to touch laptops.
      expect(
        /(^|[\s"'`])(sm:|md:|lg:)?opacity-0[^"'`]*group-hover:opacity-100/.test(src),
        `${page}: opacity-0 + group-hover is invisible on touch`
      ).toBe(false)
    }
  })

  it('uses the shared reveal on every card that has actions', () => {
    for (const page of CARD_PAGES) {
      expect(read(page), `${page} must use ROW_ACTIONS`).toContain('ROW_ACTIONS')
    }
  })

  it('gates the hiding on the pointer, not a breakpoint', () => {
    // A Windows touchscreen is wide and still cannot hover, so a `md:` prefix
    // would leave those users with invisible controls.
    const helper = read('src/components/shared/rowActions.ts')
    expect(helper).toContain('[@media(hover:hover)]:opacity-0')
    expect(helper, 'must be visible by default').toContain('opacity-100')
    expect(helper, 'keyboard focus must reveal it too').toContain(
      'focus-within:opacity-100'
    )
    // A breakpoint variant here would mean the fix misses touch laptops.
    expect(helper).not.toMatch(/\b(sm|md|lg):opacity-0/)
  })

  it('offers edit as well as delete on the journal card', () => {
    // The card had delete but no edit — editing was only reachable by opening
    // the entry first, so the destructive action was the easy one.
    const journal = read(CARD_PAGES[0])
    const header = journal.slice(0, journal.indexOf('</CardHeader>'))
    expect(header).toMatch(/startEdit\(entry\)/)
    expect(header).toMatch(/<Pencil/)
    expect(header).toMatch(/<Trash2/)
  })

  it('keeps icon buttons at a tappable size on phones', () => {
    const button = read('src/components/ui/button.tsx')
    const icon = button.split('\n').find((l) => l.trim().startsWith('icon:')) ?? ''
    // 40px is below the 44px minimum, and these are now always visible on
    // touch. Both axes, or the button stretches into a rectangle.
    expect(icon).toMatch(/max-sm:h-11/)
    expect(icon).toMatch(/max-sm:w-11/)
  })

  it('does not force padding onto every button on mobile', () => {
    // `button { padding: 12px 16px }` inside a max-width query, unlayered, beat
    // every Tailwind padding utility on phones and turned square icon buttons
    // into wide rectangles.
    const css = read('src/app/globals.css').replace(/\/\*[^]*?\*\//g, '')
    const mobileButtonRules = [...css.matchAll(/button\s*\{([^}]*)\}/g)].map((m) => m[1])
    for (const body of mobileButtonRules) {
      expect(body, 'no blanket padding on bare button').not.toMatch(/(^|[\s;])padding\s*:/)
    }
  })
})

describe('popovers close when something else is pressed', () => {
  it('dismisses the phase picker from outside, at every width', () => {
    const phase = read('src/components/shared/PhaseIndicator.tsx')
    // The call, not the bare name — `import { useDismissable }` satisfied that
    // even with the call deleted.
    expect(phase, 'needs outside-press dismissal').toMatch(
      /useDismissable<HTMLDivElement>\(open,/
    )
    // The ref must wrap the trigger too. On only the panel, pressing the trigger
    // reads as "outside": the hook closes, the button toggles, and it looks stuck.
    expect(phase).toMatch(/<div ref=\{shell\}/)
  })

  it('scopes the profile menu to its own container', () => {
    // Comments stripped: the first version of this test was satisfied — and
    // then broken — by a comment quoting the old code, not by the code itself.
    const layout = stripComments(read('src/app/(dashboard)/layout.tsx'))
    expect(
      layout.includes("closest('[data-dropdown]')"),
      'closest([data-dropdown]) counts sibling menus as inside'
    ).toBe(false)
    expect(layout).toMatch(/profileMenuRef\.current/)
  })

  it('listens for pointerdown so touch behaves like mouse', () => {
    // `mousedown` alone does fire for taps via emulation, but not for pen, and
    // it runs after focus in some browsers. One listener for all three.
    for (const [file, path] of [
      ['hook', 'src/hooks/useDismissable.ts'],
      ['layout', 'src/app/(dashboard)/layout.tsx'],
    ] as const) {
      expect(read(path), `${file} must use pointerdown`).toMatch(
        /addEventListener\('pointerdown'/
      )
    }
  })

  it('closes on Escape as well', () => {
    expect(read('src/hooks/useDismissable.ts')).toMatch(/e\.key === 'Escape'/)
  })

  it('does not resubscribe on every render', () => {
    // An inline `() => setOpen(false)` changes identity each render; without a
    // ref the effect tears down and rebuilds its listeners constantly.
    const hook = read('src/hooks/useDismissable.ts')
    expect(hook).toMatch(/onCloseRef/)
    expect(hook, 'effect must depend on open alone').toMatch(/\}, \[open\]\)/)
  })
})
describe('dialogs fit the phone screen they are on', () => {
  /**
   * `max-h-[90vh]` cut the bottom off every dialog on a phone.
   *
   * `vh` is measured against the LARGEST viewport — the one with the browser's
   * address bar hidden — so while the bar is showing, 90vh is taller than what
   * you can actually see. The panel's sticky footer then sticks to the bottom of
   * a box that runs past the screen, which is why Save and Cancel on the new
   * journal entry form could not be reached.
   */
  it('sizes modal panels against the visible viewport', () => {
    const offenders: string[] = []
    for (const file of walkTsx(join(process.cwd(), 'src'))) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/max-h-\[(\d+)vh\]/g)) {
        offenders.push(`${file.split('src')[1]}: max-h-[${m[1]}vh]`)
      }
    }
    expect(
      offenders,
      'use dvh (or the .modal-panel utility) — vh is taller than the screen on mobile:\n' +
        offenders.join('\n')
    ).toEqual([])
  })

  it('gives the modal-panel utility a vh fallback under the dvh rule', () => {
    // Order matters: the fallback has to come first so browsers that understand
    // dvh override it, and browsers that do not still get a sane height.
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
    const rule = /\.modal-panel\s*\{([^}]*)\}/.exec(css)?.[1] ?? ''
    expect(rule, '.modal-panel must exist').toBeTruthy()
    expect(rule).toMatch(/max-height:\s*90vh/)
    expect(rule).toMatch(/max-height:\s*90dvh/)
    expect(rule.indexOf('90vh')).toBeLessThan(rule.indexOf('90dvh'))
  })

  it('keeps dialog overlays clear of the notch and home indicator', () => {
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')
    expect(css).toMatch(/\.modal-overlay\s*\{[^}]*env\(safe-area-inset-bottom\)/)
  })
})
