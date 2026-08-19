'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Search, ArrowLeft, Flame, Bookmark, BookmarkCheck, Loader2,
  ChevronRight, ChevronLeft, Languages, CheckCircle2, Copy, Minus, Plus, Type,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n/client'
import { PhaseHeader, HeaderStat } from '@/components/shared/PhaseHeader'
import { SURAHS, QURAN_PAGES, surahByNumber, type Surah } from '@/lib/quran/surahs'
import { surahName, surahMeaning, surahSearchTerms } from '@/lib/quran/name'

/**
 * Quran reading.
 *
 * Two views in one route rather than two routes: the list, and one surah open.
 * Reading is a loop — open, read, come back, open the next — and a full
 * navigation between every step would put a blank page in the middle of it.
 *
 * The bookmark is the point of the whole page. Someone who reads two pages a day
 * for a year should never once have to remember where they were, so the position
 * is saved on the server as they go and the list leads with "continue".
 */

type Ayah = {
  n: number
  ar: string
  tr: string
  page: number
  juz: number
  sajda: boolean
}

/** Which 20-ayah chunk holds a given ayah. Module scope so `openSurah` can use it
 *  without depending on a callback declared further down the component. */
const PER_PAGE = 20
function pageOfAyahStatic(list: { n: number }[], ayahNumber: number): number {
  const i = list.findIndex((a) => a.n === ayahNumber)
  return i < 0 ? 0 : Math.floor(i / PER_PAGE)
}

/** A verse someone saved, as it comes back from the server. */
type SavedVerse = {
  surah: number
  ayah: number
  page: number
}

/*
  Arabic size, in px.

  A Quran reader with one fixed text size is a Quran reader that suits one pair
  of eyes. The range is deliberately narrow at the bottom: below about 20px the
  diacritics stop being distinguishable, which is worse than useless for Arabic.
*/
const ARABIC_SIZES = [22, 26, 30, 36, 42] as const
const DEFAULT_SIZE_INDEX = 1
const SIZE_STORAGE_KEY = 'dailypriority_quran_size'

/** Saved verses shown on the list. A shortcut, not an archive. */
const SAVED_SHOWN = 12

/** Stable key for one verse. */
const verseKey = (surah: number, ayah: number) => `${surah}:${ayah}`

type Progress = {
  finishedSurahs: number[]
  finishedCount: number
  lastSurah: number
  lastAyah: number
  lastPage: number
  pagesRead: number
  percent: number
  /** Whether there is a place to go back to at all. */
  hasPosition: boolean
  streak: number
  readToday: boolean
  pagesThisWeek: number
}

