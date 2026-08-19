// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, configure, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/*
  These render a whole page component and wait on real effects, and the suite runs
  many files at once, so they are slow when the machine is saturated -- which
  showed up as failures only in the full run, never in isolation.

  BOTH limits have to move, and the test timeout has to be the larger of the two:
  raising only the testing-library wait did nothing, because vitest killed the
  test at five seconds first. A flaky test is worse than no test.
*/
vi.setConfig({ testTimeout: 30_000 })
configure({ asyncUtilTimeout: 10_000 })


/**
 * Saving a verse.
 *
 * Reported as: the bookmark icon on each verse does nothing when clicked. The
 * write was landing the whole time — a live account had `lastAyah: 40` stored
 * from exactly those taps. What it wrote to was the reading POSITION, one moving
 * pointer, so each tap replaced the last one, the icon looked identical before
 * and after, and there was nowhere to see what had been saved. A button whose
 * only effect is invisible cannot be told apart from a broken one.
 *
 * These render the real component, so they fail if the icon stops reflecting
 * state. That is the part that was missing, and the part no source-text check
 * could have seen.
 */

vi.mock('@/lib/i18n/client', () => ({
  useT: () => ({
    locale: 'en',
    setLocale: () => {},
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key} ${JSON.stringify(params)}` : key,
  }),
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: { success: (m: string) => toastSuccess(m), error: (m: string) => toastError(m) },
}))

vi.mock('@/components/shared/PhaseHeader', () => ({
  PhaseHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  HeaderStat: () => null,
}))

const AYAH = (surah: number, n: number) => `ARABIC-S${surah}-A${n}`

const makeAyahs = (surah: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    n: i + 1,
    ar: AYAH(surah, i + 1),
    tr: `translation ${i + 1}`,
    page: 1 + Math.floor(i / 15),
    juz: 1,
    // One sajda ayah in the chunk, standing in for the real ones.
    sajda: i === 2,
  }))

/** The saved-verse table on the server, so a toggle is a real round trip. */
let savedRows: { surah: number; ayah: number; page: number }[] = []
let bookmarkPosts: Record<string, number>[] = []
let progressPatches: Record<string, unknown>[] = []

beforeEach(() => {
  savedRows = []
  bookmarkPosts = []
  progressPatches = []
  toastSuccess.mockClear()
  toastError.mockClear()
  Element.prototype.scrollIntoView = function () {}
  localStorage.clear()

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const json = (body: unknown) => ({ ok: true, json: async () => body }) as unknown as Response

      if (url.includes('/api/quran/progress')) {
        if (init?.method === 'PATCH') {
          progressPatches.push(JSON.parse(String(init.body)))
          return json({ success: true, data: {}, finished: true })
        }
        return json({
          data: {
            lastSurah: 2, lastAyah: 5, lastPage: 1, pagesRead: 3, percent: 0,
            hasPosition: true, finishedSurahs: [], finishedCount: 0, streak: 0,
          },
        })
      }

      if (url.includes('/api/quran/bookmarks')) {
        if (init?.method === 'POST') {
          const body = JSON.parse(String(init.body))
          bookmarkPosts.push(body)
          const at = savedRows.findIndex((r) => r.surah === body.surah && r.ayah === body.ayah)
          if (at >= 0) {
            savedRows.splice(at, 1)
            return json({ success: true, saved: false })
          }
          savedRows.unshift({ surah: body.surah, ayah: body.ayah, page: body.page })
          return json({ success: true, saved: true })
        }
        return json({ success: true, data: savedRows })
      }

      const match = url.match(/\/api\/quran\/surah\/(\d+)/)
      if (match) return json({ ayahs: makeAyahs(Number(match[1]), 40) })
      return json({})
    })
  )
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function openSurah(name = 'Al-Baqara') {
  const { default: QuranPage } = await import('@/app/(dashboard)/quran/page')
  render(<QuranPage />)
  await waitFor(() => expect(screen.getByText(name)).toBeTruthy())
  const user = userEvent.setup()
  await user.click(screen.getByText(name))
  await waitFor(() => expect(screen.getByText(AYAH(2, 1))).toBeTruthy())
  return user
}

/** The save control, found by what it currently offers to do. */
const saveButtons = () => screen.queryAllByLabelText('ui.quranSaveVerse')
const unsaveButtons = () => screen.queryAllByLabelText('ui.quranUnsaveVerse')

describe('the save-verse button', () => {
  it('shows saved state on the verse after a tap', async () => {
    // The whole bug in one assertion. Before: tap, and every control still says
    // "save", because the icon reflected nothing at all.
    const user = await openSurah()
    expect(unsaveButtons()).toHaveLength(0)

    await user.click(saveButtons()[0])

    await waitFor(() => expect(unsaveButtons()).toHaveLength(1))
    expect(unsaveButtons()[0].getAttribute('aria-pressed')).toBe('true')
  })

  it('saves the verse, not the reading position', async () => {
    // The original defect: it wrote to /progress, moving the single bookmark and
    // telling the server a page had been read that had not.
    const user = await openSurah()
    await user.click(saveButtons()[0])

    await waitFor(() => expect(bookmarkPosts).toHaveLength(1))
    expect(bookmarkPosts[0]).toMatchObject({ surah: 2, ayah: 1 })
    expect(progressPatches, 'saving a verse is not a reading event').toHaveLength(0)
  })

  it('unsaves on a second tap and says which happened', async () => {
    const user = await openSurah()
    await user.click(saveButtons()[0])
    await waitFor(() => expect(unsaveButtons()).toHaveLength(1))
    expect(toastSuccess).toHaveBeenLastCalledWith('ui.quranVerseSaved')

    await user.click(unsaveButtons()[0])
    await waitFor(() => expect(unsaveButtons()).toHaveLength(0))
    expect(toastSuccess).toHaveBeenLastCalledWith('ui.quranVerseRemoved')
    expect(savedRows).toHaveLength(0)
  })

  it('keeps several verses rather than replacing the last one', async () => {
    // The single-pointer behaviour that made it feel broken: two taps used to
    // leave one mark.
    const user = await openSurah()
    await user.click(saveButtons()[0])
    await waitFor(() => expect(unsaveButtons()).toHaveLength(1))
    await user.click(saveButtons()[0])
    await waitFor(() => expect(unsaveButtons()).toHaveLength(2))
    expect(savedRows.map((r) => r.ayah).sort((a, b) => a - b)).toEqual([1, 2])
  })

  it('says so when the save fails, rather than looking dead again', async () => {
    const user = await openSurah()
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, json: async () => ({}) }) as unknown as Response)
    )

    await user.click(saveButtons()[0])

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('ui.quranVerseSaveFailed'))
    // And it must not claim a save that did not happen.
    expect(unsaveButtons()).toHaveLength(0)
  })
})

describe('what the reader can see', () => {
  it('marks the verse the reading position points at', async () => {
    await openSurah()
    expect(screen.getAllByText('ui.quranYouStoppedHere')).toHaveLength(1)
  })

  it('marks a sajda verse', async () => {
    // The flag came down with the text from the first release and was rendered
    // nowhere, so someone reciting had no way to know a prostration was due.
    await openSurah()
    expect(screen.getAllByText('ui.quranSajda').length).toBeGreaterThan(0)
  })

  it('offers a copy control on every verse', async () => {
    await openSurah()
    expect(screen.getAllByLabelText('ui.quranCopyVerse')).toHaveLength(20)
  })
})

describe('reading progress', () => {
  it('reports the pages the chunk covered, not just the furthest one', async () => {
    /*
      Progress was `max(page)`, so opening An-Nas once — page 604 of 604 —
      reported the whole Quran as read, and a live account showed 100%. Only the
      client knows which pages were on screen, so it has to say.
    */
    const user = await openSurah()
    await user.click(screen.getByText('common.next'))

    await waitFor(() => expect(progressPatches).toHaveLength(1))
    const sent = progressPatches[0] as { pages: number[] }
    expect(Array.isArray(sent.pages)).toBe(true)
    // The first chunk is 20 ayahs at 15 per page, so pages 1 and 2.
    expect([...sent.pages].sort((a, b) => a - b)).toEqual([1, 2])
  })
})

describe('the text size control', () => {
  it('changes the Arabic size and remembers it', async () => {
    const user = await openSurah()
    const before = screen.getByText(AYAH(2, 1)).style.fontSize

    await user.click(screen.getByLabelText('ui.quranTextLarger'))

    await waitFor(() => expect(screen.getByText(AYAH(2, 1)).style.fontSize).not.toBe(before))
    expect(localStorage.getItem('dailypriority_quran_size')).toBeTruthy()
  })

  it('will not step past either end', async () => {
    // An index off the end would render the Arabic at `undefined`px, which is a
    // blank page.
    const user = await openSurah()
    for (let i = 0; i < 8; i++) {
      const bigger = screen.getByLabelText('ui.quranTextLarger') as HTMLButtonElement
      if (bigger.disabled) break
      await user.click(bigger)
    }
    expect(screen.getByText(AYAH(2, 1)).style.fontSize).toMatch(/^\d+px$/)
    expect((screen.getByLabelText('ui.quranTextLarger') as HTMLButtonElement).disabled).toBe(true)
  })
})
