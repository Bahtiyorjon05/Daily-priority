import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SURAHS, QURAN_PAGES, surahByNumber } from '@/lib/quran/surahs'
import { SURAH_NAMES_UZ } from '@/lib/quran/names-uz'
import { surahName, surahMeaning, surahSearchTerms } from '@/lib/quran/name'

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

const api = readFileSync(
  join(process.cwd(), 'src/app/api/quran/progress/route.ts'),
  'utf8'
).replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8')

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

/**
 * "I finished this surah" appeared to do nothing, and it very nearly did.
 *
 * The only stored progress was `pagesRead`, a running maximum. So finishing
 * Al-Fatiha after having read Al-Baqara moved no number, changed no percentage,
 * and left the reader on the same screen. Nothing was broken; nothing was
 * happening.
 *
 * Verified against the live database: finishing surah 1 after surah 2 records
 * the completion while `pagesRead` correctly stays at 49; turning a page in
 * surah 36 does NOT mark it finished; re-finishing refreshes the date and leaves
 * one row rather than failing on the unique index.
 */
describe('finishing a surah', () => {
  it('records completions in their own table', () => {
    const model = /model QuranSurahRead \{([^]*?)\n\}/.exec(schema)?.[1] ?? ''
    expect(model, 'QuranSurahRead not found').toBeTruthy()
    // One row per surah per user — re-reading refreshes rather than duplicating.
    expect(model).toMatch(/@@unique\(\[userId, surah\]\)/)
    expect(model).toMatch(/onDelete: Cascade/)
  })

  it('only records a completion when the reader says so', () => {
    // Turning a page saves position; it must not claim the surah is done.
    expect(api).toMatch(/const finished = body\.finished === true/)
    expect(api).toMatch(/\.\.\.\(finished/)
  })

  it('refreshes rather than fails on a re-read', () => {
    expect(api).toMatch(/prisma\.quranSurahRead\.upsert/)
    expect(api).toMatch(/update: \{ completedAt: new Date\(\) \}/)
  })

  it('returns the finished list so the UI can show it', () => {
    expect(api).toMatch(/finishedSurahs: finished\.map\(\(f\) => f\.surah\)/)
    expect(api).toMatch(/finishedCount: finished\.length/)
  })

  it('gives the button visible consequences', () => {
    const handler = page.slice(
      page.indexOf('{ finished: true }') - 400,
      page.indexOf('{ finished: true }') + 700
    )
    expect(handler, 'records the completion').toMatch(/\{ finished: true \}/)
    expect(handler, 'names the surah in the confirmation').toMatch(/ui\.quranFinishedToast/)
    expect(handler, 'returns to the list where the tick is visible').toMatch(/setOpen\(null\)/)
    // And it must not claim success when the save failed.
    expect(handler).toMatch(/if \(!ok\) return/)
  })

  it('shows a tick in the list and a count in the header', () => {
    expect(page).toMatch(/isFinished=\{finishedSet\.has\(s\.n\)\}/)
    expect(page).toMatch(/isFinished \? <CheckCircle2/)
    // A number that moves when a short surah is finished, which pagesRead cannot.
    expect(page).toMatch(/ui\.quranSurahsDone/)
    expect(page).toMatch(/progress\?\.finishedCount \?\? 0\}\/114/)
  })

  it('does not toast on every page turn', () => {
    // A confirmation each time you move forward is noise; the deliberate actions
    // (mark my place, finished) are the ones that confirm.
    const pager = page.slice(page.indexOf("t('common.next')") - 1200, page.indexOf("t('common.next')"))
    expect(pager).toMatch(/savePosition\(open, last\.n, last\.page\)/)
    expect(pager).not.toMatch(/toast\.success/)
  })

  it('offers "read again" once a surah is done', () => {
    // The same button claiming "I finished this" on a surah already ticked reads
    // as though the first press failed.
    expect(page).toMatch(/alreadyFinished \? t\('ui\.quranReadAgain'\)/)
  })
})

