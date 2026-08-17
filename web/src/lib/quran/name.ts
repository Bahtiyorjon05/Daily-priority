import type { Surah } from '@/lib/quran/surahs'
import { SURAH_NAMES_UZ } from '@/lib/quran/names-uz'

/**
 * A surah's name and meaning in the reader's language.
 *
 * One place, so a surah cannot be Uzbek in the list and English in the reader
 * header — which is exactly what happened when each surface reached into
 * `surah.en` on its own.
 *
 * English falls back to the generated data rather than duplicating it, and an
 * unknown locale falls back to English: a name in the wrong language still names
 * the surah, whereas an empty string does not.
 */

export function surahName(surah: Surah, locale: string): string {
  if (locale === 'uz') return SURAH_NAMES_UZ[surah.n]?.uz ?? surah.en
  return surah.en
}

export function surahMeaning(surah: Surah, locale: string): string {
  if (locale === 'uz') return SURAH_NAMES_UZ[surah.n]?.meaning ?? surah.meaning
  return surah.meaning
}

/**
 * Every string this surah can be found by, lowercased.
 *
 * Search matches across BOTH languages on purpose. Someone reading in Uzbek may
 * still type "Baqarah" from memory, or paste a name from elsewhere, and a search
 * box that knows the surah exists but refuses to find it under the name you typed
 * is worse than no search at all. The number is included because "36" is how most
 * people look for Yasin.
 */
export function surahSearchTerms(surah: Surah): string[] {
  const uz = SURAH_NAMES_UZ[surah.n]
  return [
    String(surah.n),
    surah.en,
    surah.meaning,
    surah.ar,
    uz?.uz ?? '',
    uz?.meaning ?? '',
  ]
    .filter(Boolean)
    .map((s) => s.toLowerCase())
}
