import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QURAN_PAGES, surahByNumber } from '@/lib/quran/surahs'

/**
 * Reading position, total progress, and the streak.
 *
 * Three separate ideas, deliberately not collapsed into one number:
 *
 *   bookmark   where to reopen — the thing that makes coming back free
 *   pagesRead  how many DISTINCT mushaf pages have been read, counted from rows
 *   streak     consecutive days with any reading at all, which is a question
 *              about days and cannot be derived from a bookmark
 *
 * `pagesRead` used to be `max(page)`, which is not a count of anything.
 * Opening An-Nas once is page 604 of 604, so it reported the entire Quran as
 * read -- a live account showed 100% having read almost none of it. Rows are
 * counted now: a progress bar that cannot go wrong in the reader's favour is
 * worth more than one that flatters.
 */

/** A chunk is 20 ayahs, which cannot span more than a handful of mushaf pages;
 *  anything beyond this is a client bug or an attack, not a reading session. */
const MAX_PAGES_PER_WRITE = 40

/** Enough history to show a 90-day streak without reading the whole table. */
const STREAK_WINDOW_DAYS = 400

/** Midnight, so one row per calendar day regardless of when they read. */
function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Consecutive days ending today or yesterday.
 *
 * Yesterday counts as alive: someone who read last night and opens the app in
 * the morning has not broken anything, and telling them they have is both wrong
 * and the fastest way to make them stop.
 */
function streakFrom(dates: Date[]): number {
  if (dates.length === 0) return 0

  const days = new Set(dates.map((d) => startOfDay(d).getTime()))
  const today = startOfDay().getTime()
  const DAY = 86_400_000

  let cursor = days.has(today) ? today : today - DAY
  if (!days.has(cursor)) return 0

  let streak = 0
  while (days.has(cursor)) {
    streak++
    cursor -= DAY
  }
  return streak
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const [progress, logs, finished, pagesRead] = await Promise.all([
      prisma.quranProgress.findUnique({
        where: { userId },
        select: { lastSurah: true, lastAyah: true, lastPage: true, pagesRead: true, updatedAt: true },
      }),
      prisma.quranReadingLog.findMany({
        where: { userId, date: { gte: new Date(Date.now() - STREAK_WINDOW_DAYS * 86_400_000) } },
        select: { date: true, pages: true },
        orderBy: { date: 'desc' },
      }),
      prisma.quranSurahRead.findMany({
        where: { userId },
        select: { surah: true },
        orderBy: { surah: 'asc' },
      }),
      // Counted, not maximised. See the note at the top of this file.
      prisma.quranPageRead.count({ where: { userId } }),
    ])

    const todayKey = startOfDay().getTime()

    return NextResponse.json({
      success: true,
      data: {
        lastSurah: progress?.lastSurah ?? 1,
        lastAyah: progress?.lastAyah ?? 1,
        lastPage: progress?.lastPage ?? 1,
        pagesRead,
        // Out of the whole mushaf, so the number means something.
        percent: Math.min(100, Math.round((pagesRead / QURAN_PAGES) * 100)),
        streak: streakFrom(logs.map((l) => l.date)),
        readToday: logs.some((l) => startOfDay(l.date).getTime() === todayKey),
        pagesThisWeek: logs
          .filter((l) => l.date.getTime() >= Date.now() - 7 * 86_400_000)
          .reduce((n, l) => n + l.pages, 0),
        lastReadAt: progress?.updatedAt ?? null,
        // Where to reopen. Not progress, and never again counted as it.
        hasPosition: Boolean(progress),
        /*
          Which surahs are finished, and how many. This is what makes the button
          mean something: `pagesRead` is a maximum, so finishing a short surah
          after a long one moved no number at all.
        */
        finishedSurahs: finished.map((f) => f.surah),
        finishedCount: finished.length,
      },
    })
  } catch (error) {
    console.error('[quran] progress read failed', error)
    return NextResponse.json({ error: 'Failed to load progress' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await request.json().catch(() => ({}))
    const surahNumber = Math.trunc(Number(body.surah))
    const ayah = Math.trunc(Number(body.ayah))
    const page = Math.trunc(Number(body.page))

    const surah = surahByNumber(surahNumber)
    if (!surah) {
      return NextResponse.json({ error: 'No such surah' }, { status: 400 })
    }
    // Bounded by the bundled ayah counts, so a bad client cannot store a
    // bookmark that will never resolve to anything on reopen.
    if (!Number.isFinite(ayah) || ayah < 1 || ayah > surah.ayahs) {
      return NextResponse.json({ error: 'Ayah out of range' }, { status: 400 })
    }
    if (!Number.isFinite(page) || page < 1 || page > QURAN_PAGES) {
      return NextResponse.json({ error: 'Page out of range' }, { status: 400 })
    }

    /*
      Which mushaf pages this sitting actually covered.

      The client sends the pages spanned by the chunk on screen, because that is
      the only place that knows them -- the ayah/page mapping comes down with the
      text. Bounded and de-duplicated here regardless: this is a write loop, and
      a client that sent 5,000 numbers would create 5,000 rows.
    */
    const covered: unknown[] = Array.isArray(body.pages) ? body.pages : [page]
    const pagesCovered: number[] = [
      ...new Set(
        covered
          .map((p: unknown) => Math.trunc(Number(p)))
          .filter((p: number) => Number.isFinite(p) && p >= 1 && p <= QURAN_PAGES)
      ),
    ].slice(0, MAX_PAGES_PER_WRITE)
    if (!pagesCovered.includes(page)) pagesCovered.push(page)

    const today = startOfDay()
    // Only when the reader says so — turning a page saves position without
    // claiming the surah is done.
    const finished = body.finished === true

    const [progress] = await prisma.$transaction([
      prisma.quranProgress.upsert({
        where: { userId },
        create: { userId, lastSurah: surahNumber, lastAyah: ayah, lastPage: page },
        update: { lastSurah: surahNumber, lastAyah: ayah, lastPage: page },
        select: { lastSurah: true, lastAyah: true, lastPage: true },
      }),
      /*
        One row per page, ever. `createMany` with `skipDuplicates` rather than an
        upsert loop: re-reading a page is the normal case, not an error, and it
        must not turn one page turn into twenty round trips.
      */
      prisma.quranPageRead.createMany({
        data: pagesCovered.map((p) => ({ userId, page: p })),
        skipDuplicates: true,
      }),
      // One row per day. Re-reading later the same day increments the count
      // rather than creating a second row and inflating the streak.
      prisma.quranReadingLog.upsert({
        where: { userId_date: { userId, date: today } },
        create: { userId, date: today, pages: 1 },
        update: { pages: { increment: 1 } },
      }),
      // Upsert rather than create: re-reading a surah refreshes the date instead
      // of failing on the unique index.
      ...(finished
        ? [
            prisma.quranSurahRead.upsert({
              where: { userId_surah: { userId, surah: surahNumber } },
              create: { userId, surah: surahNumber },
              update: { completedAt: new Date() },
            }),
          ]
        : []),
    ])

    // Counted after the write, so the client can show the new total without a
    // second request.
    const pagesRead = await prisma.quranPageRead.count({ where: { userId } })

    return NextResponse.json({
      success: true,
      data: { ...progress, pagesRead },
      finished,
    })
  } catch (error) {
    console.error('[quran] progress write failed', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
