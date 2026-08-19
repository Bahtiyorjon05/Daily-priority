import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'

/**
 * Saved verses, and honest progress.
 *
 * Two defects found by reading the live table rather than the code:
 *
 *  - A row held `lastAyah: 40`, written by the per-ayah bookmark button. The
 *    writes were landing; they were landing on the reading position, which is one
 *    pointer, so the button could never show a result.
 *  - The same row held `pagesRead: 604` — the whole Quran — because `pagesRead`
 *    was `max(page)` and page 604 is An-Nas. Opening the last surah once claimed
 *    the entire mushaf. The account showed 100%.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) =>
  s.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '').replace(/^\s*\/\/.*$/gm, '')

const bookmarks = strip(read('src/app/api/quran/bookmarks/route.ts'))
const progress = strip(read('src/app/api/quran/progress/route.ts'))
const schema = read('prisma/schema.prisma')
const page = strip(read('src/app/(dashboard)/quran/page.tsx'))

describe('the saved-verse store', () => {
  it('is a set of verses, not a moving pointer', () => {
    // The unique key is what makes it a set: one row per verse per person, so a
    // second tap on the same ayah can only remove it.
    expect(schema).toMatch(/model QuranBookmark/)
    expect(schema).toMatch(/@@unique\(\[userId, surah, ayah\]\)/)
  })

  it('validates against the bundled surah data', () => {
    // Same bound as the reader renders from, so a bad client cannot store a verse
    // that will never resolve to anything on reopen.
    expect(bookmarks).toMatch(/ayah > surah\.ayahs/)
    expect(bookmarks).toMatch(/page < 1 \|\| page > QURAN_PAGES/)
    expect(bookmarks).toMatch(/if \(!surah\) return \{ ok: false/)
  })

  it('lets the server decide the toggle', () => {
    /*
      The client says "this verse"; the server says whether it is now saved. If
      the client decided from its own list, a stale list would double-save or fail
      to remove — and the list is stale by definition between two taps.
    */
    expect(bookmarks).toMatch(/if \(existing\) \{[\s\S]*?delete[\s\S]*?saved: false/)
    expect(bookmarks).toMatch(/saved: true/)
    expect(page).toMatch(/const \{ saved: nowSaved \} = await res\.json\(\)/)
  })

  it('caps how many one person can store', () => {
    expect(bookmarks).toMatch(/MAX_BOOKMARKS = \d+/)
    expect(bookmarks).toMatch(/count >= MAX_BOOKMARKS/)
  })

  it('requires a signed-in user on every path', () => {
    const guards = bookmarks.match(/if \(!session\?\.user\?\.id\)/g) ?? []
    expect(guards.length, 'both GET and POST must be guarded').toBeGreaterThanOrEqual(2)
  })
})

describe('progress counts pages instead of maximising them', () => {
  it('counts rows', () => {
    expect(schema).toMatch(/model QuranPageRead/)
    expect(schema).toMatch(/@@unique\(\[userId, page\]\)/)
    expect(progress).toMatch(/prisma\.quranPageRead\.count\(\{ where: \{ userId \} \}\)/)
  })

  it('no longer takes the highest page as the total', () => {
    /*
      The exact line that produced 100%: `Math.max(existing?.pagesRead ?? 0, page)`.
      Anchored on its absence because that is the defect, and it would come back
      as an innocuous-looking one-liner.
    */
    expect(progress).not.toMatch(/Math\.max\(existing\?\.pagesRead/)
    expect(progress).not.toMatch(/pagesRead = Math\.max/)
  })

  it('records every page the sitting covered', () => {
    expect(progress).toMatch(/prisma\.quranPageRead\.createMany/)
    expect(progress).toMatch(/skipDuplicates: true/)
    expect(progress).toMatch(/pagesCovered\.map\(\(p\) => \(\{ userId, page: p \}\)\)/)
  })

  it('does not trust the page list it is sent', () => {
    // It arrives from the client, so it is bounded, de-duplicated and filtered to
    // real mushaf pages before it becomes rows.
    expect(progress).toMatch(/MAX_PAGES_PER_WRITE/)
    expect(progress).toMatch(/\.\.\.new Set\(/)
    expect(progress).toMatch(/p >= 1 && p <= QURAN_PAGES/)
    expect(progress).toMatch(/\.slice\(0, MAX_PAGES_PER_WRITE\)/)
  })

  it('always counts the page the reader is actually on', () => {
    // A client that sends an empty array still read the page it asked to save.
    expect(progress).toMatch(/if \(!pagesCovered\.includes\(page\)\) pagesCovered\.push\(page\)/)
  })

  it('separates having a place to return to from having made progress', () => {
    /*
      The "continue reading" card keyed off `pagesRead > 0`. With a truthful count
      that starts at zero, a reader with a saved position would have been offered
      no way back to it.
    */
    expect(progress).toMatch(/hasPosition: Boolean\(progress\)/)
    expect(page).toMatch(/progress\?\.hasPosition && \(/)
    expect(page).not.toMatch(/progress\.pagesRead > 0/)
  })
})

describe('the reader surfaces', () => {
  it('shows the count next to the percentage', () => {
    // "2%" on its own says nothing about whether the number measures the right
    // thing; "12 of 604 pages" does.
    expect(page).toMatch(/progress\?\.pagesRead \?\? 0\}/)
  })

  it('has both languages for every new string', () => {
    for (const key of [
      'ui.quranSaveVerse', 'ui.quranUnsaveVerse', 'ui.quranVerseSaved',
      'ui.quranVerseRemoved', 'ui.quranVerseSaveFailed', 'ui.quranSavedVerses',
      'ui.quranSavedCount', 'ui.quranCopyVerse', 'ui.quranCopied',
      'ui.quranCopyFailed', 'ui.quranSajda', 'ui.quranSajdaNote',
      'ui.quranTextSmaller', 'ui.quranTextLarger', 'ui.quranYouStoppedHere',
    ]) {
      expect((en as Record<string, string>)[key], `en ${key}`).toBeTruthy()
      expect((uz as Record<string, string>)[key], `uz ${key}`).toBeTruthy()
    }
  })

  it('drops the keys whose buttons no longer exist', () => {
    // `ui.quranMarkHere` and `ui.quranSaved` were the old bookmark button's
    // strings. Leaving them behind is how a dictionary rots.
    expect((en as Record<string, string>)['ui.quranMarkHere']).toBeUndefined()
    expect((en as Record<string, string>)['ui.quranSaved']).toBeUndefined()
  })
})
