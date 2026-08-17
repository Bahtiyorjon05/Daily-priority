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
 *   pagesRead  how far through the mushaf, monotonic so re-reading a surah or
 *              jumping to Yaseen on a Friday never makes progress go backwards
 *   streak     consecutive days with any reading at all, which is a question
 *              about days and cannot be derived from a bookmark
 */

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

    const [progress, logs] = await Promise.all([
      prisma.quranProgress.findUnique({
        where: { userId },
        select: { lastSurah: true, lastAyah: true, lastPage: true, pagesRead: true, updatedAt: true },
      }),
      prisma.quranReadingLog.findMany({
        where: { userId, date: { gte: new Date(Date.now() - STREAK_WINDOW_DAYS * 86_400_000) } },
        select: { date: true, pages: true },
        orderBy: { date: 'desc' },
      }),
    ])

    const todayKey = startOfDay().getTime()
    const pagesRead = progress?.pagesRead ?? 0

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

    const existing = await prisma.quranProgress.findUnique({
      where: { userId },
      select: { pagesRead: true },
    })

    /*
      pagesRead only ever climbs. It is "how far through the mushaf have you
      been", not "which page are you on" — so re-reading Al-Fatiha or opening
      Yaseen for a Friday must not undo months of progress.
    */
    const pagesRead = Math.max(existing?.pagesRead ?? 0, page)

    const today = startOfDay()

    const [progress] = await prisma.$transaction([
      prisma.quranProgress.upsert({
        where: { userId },
        create: { userId, lastSurah: surahNumber, lastAyah: ayah, lastPage: page, pagesRead },
        update: { lastSurah: surahNumber, lastAyah: ayah, lastPage: page, pagesRead },
        select: { lastSurah: true, lastAyah: true, lastPage: true, pagesRead: true },
      }),
      // One row per day. Re-reading later the same day increments the count
      // rather than creating a second row and inflating the streak.
      prisma.quranReadingLog.upsert({
        where: { userId_date: { userId, date: today } },
        create: { userId, date: today, pages: 1 },
        update: { pages: { increment: 1 } },
      }),
    ])

    return NextResponse.json({ success: true, data: progress })
  } catch (error) {
    console.error('[quran] progress write failed', error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
