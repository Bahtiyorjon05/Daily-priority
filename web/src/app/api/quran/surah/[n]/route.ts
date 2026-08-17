import { NextRequest, NextResponse } from 'next/server'
import { surahByNumber } from '@/lib/quran/surahs'

/**
 * A surah's text: Arabic, plus a translation in the reader's language.
 *
 * Proxied rather than fetched from the browser for the same reason prayer times
 * are — but with one difference that matters: the Quran does not change. So this
 * caches for a year at the edge, and after the first request per surah the
 * external API stops being on anyone's critical path. The prayer-times
 * dependency is a live one; this one should not be.
 *
 * `force-cache` with a long revalidate rather than `no-store`: a reading page
 * that waits on a third party every time someone scrolls to the next surah is
 * the worst possible place for a spinner.
 */

const ARABIC = 'quran-uthmani'

/** Translations, by app locale. Only uz.sodik exists for Uzbek on this source. */
const TRANSLATION: Record<string, string> = {
  uz: 'uz.sodik', // Muhammad Sodik Muhammad Yusuf
  en: 'en.sahih', // Saheeh International
}

/** A year. The text is fixed; only our formatting of it could change. */
const REVALIDATE = 31_536_000

type Ayah = {
  numberInSurah: number
  text: string
  page: number
  juz: number
  sajda: unknown
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ n: string }> }
) {
  try {
    const { n } = await params
    const number = Number(n)

    // Validated against the bundled list, so a bad number fails here rather than
    // becoming a request to a third party.
    const surah = surahByNumber(number)
    if (!surah) {
      return NextResponse.json({ error: 'No such surah' }, { status: 404 })
    }

    const locale = request.nextUrl.searchParams.get('locale') ?? 'en'
    const translation = TRANSLATION[locale] ?? TRANSLATION.en

    const res = await fetch(
      `https://api.alquran.cloud/v1/surah/${number}/editions/${ARABIC},${translation}`,
      { next: { revalidate: REVALIDATE } }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Could not load the surah right now' },
        { status: 502 }
      )
    }

    const json = await res.json()
    const editions: { edition: { identifier: string }; ayahs: Ayah[] }[] = json?.data ?? []

    const arabic = editions.find((e) => e.edition.identifier === ARABIC)
    const translated = editions.find((e) => e.edition.identifier === translation)

    if (!arabic?.ayahs?.length) {
      return NextResponse.json({ error: 'Unexpected response' }, { status: 502 })
    }

    const ayahs = arabic.ayahs.map((a, i) => ({
      n: a.numberInSurah,
      // The source prefixes the first ayah with a byte-order mark, which renders
      // as a stray glyph before the basmala.
      ar: a.text.replace(/^﻿/, ''),
      tr: translated?.ayahs?.[i]?.text ?? '',
      page: a.page,
      juz: a.juz,
      sajda: Boolean(a.sajda),
    }))

    return NextResponse.json(
      {
        success: true,
        surah: { ...surah },
        translationEdition: translation,
        ayahs,
      },
      {
        // Also let the browser and the CDN hold it: the same surah is re-read
        // more than any other page in this app.
        headers: {
          'Cache-Control': `public, max-age=86400, s-maxage=${REVALIDATE}, stale-while-revalidate=86400`,
        },
      }
    )
  } catch (error) {
    console.error('[quran] surah fetch failed', error)
    return NextResponse.json({ error: 'Could not load the surah' }, { status: 500 })
  }
}