export default function QuranPage() {
  const { t, locale } = useT()

  const [progress, setProgress] = useState<Progress | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const [ayahs, setAyahs] = useState<Ayah[] | null>(null)
  const [loadingSurah, setLoadingSurah] = useState(false)
  const [query, setQuery] = useState('')
  /*
    Translation on or off, and remembered.

    Someone reciting wants Arabic alone at a readable size; someone studying
    wants both. Forcing the translation on halves how much Arabic fits on a
    screen, and asking again every time you open a surah is its own small
    annoyance — so the choice persists locally.
  */
  const [showTranslation, setShowTranslation] = useState(true)
  /*
    Al-Baqara is 286 ayahs. Rendering all of them meant a page thousands of
    elements long that scrolled forever and lost your place the moment you left
    it. Paged, and the page number is part of the saved position.
  */
  const [page, setPage] = useState(0)
  const [needsRefetch, setNeedsRefetch] = useState(false)
  const readerRef = useRef<HTMLDivElement>(null)

  /*
    Saved verses.

    Held as a Set of "surah:ayah" so the reader can answer "is this one saved"
    while rendering twenty ayahs, without scanning an array twenty times.
  */
  const [saved, setSaved] = useState<SavedVerse[]>([])
  const savedSet = useMemo(
    () => new Set(saved.map((v) => verseKey(v.surah, v.ayah))),
    [saved]
  )
  const [savingVerse, setSavingVerse] = useState<string | null>(null)

  /** Arabic size, remembered — see ARABIC_SIZES. */
  const [sizeIndex, setSizeIndex] = useState(DEFAULT_SIZE_INDEX)

  const loadProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/quran/progress', { cache: 'no-store' })
      if (res.ok) setProgress((await res.json()).data)
    } catch {
      /* The list is still usable without it; no spinner earns a blocked page. */
    }
  }, [])

  const loadSaved = useCallback(async () => {
    try {
      const res = await fetch('/api/quran/bookmarks', { cache: 'no-store' })
      if (res.ok) setSaved((await res.json()).data ?? [])
    } catch {
      /* Reading still works with no saved list; it is not worth a banner. */
    }
  }, [])

  useEffect(() => {
    loadProgress()
    loadSaved()
  }, [loadProgress, loadSaved])

  // Restore the reading preferences before the first surah opens.
  useEffect(() => {
    const stored = localStorage.getItem('dailypriority_quran_translation')
    if (stored !== null) setShowTranslation(stored === '1')

    const size = Number(localStorage.getItem(SIZE_STORAGE_KEY))
    // Guarded, not trusted: a stale or hand-edited value must not index off the
    // end of the array and render Arabic at `undefined`px.
    if (Number.isInteger(size) && size >= 0 && size < ARABIC_SIZES.length) {
      setSizeIndex(size)
    }
  }, [])

  const stepSize = useCallback((delta: number) => {
    setSizeIndex((i) => {
      const next = Math.min(ARABIC_SIZES.length - 1, Math.max(0, i + delta))
      localStorage.setItem(SIZE_STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const toggleTranslation = useCallback(() => {
    setShowTranslation((v) => {
      const next = !v
      localStorage.setItem('dailypriority_quran_translation', next ? '1' : '0')
      /*
        Turning it ON has to refetch: the previous request may have asked for
        Arabic only, so the translation simply is not in memory. Turning it OFF
        needs nothing — the text is already there and hiding it is instant.
      */
      if (next) setNeedsRefetch(true)
      return next
    })
  }, [])

  const openSurah = useCallback(
    async (n: number, jumpToAyah?: number) => {
      setOpen(n)
      setAyahs(null)
      setPage(0)
      setLoadingSurah(true)
      try {
        const res = await fetch(
          `/api/quran/surah/${n}?locale=${locale}&translation=${showTranslation ? '1' : '0'}`
        )
        if (!res.ok) throw new Error('failed')
        const json = await res.json()
        setAyahs(json.ayahs)
        /*
          Land on the chunk holding the saved ayah. Reopening a bookmark at ayah
          200 of Al-Baqara and being shown ayah 1 is the bookmark failing at the
          only job it has.
        */
        if (jumpToAyah && jumpToAyah > 1) {
          setPage(pageOfAyahStatic(json.ayahs, jumpToAyah))
        }
        // Scrolling happens in an effect below, once this content is actually
        // on the page. See the note there.
      } catch {
        toast.error(t('ui.quranLoadFailed'))
        setOpen(null)
      } finally {
        setLoadingSurah(false)
      }
    },
    [locale, t, showTranslation]
  )

  /*
    Start a new surah, or a new chunk, at the top.

    This has to run AFTER React has put the content on the page, which is why it
    is an effect and not a line in the click handler. It used to be called right
    after `setAyahs(...)`, and the surah text was not in the DOM yet:

      - React batches, so nothing had been committed when the scroll ran. The
        browser scrolled against the old layout.
      - Worse, on a second visit the surah comes back from the HTTP cache -- it is
        cached for a year -- so `await fetch` resolved before React had rendered
        the reader at all. `readerRef.current` was still null and the scroll was a
        silent no-op, leaving the window wherever the LIST had been scrolled to.
        Finishing a surah leaves you at the bottom of a long page, so the next
        surah opened several thousand pixels in, part-way down its text.

    Keyed on surah and chunk, and guarded by a signature, so it fires once per
    move rather than on every render -- and does NOT fire when the translation
    refetch replaces `ayahs` for the chunk you are already reading.
  */
  const lastScrolled = useRef<string | null>(null)
  useEffect(() => {
    if (open === null) {
      lastScrolled.current = null
      return
    }
    // Nothing to scroll to until the ayahs are rendered.
    if (!ayahs) return
    const signature = `${open}:${page}`
    if (lastScrolled.current === signature) return
    lastScrolled.current = signature
    // `auto`, explicitly: a `scroll-behavior: smooth` inherited from anywhere
    // would animate a jump that has to be instantaneous to feel like an open.
    readerRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
  }, [open, page, ayahs])

  /*
    Jump to one ayah inside the surah already open.

    Two steps, because the ayah may not be in the chunk on screen: move to the
    chunk that holds it, then scroll to the element once it exists. The chunk
    signature is claimed here so the top-of-chunk effect above does not scroll to
    the top a moment before this scrolls to the verse -- they would fight, and
    which one won would depend on render timing.
  */
  const [pendingAyah, setPendingAyah] = useState<number | null>(null)

  const jumpToAyah = useCallback(
    (ayahNumber: number) => {
      if (!ayahs || open === null) return
      const target = pageOfAyahStatic(ayahs, ayahNumber)
      lastScrolled.current = `${open}:${target}`
      setPage(target)
      setPendingAyah(ayahNumber)
    },
    [ayahs, open]
  )

  useEffect(() => {
    if (pendingAyah === null || !ayahs) return
    const el = document.getElementById(`ayah-${pendingAyah}`)
    if (!el) return
    el.scrollIntoView({ block: 'start', behavior: 'auto' })
    setPendingAyah(null)
  }, [pendingAyah, page, ayahs])

  /**
   * Save or unsave one verse.
   *
   * The server owns the toggle: the client says "this verse", the server says
   * whether it is now saved. A client that decided for itself would double-save
   * or fail to remove whenever its list was a moment stale, and the previous
   * version of this button had no state at all -- it wrote to the reading
   * POSITION, so tapping it silently replaced the last one and nothing on the
   * page changed. That is why it read as broken.
   */
  const toggleVerse = useCallback(
    async (surah: number, ayah: number, mushafPage: number) => {
      const key = verseKey(surah, ayah)
      setSavingVerse(key)
      try {
        const res = await fetch('/api/quran/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ surah, ayah, page: mushafPage }),
        })
        if (!res.ok) throw new Error('failed')
        const { saved: nowSaved } = await res.json()
        setSaved((list) =>
          nowSaved
            ? [{ surah, ayah, page: mushafPage }, ...list.filter((v) => verseKey(v.surah, v.ayah) !== key)]
            : list.filter((v) => verseKey(v.surah, v.ayah) !== key)
        )
        toast.success(t(nowSaved ? 'ui.quranVerseSaved' : 'ui.quranVerseRemoved'))
      } catch {
        toast.error(t('ui.quranVerseSaveFailed'))
      } finally {
        setSavingVerse(null)
      }
    },
    [t]
  )

  /**
   * Copy one verse, with its reference.
   *
   * Arabic and translation together, because a verse pasted without its source
   * is a quote no one can check.
   */
  const copyVerse = useCallback(
    async (surah: Surah | undefined, a: Ayah) => {
      const name = surah ? surahName(surah, locale) : ''
      const parts = [a.ar, showTranslation && a.tr ? a.tr : '', `${name} ${a.n}`]
      try {
        await navigator.clipboard.writeText(parts.filter(Boolean).join('\n\n'))
        toast.success(t('ui.quranCopied'))
      } catch {
        // Clipboard access is refused in plenty of ordinary situations --
        // an insecure context, a locked-down browser -- and silence there
        // looks exactly like a dead button.
        toast.error(t('ui.quranCopyFailed'))
      }
    },
    [locale, showTranslation, t]
  )

  /**
   * Saves the bookmark, and optionally records the surah as finished.
   *
   * `finished` is what makes the button mean anything. Without it the only stored
   * progress was `pagesRead`, a running maximum — so finishing Al-Fatiha after
   * having read Al-Baqara changed no number, updated no percentage, and left the
   * reader on the same screen. It looked broken because nothing happened.
   */
  const savePosition = useCallback(
    async (
      surah: number,
      ayah: number,
      mushafPage: number,
      opts: { finished?: boolean; pages?: number[] } = {}
    ) => {
      try {
        const res = await fetch('/api/quran/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          /*
            `pages` is which mushaf pages this sitting actually covered.

            Progress used to be the HIGHEST page reached, so opening An-Nas once
            -- page 604 of 604 -- reported the whole Quran as read, and a live
            account showed 100%. The client is the only side that knows which
            pages were on screen, because the ayah/page mapping comes down with
            the text, so it has to say.
          */
          body: JSON.stringify({
            surah,
            ayah,
            page: mushafPage,
            pages: opts.pages,
            finished: opts.finished,
          }),
        })
        if (!res.ok) throw new Error('failed')
        await loadProgress()
        return true
      } catch {
        toast.error(t('ui.failedToSaveSettings'))
        return false
      }
    },
    [loadProgress, t]
  )

  /*
    Refetch after the translation is switched on, keeping the chunk the reader is
    on. Without this, turning it on shows nothing at all — the previous request
    asked for Arabic only, so there is no translation in memory to reveal.
  */
  useEffect(() => {
    if (!needsRefetch || open === null) {
      if (needsRefetch) setNeedsRefetch(false)
      return
    }
    const keepPage = page
    setNeedsRefetch(false)
    ;(async () => {
      try {
        const res = await fetch(`/api/quran/surah/${open}?locale=${locale}&translation=1`)
        if (!res.ok) return
        const json = await res.json()
        setAyahs(json.ayahs)
        setPage(keepPage)
      } catch {
        /* The Arabic already on screen is still readable. */
      }
    })()
  }, [needsRefetch, open, locale, page])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SURAHS
    /*
      Number, name or meaning, in EITHER language — people look for "36",
      "Yaseen", "Yosin" and "Sigir" in roughly equal measure, and someone reading
      in Uzbek may still type the name they saw somewhere in English.
    */
    return SURAHS.filter((s) =>
      surahSearchTerms(s).some((term) => term.includes(q))
    )
  }, [query])

  const current = open ? surahByNumber(open) : undefined
  const finishedSet = useMemo(
    () => new Set(progress?.finishedSurahs ?? []),
    [progress?.finishedSurahs]
  )
  const alreadyFinished = open !== null && finishedSet.has(open)

  /* The bookmarked surah's name, in the reader's language like every other one. */
  const bookmarked = progress ? surahByNumber(progress.lastSurah) : undefined
  const continueName = bookmarked ? surahName(bookmarked, locale) : ''

  /*
    Fixed-size chunks rather than one giant list.

    20 keeps even Al-Baqara (286 ayahs, 15 pages) to a screen or two per page,
    which is roughly a sitting — and it means leaving the page and coming back
    lands you in the same chunk rather than somewhere in a 3,000-element scroll.
  */
  const pageCount = ayahs ? Math.max(1, Math.ceil(ayahs.length / PER_PAGE)) : 1
  const pageAyahs = useMemo(
    () => (ayahs ? ayahs.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE) : []),
    [ayahs, page]
  )

  /** The distinct mushaf pages this chunk covers -- what counts as read. */
  const pagesOnScreen = useMemo(
    () => [...new Set(pageAyahs.map((a) => a.page))],
    [pageAyahs]
  )

  const arabicSize = ARABIC_SIZES[sizeIndex]

  /** Saved verses in the surah being read, in order, for the jump strip. */
  const savedHere = useMemo(
    () => (open === null ? [] : saved.filter((v) => v.surah === open).sort((a, b) => a.ayah - b.ayah)),
    [saved, open]
  )


  return (
    <div data-accent="quran" className="accent-canvas min-h-screen space-y-4 p-4 sm:space-y-6 sm:p-6">
      <PhaseHeader
        accent="quran"
        icon={BookOpen}
        title={t('nav.quran')}
        subtitle={t('ui.quranSubtitle')}
      >
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <HeaderStat
            label={t('ui.quranProgress')}
            value={`${progress?.percent ?? 0}%`}
            /* The count, not just the percent: "2%" alone tells you nothing about
               whether the number is even measuring the right thing. */
            hint={`${progress?.pagesRead ?? 0} ${t('ui.quranOfPages', { pages: QURAN_PAGES })}`}
          />
          <HeaderStat
            label={t('ui.currentStreak')}
            value={progress?.streak ?? 0}
            hint={t('ui.days')}
            icon={Flame}
          />
          <HeaderStat
            label={t('ui.quranSurahsDone')}
            value={`${progress?.finishedCount ?? 0}/114`}
            icon={CheckCircle2}
          />
          <HeaderStat
            label={t('ui.quranThisWeek')}
            value={progress?.pagesThisWeek ?? 0}
            hint={t('ui.quranSittings')}
          />
        </div>
      </PhaseHeader>

      {open === null ? (
        <>
          {/* Continue where they stopped — the reason this page has a server at all. */}
          {progress?.hasPosition && (
            <button
              onClick={() => openSurah(progress.lastSurah, progress.lastAyah)}
              className="accent-border flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-4 text-left transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <span className="accent-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                <BookmarkCheck className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="accent-ink block text-xs font-semibold uppercase tracking-wider">
                  {t('ui.quranContinue')}
                </span>
                <span className="block truncate font-bold text-slate-900 dark:text-white">
                  {continueName} · {t('ui.quranAyah', { n: progress.lastAyah })}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            </button>
          )}


          {/*
            Saved verses.

            The other half of the fix. The per-ayah button had no list behind it,
            so even when it did write something there was nowhere to see it and
            no way back. Newest first, capped -- this is a shortcut, not an
            archive page, and twenty rows of chips would bury the surah list.
          */}
          {saved.length > 0 && (
            <section
              aria-label={t('ui.quranSavedVerses')}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <BookmarkCheck className="accent-ink h-4 w-4" />
                  {t('ui.quranSavedVerses')}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t('ui.quranSavedCount', { count: saved.length })}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {saved.slice(0, SAVED_SHOWN).map((v) => {
                  const s = surahByNumber(v.surah)
                  return (
                    <span
                      key={verseKey(v.surah, v.ayah)}
                      className="accent-border inline-flex items-center overflow-hidden rounded-xl border-2"
                    >
                      <button
                        onClick={() => openSurah(v.surah, v.ayah)}
                        className="h-10 px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {s ? surahName(s, locale) : v.surah}{' '}
                        <span className="tabular-nums opacity-70">{v.ayah}</span>
                      </button>
                      {/* Removable from here too: the verse you want gone is not
                          always the one you are looking at. */}
                      <button
                        onClick={() => toggleVerse(v.surah, v.ayah, v.page)}
                        disabled={savingVerse === verseKey(v.surah, v.ayah)}
                        aria-label={t('ui.quranUnsaveVerse')}
                        title={t('ui.quranUnsaveVerse')}
                        className="flex h-10 w-9 items-center justify-center text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  )
                })}
              </div>
            </section>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('ui.quranSearch')}
              aria-label={t('ui.quranSearch')}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none ring-emerald-500/40 focus:ring-2 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* The list. All 114 are bundled, so this renders without a request. */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <SurahRow
                key={s.n}
                surah={s}
                name={surahName(s, locale)}
                meaning={surahMeaning(s, locale)}
                isFinished={finishedSet.has(s.n)}
                isBookmark={progress?.lastSurah === s.n && progress.hasPosition}
                onOpen={() => openSurah(s.n)}
                placeLabel={t(s.place === 'makkah' ? 'ui.quranMakkah' : 'ui.quranMadinah')}
                ayahLabel={t('ui.quranAyahs', { count: s.ayahs })}
              />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                {t('ui.quranNoMatch')}
              </p>
            )}
          </div>
        </>
      ) : (
        <div ref={readerRef} className="scroll-mt-24 space-y-4">
          {/*
            One header row that names the surah and carries the reading controls.

            The name led on the RIGHT before, tucked beside the toggle, which put
            the least important control and the most important label in the same
            visual slot. The surah you are reading is the heading of this screen.
          */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setOpen(null)
                  setAyahs(null)
                }}
                aria-label={t('ui.quranAllSurahs')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold leading-tight text-slate-900 dark:text-white">
                  {current ? surahName(current, locale) : ''}
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {current ? surahMeaning(current, locale) : ''}
                  {current ? ` \u00b7 ${t('ui.quranAyahs', { count: current.ayahs })}` : ''}
                </p>
              </div>

              <span
                dir="rtl"
                lang="ar"
                className="hidden shrink-0 text-xl text-slate-700 dark:text-slate-200 sm:block"
                style={{ fontFamily: 'var(--font-amiri), serif' }}
              >
                {current?.ar}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              {/* Arabic alone for reciting, both for studying. Remembered. */}
              <button
                onClick={toggleTranslation}
                aria-pressed={showTranslation}
                className={`inline-flex h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors ${
                  showTranslation
                    ? 'accent-border accent-ink'
                    : 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <Languages className="h-4 w-4" />
                {t('ui.quranTranslation')}
              </button>

              {/*
                Arabic size.

                One fixed size suits one pair of eyes. This is the control people
                reach for most in any Quran app and the page had none at all --
                the size was hardcoded at 26px, and 30px above `sm`.
              */}
              <div className="inline-flex h-11 items-center rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => stepSize(-1)}
                  disabled={sizeIndex === 0}
                  aria-label={t('ui.quranTextSmaller')}
                  title={t('ui.quranTextSmaller')}
                  className="flex h-full w-11 items-center justify-center rounded-l-xl text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <Type className="h-4 w-4 shrink-0 text-slate-400" />
                <button
                  onClick={() => stepSize(1)}
                  disabled={sizeIndex === ARABIC_SIZES.length - 1}
                  aria-label={t('ui.quranTextLarger')}
                  title={t('ui.quranTextLarger')}
                  className="flex h-full w-11 items-center justify-center rounded-r-xl text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {pageCount > 1 && (
                <span className="ml-auto shrink-0 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                  {t('ui.quranPageOf', { page: page + 1, total: pageCount })}
                </span>
              )}
            </div>

            {/*
              Verses saved inside this surah, as a jump strip.

              A saved verse that you cannot get back to quickly is a note in a
              drawer. Only rendered when there is something in it.
            */}
            {savedHere.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                <BookmarkCheck className="accent-ink h-4 w-4 shrink-0" />
                {savedHere.map((v) => (
                  <button
                    key={v.ayah}
                    onClick={() => jumpToAyah(v.ayah)}
                    className="accent-soft accent-ink h-8 min-w-8 rounded-lg px-2 text-xs font-bold tabular-nums transition-opacity hover:opacity-80"
                  >
                    {v.ayah}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loadingSurah || !ayahs ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="accent-ink h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                {pageAyahs.map((a) => {
                  const key = verseKey(open, a.n)
                  const isSaved = savedSet.has(key)
                  const isPosition =
                    progress?.lastSurah === open && progress.lastAyah === a.n
                  return (
                    <div
                      key={a.n}
                      id={`ayah-${a.n}`}
                      /*
                        Saved and "where you stopped" are different things, shown
                        differently: a saved verse keeps a standing accent border,
                        the reading position gets a soft tint that moves.
                      */
                      className={`scroll-mt-24 rounded-2xl border bg-white p-4 transition-colors dark:bg-slate-900 sm:p-5 ${
                        isSaved
                          ? 'accent-border border-2'
                          : 'border-slate-200 dark:border-slate-800'
                      } ${isPosition ? 'accent-soft' : ''}`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {/* The ayah number in a ring rather than a filled chip,
                              closer to how a mushaf marks the end of a verse. */}
                          <span className="accent-ring accent-ink inline-flex h-8 min-w-8 items-center justify-center rounded-full border-2 px-2 text-xs font-bold tabular-nums">
                            {a.n}
                          </span>

                          {isPosition && (
                            <span className="accent-ink truncate text-[11px] font-bold uppercase tracking-wide">
                              {t('ui.quranYouStoppedHere')}
                            </span>
                          )}

                          {/*
                            Sajda. The data carried this flag from the first
                            release and nothing ever rendered it, so someone
                            reciting from this page had no way to know a
                            prostration was due -- the one thing a mushaf would
                            never leave out.
                          */}
                          {a.sajda && (
                            <span
                              title={t('ui.quranSajdaNote')}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                            >
                              {t('ui.quranSajda')}
                            </span>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            onClick={() => copyVerse(current, a)}
                            aria-label={t('ui.quranCopyVerse')}
                            title={t('ui.quranCopyVerse')}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Copy className="h-[18px] w-[18px]" />
                          </button>

                          {/*
                            The button that started all this. It used to write to
                            the reading POSITION, so it replaced the previous mark
                            and changed nothing anyone could see. It toggles a
                            saved verse now, and says so in the icon, the fill and
                            the pressed state.
                          */}
                          <button
                            onClick={() => toggleVerse(open, a.n, a.page)}
                            disabled={savingVerse === key}
                            aria-pressed={isSaved}
                            aria-label={t(isSaved ? 'ui.quranUnsaveVerse' : 'ui.quranSaveVerse')}
                            title={t(isSaved ? 'ui.quranUnsaveVerse' : 'ui.quranSaveVerse')}
                            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                              isSaved
                                ? 'accent-solid'
                                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            {savingVerse === key ? (
                              <Loader2 className="h-[18px] w-[18px] animate-spin" />
                            ) : isSaved ? (
                              <BookmarkCheck className="h-[18px] w-[18px]" />
                            ) : (
                              <Bookmark className="h-[18px] w-[18px]" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/*
                        Arabic is set right-to-left with loose leading -- the
                        diacritics need the room, and a Quran rendered at body
                        size is not a Quran anyone reads twice. The size is the
                        reader's own choice; see ARABIC_SIZES.
                        `--font-amiri` is already loaded in the app.
                      */}
                      <p
                        dir="rtl"
                        lang="ar"
                        className="text-right text-slate-900 dark:text-white"
                        style={{
                          fontFamily: 'var(--font-amiri), serif',
                          fontSize: `${arabicSize}px`,
                          lineHeight: 2.1,
                        }}
                      >
                        {a.ar}
                      </p>

                      {showTranslation && a.tr && (
                        <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
                          {a.tr}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Pager. Only when there is more than one chunk — a pager on
                  Al-Fatiha would be noise. */}
              {pageCount > 1 && (
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      setPage((p) => Math.max(0, p - 1))
                    }}
                    disabled={page === 0}
                    className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('common.previous')}
                  </button>

                  <p className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                    {t('ui.quranPageOf', { page: page + 1, total: pageCount })}
                  </p>

                  <button
                    onClick={() => {
                      /*
                        Moving on is also a reading event: it saves the position
                        at the last ayah just read, so leaving mid-surah keeps
                        your place without a separate deliberate action.
                      */
                      const last = pageAyahs[pageAyahs.length - 1]
                      // No toast: a confirmation on every page turn is noise.
                      if (last) savePosition(open, last.n, last.page, { pages: pagesOnScreen })
                      setPage((p) => Math.min(pageCount - 1, p + 1))
                    }}
                    disabled={page >= pageCount - 1}
                    className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {t('common.next')}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Finishing is only offered on the last chunk — on page 3 of 15
                  it would be a lie. */}
              {page >= pageCount - 1 && (
                <button
                  onClick={async () => {
                    const last = ayahs[ayahs.length - 1]
                    const ok = await savePosition(open, last.n, last.page, {
                      finished: true,
                      pages: pagesOnScreen,
                    })
                    if (!ok) return
                    /*
                      Three consequences, where before there were none: the surah
                      is recorded as finished, the confirmation names it, and the
                      reader returns to the list where the tick is now visible and
                      the next surah is one tap away. "Nothing happened" was the
                      whole complaint.
                    */
                    toast.success(
                      t('ui.quranFinishedToast', {
                        surah: current ? surahName(current, locale) : '',
                      })
                    )
                    setOpen(null)
                    setAyahs(null)
                  }}
                  className="accent-solid h-14 w-full rounded-2xl text-base font-bold shadow-lg"
                >
                  {alreadyFinished ? t('ui.quranReadAgain') : t('ui.quranFinished')}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SurahRow({
  surah,
  name,
  meaning,
  isFinished,
  isBookmark,
  onOpen,
  placeLabel,
  ayahLabel,
}: {
  surah: Surah
  /* Resolved by the caller, which has the locale — the row renders, it does not
     decide what language anything is in. */
  name: string
  meaning: string
  isFinished: boolean
  isBookmark: boolean
  onOpen: () => void
  placeLabel: string
  ayahLabel: string
}) {
  return (
    <motion.button
      onClick={onOpen}
      whileTap={{ scale: 0.995 }}
      className={`flex items-center gap-3 rounded-2xl border-2 bg-white p-3.5 text-left transition-colors dark:bg-slate-900 ${
        isBookmark
          ? 'accent-border'
          : 'border-slate-200 hover:accent-border dark:border-slate-800'
      }`}
    >
      {/* The number becomes a tick once finished — same slot, so the row does not
          reflow, and the state is legible without reading any text. */}
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums ${
          isFinished ? 'bg-emerald-600 text-white' : 'accent-soft'
        }`}
      >
        {isFinished ? <CheckCircle2 className="h-5 w-5" /> : surah.n}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-slate-900 dark:text-white">
          {name}
        </span>
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
          {meaning} · {ayahLabel} · {placeLabel}
        </span>
      </span>
      <span
        dir="rtl"
        lang="ar"
        className="shrink-0 text-lg text-slate-700 dark:text-slate-200"
        style={{ fontFamily: 'var(--font-amiri), serif' }}
      >
        {surah.ar}
      </span>
    </motion.button>
  )
}