describe('surah names in the language the reader chose', () => {
  /*
    The Uzbek reader saw "Al-Baqara · The Cow". Both halves were English: the
    source gives the English transliteration convention with the article attached,
    and the meaning was never translated at all. On the one page of this app that
    exists to be read in your own language, that was the wrong language twice.
  */

  it('names every one of the 114 in Uzbek', () => {
    const gaps = SURAHS.filter((s) => {
      const uz = SURAH_NAMES_UZ[s.n]
      return !uz?.uz?.trim() || !uz?.meaning?.trim()
    }).map((s) => s.n)
    expect(gaps, `surahs with no Uzbek name: ${gaps.join(', ')}`).toEqual([])
  })

  it('drops the article, the way an Uzbek mushaf writes it', () => {
    // "Al-Baqara" is the English convention. An Uzbek copy says "Baqara", and
    // that is the name the reader is scanning the list for.
    const withArticle = SURAHS.filter((s) =>
      /^(Al|An|Ar|At|As|Ash|Az)-/.test(SURAH_NAMES_UZ[s.n].uz)
    ).map((s) => s.n)
    expect(withArticle, `still carrying the English article: ${withArticle.join(', ')}`).toEqual([])
    expect(surahName(surahByNumber(2)!, 'uz')).toBe('Baqara')
    expect(surahName(surahByNumber(2)!, 'en')).toBe('Al-Baqara')
  })

  it('translates the meanings rather than copying them', () => {
    /*
      The failure this catches is a half-filled table: rows added with the English
      meaning pasted across as a placeholder. Proper nouns legitimately match —
      Quraysh is Quraysh in both — so a small number is expected, and 113 of 114
      differ.
    */
    const copied = SURAHS.filter((s) => SURAH_NAMES_UZ[s.n].meaning === s.meaning)
    expect(copied.length, `copied from English: ${copied.map((s) => s.n).join(', ')}`).toBeLessThan(5)
    expect(surahMeaning(surahByNumber(2)!, 'uz')).toBe('Sigir')
    expect(surahMeaning(surahByNumber(18)!, 'uz')).toBe("G'or")
  })

  it('leaves no English function words in an Uzbek meaning', () => {
    // "The Cow" surviving in the table is the exact bug being fixed, and it would
    // read as Uzbek to anyone skimming the file.
    const leaks = SURAHS.filter((s) =>
      /\b(the|of|who|and)\b/i.test(SURAH_NAMES_UZ[s.n].meaning)
    ).map((s) => `${s.n}: ${SURAH_NAMES_UZ[s.n].meaning}`)
    expect(leaks, leaks.join(' | ')).toEqual([])
  })

  it('gives no two surahs the same Uzbek name', () => {
    // A duplicate means a row was filled in from the wrong line, and the list
    // would show the same name twice with different Arabic beside it.
    const seen = new Map<string, number>()
    const clashes: string[] = []
    for (const s of SURAHS) {
      const uz = SURAH_NAMES_UZ[s.n].uz
      const owner = seen.get(uz)
      if (owner) clashes.push(`${owner} and ${s.n} are both "${uz}"`)
      else seen.set(uz, s.n)
    }
    expect(clashes, clashes.join(' | ')).toEqual([])
  })

  it('falls back to a name rather than to nothing', () => {
    // An unknown locale should still name the surah. A blank row is worse than a
    // row in the wrong language.
    expect(surahName(surahByNumber(36)!, 'ru')).toBe('Yaseen')
    expect(surahMeaning(surahByNumber(36)!, 'ru')).toBeTruthy()
  })

  it('finds a surah by its name in either language', () => {
    /*
      Search deliberately spans both. Someone reading in Uzbek may type "Baqarah"
      from memory or paste it from elsewhere, and a search that knows the surah
      exists but will not find it under the name you typed is worse than none.
    */
    const baqara = surahByNumber(2)!
    for (const q of ['baqara', 'sigir', 'cow', '2']) {
      expect(
        surahSearchTerms(baqara).some((term) => term.includes(q)),
        `should be findable by "${q}"`
      ).toBe(true)
    }
    const yasin = surahByNumber(36)!
    for (const q of ['yosin', 'yaseen', '36']) {
      expect(
        surahSearchTerms(yasin).some((term) => term.includes(q)),
        `should be findable by "${q}"`
      ).toBe(true)
    }
  })

  it('renders every name through the locale helper, never the raw field', () => {
    /*
      Four separate surfaces reached into `surah.en` on their own, which is how the
      list could be translated while the reader header stayed English. Anchored on
      the field access, so adding a fifth surface that skips the helper fails here.
    */
    expect(page).not.toMatch(/\.en\b/)
    expect(page).not.toMatch(/surah\.meaning|current\?\.meaning/)
    expect(page).toMatch(/surahName\(s, locale\)/)
    expect(page).toMatch(/surahMeaning\(s, locale\)/)
    expect(page).toMatch(/surahName\(current, locale\)/)
    expect(page).toMatch(/surahSearchTerms\(s\)/)
  })

  it('names the bookmarked surah and the finish toast in the same language', () => {
    // The two places most likely to be left behind: one is a string interpolated
    // into a toast, the other a chained lookup.
    expect(page).toMatch(/const continueName = bookmarked \? surahName\(bookmarked, locale\)/)
    expect(page).toMatch(/surah: current \? surahName\(current, locale\) : ''/)
  })
})
