import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The calendar's structural rules.
 *
 * The month grid shipped as `grid-cols-2 sm:grid-cols-7`, which on a phone laid
 * the month out two days per row. The columns no longer lined up under their
 * weekday labels, so the grid stopped being a calendar and became a list of
 * numbered boxes. A month grid is seven wide by definition — on a small screen
 * the cells get smaller, never fewer.
 *
 * The rest guards the mobile interaction: a ~45px cell can hold a number and a
 * few dots and nothing else, so the detail has to live somewhere, and tapping a
 * day must not fire a form.
 */

const raw = readFileSync(
  join(process.cwd(), 'src/app/(dashboard)/calendar/page.tsx'),
  'utf8'
)

/** Comments quote the old markup; assertions must not read them. */
const page = raw.replace(/\{?\/\*[^]*?\*\/\}?/g, '').replace(/^\s*\/\/.*$/gm, '')

describe('calendar layout', () => {
  it('lays the month out seven columns wide at every width', () => {
    // Any responsive prefix on the column count is the bug: it means some
    // breakpoint gets a grid that is not a calendar.
    expect(
      /(sm|md|lg):grid-cols-7/.test(page),
      'the 7-column rule must not be behind a breakpoint'
    ).toBe(false)
    expect(
      /grid-cols-[1-6]\s+(sm|md|lg):grid-cols-7/.test(page),
      'a narrow-screen fallback column count breaks the weekday alignment'
    ).toBe(false)

    // Two of them: the weekday header row and the day grid. They must agree, or
    // the labels stop describing the columns beneath them.
    const sevens = page.match(/grid-cols-7/g) ?? []
    expect(sevens.length, 'weekday header and day grid both need 7 columns')
      .toBeGreaterThanOrEqual(2)
  })

  it('renders a weekday label for all seven days', () => {
    expect(page).toMatch(/weekDays\.map/)
    const decl = /const weekDays = \[([^\]]*)\]/.exec(page)?.[1] ?? ''
    expect((decl.match(/tr\(/g) ?? []).length, 'all seven labels must be translated').toBe(7)
  })

  it('selects a day rather than opening the form on every tap', () => {
    // `onClick={() => openCreateModal(...)}` on the cell made the grid unusable
    // for reading: every touch became a dialog to dismiss.
    const start = page.indexOf('calendarDays.map')
    const cell = page.slice(start, page.indexOf('</CardContent>', start))
    expect(cell).toMatch(/onClick=\{\(\) => selectDay\(/)
    expect(
      /onClick=\{\(\) => openCreateModal\(new Date\(dayObj/.test(cell),
      'tapping a day must not open the create form'
    ).toBe(false)
  })

  it('lets a selected day be deselected', () => {
    // Otherwise the panel can be opened and never closed without picking
    // another day.
    const fn = page.slice(page.indexOf('const selectDay'), page.indexOf('const openCreateModal'))
    expect(fn).toMatch(/toDateString\(\) === date\.toDateString\(\)/)
    expect(fn).toMatch(/\? null :/)
  })

  it('shows the selected day’s events outside the cell', () => {
    // The phone cell has no room for them, so they need somewhere to go.
    expect(page).toMatch(/eventsOnSelectedDay/)
    expect(page).toMatch(/selectedDate && \(/)
  })

  it('uses the calendar accent rather than a private palette', () => {
    expect(page).toMatch(/data-accent="calendar"/)
    expect(page).toMatch(/accent="calendar"/)
    // The old page invented indigo/purple/pink on top of everything else.
    expect(
      /from-indigo-500 via-purple-500 to-pink-500/.test(page),
      'the private gradient should be gone'
    ).toBe(false)
  })

  it('has no gradient-clipped headings', () => {
    // DESIGN.md: invisible under Windows High Contrast, and a solid block in
    // some webviews.
    expect(page).not.toMatch(/bg-clip-text/)
  })

  it('keeps month navigation tappable', () => {
    // The arrows were `size="icon"` at 40px and sat in a row that overflowed.
    const nav = page.slice(page.indexOf('goToPreviousMonth'), page.indexOf('weekDays.map'))
    expect(nav).toMatch(/h-11 w-11/)
  })
  it('picks its behaviour from the layout, not the input device', () => {
    /*
     * This was keyed on `(hover: hover) and (pointer: fine)` and phones took the
     * desktop path — plenty of Android browsers and WebViews report a fine,
     * hovering pointer. The panel never opened, so the Hijri date it exists to
     * show was unreachable on the devices that needed it most.
     *
     * What decides the behaviour is whether the day's information fits in the
     * cell, and that follows the viewport width. So the threshold is the same
     * 640px the grid itself switches at.
     */
    const fn = page.slice(page.indexOf('const selectDay'), page.indexOf('const selectedHijri'))
    expect(
      /pointer: fine/.test(fn),
      'pointer type is not a reliable proxy for screen size'
    ).toBe(false)
    expect(fn, 'threshold must match the sm breakpoint the grid uses').toMatch(
      /matchMedia\('\(min-width: 640px\)'\)/
    )
    // The media query must be what gates the branch. Asserting only that both
    // the query and the call appear cannot tell `if (roomInTheCell)` from
    // `if (true)` — the second was the mutation that slipped through.
    expect(fn).toMatch(/const roomInTheCell =[^]*?matchMedia/)
    expect(fn).toMatch(/if \(roomInTheCell\) \{\s*openCreateModal\(date\)/)
    expect(fn, 'must still select on a small screen').toMatch(/setSelectedDate/)
  })

  it('says the Hijri date is loading rather than showing nothing', () => {
    // A blank line where the Hijri date should be reads as a broken feature.
    const panel = page.slice(page.indexOf('selectedHijri ?'), page.indexOf('eventsOnSelectedDay.length === 1'))
    expect(panel).toMatch(/hijriLoading \?/)
    expect(panel).toMatch(/animate-pulse/)
  })

  it('surfaces the day’s Islamic event when there is one', () => {
    expect(page).toMatch(/selectedHijri\?\.eventKey && \(/)
  })

  it('formats the selected date in the app’s language', () => {
    // `toLocaleDateString(undefined, …)` uses the browser's locale, so an Uzbek
    // dashboard still read "Saturday".
    expect(
      /toLocaleDateString\(undefined/.test(page),
      'undefined locale falls back to the browser, not the app'
    ).toBe(false)
    expect(page).toMatch(/toLocaleDateString\(locale/)
  })

  it('shows the Hijri date for the selected day', () => {
    // It is the reason this is an Islamic calendar, and it appeared nowhere in
    // the panel.
    // The render condition, not the identifier: disabling the block left
    // `selectedHijri` in the source and the weaker assertion still passed.
    // Ternary rather than `&&` since the loading state was added.
    expect(page).toMatch(/\{selectedHijri \? \(/)
    expect(page).toMatch(/hijriMonthLabel\(selectedHijri\)/)
    // And it must be derived from the month's prefetched map, not refetched.
    expect(page).toMatch(/const selectedHijri = selectedDate/)
  })

  it('tells today apart from the selected day', () => {
    // Two states on one cell need two different signals — a fill and a ring —
    // not two shades of the same accent.
    // Anchored on code, not a comment — comments are stripped above, so
    // `indexOf` on one returns -1 and the slice comes back empty.
    const start = page.indexOf('const isSelectedDay')
    const cell = page.slice(start, page.indexOf('dayEvents.length > 0', start))
    expect(cell, 'today needs a fill').toMatch(/isCurrentDay[^]*?accent-soft/)
    expect(cell, 'selection needs a ring').toMatch(/isSelectedDay[^]*?accent-ring/)
  })
})
