'use client'

import { useMemo } from 'react'
import { useT } from '@/lib/i18n/client'
import { getDailyInspiration } from '@/lib/islamic-inspiration'

/**
 * The verse shown on the dashboard.
 *
 * Previously fetched from /api/quotes/daily, backed by the `IslamicQuote`
 * table. That content is English-only and unreferenced, so it could not follow
 * the language switch and there was no way to check a citation. The local set
 * in `islamic-inspiration.ts` carries both languages, the Arabic source text
 * and a surah/collection reference, so it is used directly — which also drops
 * a network round-trip from the dashboard's first paint.
 *
 * The pick is deterministic by day, so everyone sees the same verse and it
 * doesn't change as you navigate between pages.
 */

interface DailyQuote {
  id: string
  text: string
  author: string
  source: string | null
  category: string | null
  arabic?: string | null
}

export function useDailyQuote() {
  const { t, locale } = useT()

  const quote = useMemo<DailyQuote>(() => {
    const pick = getDailyInspiration()
    return {
      id: pick.id,
      text: t(pick.textKey),
      // The attribution reads as the reference itself; the Arabic is shown
      // separately where there's room for it.
      author: pick.reference,
      source: pick.source,
      category: pick.type,
      arabic: pick.arabic,
    }
    // `locale` is the dependency that matters — the key is stable, the
    // rendered string is not.
  }, [t, locale])

  return {
    quote,
    loading: false,
    error: null as string | null,
    refetch: () => {},
  }
}
