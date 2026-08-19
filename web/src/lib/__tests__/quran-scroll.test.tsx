// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Opening a surah starts at the first ayah.
 *
 * Reported as: after finishing one surah, opening the next one showed it part-way
 * down instead of at the top.
 *
 * The scroll was issued from inside the click handler, one line after
 * `setAyahs(...)`. Two things were wrong with that, and the second is what users
 * actually hit:
 *
 *  1. React batches, so nothing was committed yet — the browser scrolled against
 *     the previous layout.
 *  2. The surah response is cached for a year, so on any repeat visit `await
 *     fetch` resolves before React has rendered the reader at all. `readerRef`
 *     was still null, `?.` swallowed it, and NOTHING scrolled — the window stayed
 *     where the list had been. Finishing a surah leaves you at the bottom of a
 *     long page, which is exactly how you end up several thousand pixels into the
 *     next surah's text.
 *
 * These tests run the real component in jsdom and record what was on the page at
 * the moment the scroll happened. That is the part that was wrong, so it is the
 * part worth asserting on — a source-text check could not tell the difference
 * between a scroll that lands and one that no-ops.
 */

vi.mock('@/lib/i18n/client', () => ({
  useT: () => ({
    locale: 'en',
    setLocale: () => {},
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key} ${JSON.stringify(params)}` : key,
  }),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@/components/shared/PhaseHeader', () => ({
  PhaseHeader: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  HeaderStat: () => null,
}))

/** Ayah text distinctive enough to search the document for. */
const AYAH = (surah: number, n: number) => `ARABIC-S${surah}-A${n}`

/** A surah long enough to span more than one chunk, so the pager exists. */
const makeAyahs = (surah: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    n: i + 1,
    ar: AYAH(surah, i + 1),
    tr: `translation ${i + 1}`,
    page: 1 + Math.floor(i / 15),
    juz: 1,
    sajda: false,
  }))

/**
 * What was on the page each time something asked to be scrolled to.
 *
 * `ayahsPresent` is the assertion that matters: a scroll issued before the text
 * exists is the bug, whether it no-ops or scrolls to the wrong place.
 */
type ScrollRecord = { ayahsPresent: number }
let scrolls: ScrollRecord[] = []

beforeEach(() => {
  scrolls = []
  Element.prototype.scrollIntoView = function scrollIntoView() {
    scrolls.push({
      ayahsPresent: document.body.textContent?.includes('ARABIC-S') ? 1 : 0,
    })
  }
  localStorage.clear()
})

afterEach(() => {
  // Explicit: auto-cleanup only registers itself when vitest runs with globals,
  // and without it the next render mounts a second copy on top of the first.
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

/**
 * @param immediate resolve fetches synchronously, which is what the HTTP cache
 *   does on a repeat open — and the case the old code got wrong.
 */
function stubFetch(immediate: boolean, ayahCounts: Record<number, number> = { 2: 40, 36: 40 }) {
  const respond = (body: unknown) => {
    const res = { ok: true, json: async () => body } as unknown as Response
    return immediate ? Promise.resolve(res) : new Promise<Response>((r) => setTimeout(() => r(res), 0))
  }
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/api/quran/progress')) {
      return respond({
        data: {
          lastSurah: 1,
          lastAyah: 1,
          lastPage: 1,
          pagesRead: 0,
          percent: 0,
          finishedSurahs: [],
          finishedCount: 0,
          streak: 0,
        },
      })
    }
    const match = url.match(/\/api\/quran\/surah\/(\d+)/)
    if (match) {
      const n = Number(match[1])
      return respond({ ayahs: makeAyahs(n, ayahCounts[n] ?? 40) })
    }
    return respond({})
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function openPage() {
  const { default: QuranPage } = await import('@/app/(dashboard)/quran/page')
  render(<QuranPage />)
  // The list renders from bundled data, so a surah row is there immediately.
  await waitFor(() => expect(screen.getByText('Al-Baqara')).toBeTruthy())
}

describe('opening a surah', () => {
  it('scrolls only once the ayahs are on the page', async () => {
    stubFetch(false)
    const user = userEvent.setup()
    await openPage()

    await user.click(screen.getByText('Al-Baqara'))
    await waitFor(() => expect(screen.getByText(AYAH(2, 1))).toBeTruthy())

    expect(scrolls.length, 'the reader should be scrolled to').toBeGreaterThan(0)
    // Every scroll happened with the text present. A scroll before that is either
    // a no-op or aimed at the wrong layout.
    expect(scrolls.every((s) => s.ayahsPresent === 1)).toBe(true)
  })

  it('still scrolls when the response comes back before the first render', async () => {
    /*
      The regression case. With the surah cached, `await fetch` resolves inside the
      same tick as the click, so the reader has not been mounted and the ref is
      null. The old code scrolled nothing at all and left the window at the list's
      offset.
    */
    stubFetch(true)
    const user = userEvent.setup()
    await openPage()

    await user.click(screen.getByText('Al-Baqara'))
    await waitFor(() => expect(screen.getByText(AYAH(2, 1))).toBeTruthy())

    expect(scrolls.length, 'a cached surah must still be scrolled to').toBeGreaterThan(0)
    expect(scrolls.every((s) => s.ayahsPresent === 1)).toBe(true)
  })

  it('scrolls again for the next surah opened after the first', async () => {
    // The reported sequence: read one, go back, open another. The second open is
    // the one that was landing part-way down.
    stubFetch(true)
    const user = userEvent.setup()
    await openPage()

    await user.click(screen.getByText('Al-Baqara'))
    await waitFor(() => expect(screen.getByText(AYAH(2, 1))).toBeTruthy())
    const afterFirst = scrolls.length

    // The back control is an icon now, so it is found by its accessible name.
    await user.click(screen.getByLabelText('ui.quranAllSurahs'))
    await waitFor(() => expect(screen.getByText('Yaseen')).toBeTruthy())

    await user.click(screen.getByText('Yaseen'))
    await waitFor(() => expect(screen.getByText(AYAH(36, 1))).toBeTruthy())

    expect(scrolls.length, 'the second surah must be scrolled to as well').toBeGreaterThan(afterFirst)
    expect(scrolls.every((s) => s.ayahsPresent === 1)).toBe(true)
  })
})

describe('turning a page inside a surah', () => {
  it('goes to the top of the new chunk', async () => {
    stubFetch(true)
    const user = userEvent.setup()
    await openPage()

    await user.click(screen.getByText('Al-Baqara'))
    await waitFor(() => expect(screen.getByText(AYAH(2, 1))).toBeTruthy())
    const afterOpen = scrolls.length

    await user.click(screen.getByText('common.next'))
    // Chunks are 20 ayahs, so ayah 21 opens the second one.
    await waitFor(() => expect(screen.getByText(AYAH(2, 21))).toBeTruthy())

    expect(scrolls.length, 'a page turn should scroll to the top').toBeGreaterThan(afterOpen)
    expect(scrolls.every((s) => s.ayahsPresent === 1)).toBe(true)
  })

  it('does not scroll when nothing moved', async () => {
    /*
      The effect is keyed on surah and chunk, not on `ayahs` alone — the
      translation refetch replaces the ayah array for the chunk you are already
      reading, and yanking you to the top there would lose your place mid-page.
    */
    stubFetch(true)
    const user = userEvent.setup()
    await openPage()

    await user.click(screen.getByText('Al-Baqara'))
    await waitFor(() => expect(screen.getByText(AYAH(2, 1))).toBeTruthy())
    const afterOpen = scrolls.length

    // Off, then on — the second one refetches the same chunk.
    await user.click(screen.getByText('ui.quranTranslation'))
    await user.click(screen.getByText('ui.quranTranslation'))
    await waitFor(() => expect(screen.getByText(AYAH(2, 1))).toBeTruthy())

    expect(scrolls.length, 'a refetch of the same chunk must not scroll').toBe(afterOpen)
  })
})
