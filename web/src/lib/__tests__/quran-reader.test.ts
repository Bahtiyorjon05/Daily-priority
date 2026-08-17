import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SURAHS, QURAN_PAGES } from '@/lib/quran/surahs'

/**
 * The Quran reader.
 *
 * Three things it got wrong on first release, all of which show up only on a real
 * surah rather than on Al-Fatiha:
 *
 *  - Every ayah rendered at once. Al-Baqara is 286 ayahs, so the page became
 *    thousands of elements that scrolled forever.
 *  - The translation could not be turned off, which halves how much Arabic fits
 *    on a screen for anyone reciting rather than studying.
 *  - Reopening a bookmark at ayah 200 showed ayah 1 — the bookmark failing at the
 *    only job it has.
 */

const raw = readFileSync(
  join(process.cwd(), 'src/app/(dashboard)/quran/page.tsx'),
  'utf8'
)
const page = raw.replace(/\{?\/\*[^]*?\*\/\}?/g, '').replace(/^\s*\/\/.*$/gm, '')

describe('quran data', () => {
  it('bundles all 114 surahs with correct ayah counts', () => {
    expect(SURAHS.length).toBe(114)
    // Spot-checked against the mushaf: these are the ones a wrong list gets wrong.
    expect(SURAHS.find((s) => s.n === 1)?.ayahs).toBe(7)
    expect(SURAHS.find((s) => s.n === 2)?.ayahs).toBe(286)
    expect(SURAHS.find((s) => s.n === 36)?.ayahs).toBe(83)
    expect(SURAHS.find((s) => s.n === 114)?.ayahs).toBe(6)
    expect(QURAN_PAGES).toBe(604)
  })

  it('numbers them 1-114 with no gaps', () => {
    // A gap would make `surahByNumber` return undefined mid-list.
    expect(SURAHS.map((s) => s.n)).toEqual(Array.from({ length: 114 }, (_, i) => i + 1))
  })

  it('has an Arabic name and a meaning for every surah', () => {
    for (const s of SURAHS) {
      expect(s.ar.length, `surah ${s.n} has no Arabic name`).toBeGreaterThan(2)
      expect(s.meaning.length, `surah ${s.n} has no meaning`).toBeGreaterThan(2)
      expect(['makkah', 'madinah']).toContain(s.place)
    }
  })
})

describe('quran reader', () => {
  it('pages long surahs instead of rendering everything', () => {
    expect(page).toMatch(/const PER_PAGE = 20/)
    expect(page).toMatch(/Math\.ceil\(ayahs\.length \/ PER_PAGE\)/)
    // The chunk, not the whole list.
    expect(page).toMatch(/\{pageAyahs\.map\(\(a\) =>/)
    expect(
      /\{ayahs\.map\(\(a\) =>/.test(page),
      'rendering every ayah is what made Al-Baqara unusable'
    ).toBe(false)
  })

  it('reopens a bookmark in the chunk that holds it', () => {
    expect(page).toMatch(/openSurah\(progress\.lastSurah, progress\.lastAyah\)/)
    expect(page).toMatch(/setPage\(pageOfAyahStatic\(json\.ayahs, jumpToAyah\)\)/)
  })

  it('resets to the first chunk when opening a different surah', () => {
    // Otherwise page 8 of Al-Baqara carries over to a 6-ayah surah and shows
    // nothing at all.
    const fn = page.slice(page.indexOf('const openSurah'), page.indexOf('const savePosition'))
    expect(fn).toMatch(/setPage\(0\)/)
  })

  it('lets the translation be turned off, and remembers', () => {
    expect(page).toMatch(/showTranslation/)
    expect(page).toMatch(/\{showTranslation && a\.tr && \(/)
    expect(page).toMatch(/localStorage\.setItem\('dailypriority_quran_translation'/)
    expect(page, 'and restores it on load').toMatch(
      /localStorage\.getItem\('dailypriority_quran_translation'\)/
    )
    expect(page).toMatch(/aria-pressed=\{showTranslation\}/)
  })

  it('only offers "finished" on the last chunk', () => {
    // On page 3 of 15 it would be a lie.
    expect(page).toMatch(/\{page >= pageCount - 1 && \(/)
  })

  it('saves position when moving to the next chunk', () => {
    // Turning the page is a reading event; without this, leaving mid-surah loses
    // the place unless you remember to press a separate button.
    const next = page.slice(page.indexOf("t('common.next')") - 1400, page.indexOf("t('common.next')"))
    expect(next).toMatch(/savePosition\(open, last\.n, last\.page\)/)
  })

  it('hides the pager on a single-chunk surah', () => {
    // A pager on Al-Fatiha is noise.
    expect(page).toMatch(/\{pageCount > 1 && \(/)
  })

  it('keeps the reader controls tappable', () => {
    const reader = page.slice(page.indexOf("t('ui.quranAllSurahs')"))
    expect((reader.match(/h-1[12]/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('sets Arabic right-to-left with its own face', () => {
    // A Quran rendered at body size in the UI font is not one anyone reads twice.
    expect(page).toMatch(/dir="rtl"/)
    expect(page).toMatch(/lang="ar"/)
    expect(page).toMatch(/var\(--font-amiri\)/)
  })
})
