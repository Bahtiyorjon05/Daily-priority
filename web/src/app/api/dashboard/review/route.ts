import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { streakFromDates, streakAtRisk, startOfDay } from '@/lib/streaks'

/**
 * The week so far, and the streaks — the same picture the weekly email sends.
 *
 * One endpoint and one parallel batch. The dashboard already fetches tasks
 * separately and this must not become a second waterfall on the slowest screen in
 * the app; everything here is counted in the database rather than by downloading
 * rows and totalling them in the browser.
 *
 * Streaks all come from `streakFromDates`, so "days in a row" means the same
 * thing on this card as it does on the Qur'an page and in the email.
 */

const DAY_MS = 86_400_000

/** Enough history for a long streak without reading the whole table. */
const STREAK_WINDOW_DAYS = 400

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const now = new Date()
    // Last 7 days including today, from midnight — not "168 hours ago", which
    // would cut a day in half and make the numbers disagree with the labels.
    const weekStart = startOfDay(new Date(now.getTime() - 6 * DAY_MS))
    const streakSince = new Date(now.getTime() - STREAK_WINDOW_DAYS * DAY_MS)

    const [
      tasksDone,
      tasksMade,
      habitCheckIns,
      habitCount,
      topHabit,
      focus,
      journalWeek,
      goalsTotal,
      goalsDone,
      prayersWeek,
      prayersOnTime,
      // Date-only reads, for the streaks.
      taskDates,
      prayerDates,
      quranDates,
      habitDates,
    ] = await Promise.all([
      prisma.task.count({ where: { userId, status: 'COMPLETED', updatedAt: { gte: weekStart } } }),
      prisma.task.count({ where: { userId, createdAt: { gte: weekStart } } }),
      prisma.habitCompletion.count({ where: { habit: { userId }, date: { gte: weekStart } } }),
      prisma.habit.count({ where: { userId } }),
      prisma.habit.findFirst({
        where: { userId },
        select: { title: true, streak: true },
        orderBy: { streak: 'desc' },
      }),
      prisma.focusSession.aggregate({
        where: { userId, date: { gte: weekStart } },
        _sum: { duration: true },
        _count: { _all: true },
      }),
      prisma.journalEntry.count({ where: { userId, date: { gte: weekStart } } }),
      prisma.goal.count({ where: { userId } }),
      prisma.goal.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.prayerTracking.count({
        where: { userId, date: { gte: weekStart }, completedAt: { not: null } },
      }),
      prisma.prayerTracking.count({
        where: { userId, date: { gte: weekStart }, completedAt: { not: null }, onTime: true },
      }),
      prisma.task.findMany({
        where: { userId, status: 'COMPLETED', completedAt: { gte: streakSince, not: null } },
        select: { completedAt: true },
      }),
      prisma.prayerTracking.findMany({
        where: { userId, date: { gte: streakSince }, completedAt: { not: null } },
        select: { date: true },
      }),
      prisma.quranReadingLog.findMany({
        where: { userId, date: { gte: streakSince } },
        select: { date: true },
      }),
      prisma.habitCompletion.findMany({
        where: { habit: { userId }, date: { gte: streakSince } },
        select: { date: true },
      }),
    ])

    const prayerDays = prayerDates.map((p) => p.date)
    const taskDays = taskDates.map((t) => t.completedAt!).filter(Boolean)
    const quranDays = quranDates.map((q) => q.date)
    const habitDays = habitDates.map((h) => h.date)

    const minutes = focus._sum.duration || 0

    return NextResponse.json({
      success: true,
      data: {
        week: {
          // Inclusive of both ends, so "7 days" is seven days.
          from: weekStart.toISOString(),
          to: now.toISOString(),
          tasksDone,
          tasksMade,
          habitCheckIns,
          habitCount,
          focusMinutes: minutes,
          focusSessions: focus._count._all,
          journal: journalWeek,
          goalsDone,
          goalsTotal,
          prayers: prayersWeek,
          prayersOnTime,
          onTimeRate: prayersWeek > 0 ? Math.round((prayersOnTime / prayersWeek) * 100) : 0,
        },
        streaks: {
          prayers: streakFromDates(prayerDays, now),
          tasks: streakFromDates(taskDays, now),
          quran: streakFromDates(quranDays, now),
          habits: streakFromDates(habitDays, now),
        },
        /*
          Which streaks are alive but have nothing today. This is the one moment a
          nudge is genuinely useful — and the only thing on this card that asks
          for anything.
        */
        atRisk: {
          prayers: streakAtRisk(prayerDays, now),
          tasks: streakAtRisk(taskDays, now),
          quran: streakAtRisk(quranDays, now),
          habits: streakAtRisk(habitDays, now),
        },
        topHabit: topHabit && topHabit.streak > 0 ? topHabit : null,
        /*
          Whether anything happened at all. A card full of zeroes is worse than no
          card, so the client shows an invitation instead — which is the actual
          state of most new accounts.
        */
        anyActivity:
          tasksDone + tasksMade + habitCheckIns + focus._count._all + journalWeek + prayersWeek > 0,
      },
    })
  } catch (error) {
    console.error('[dashboard/review] failed', error)
    return NextResponse.json({ error: 'Failed to load your week' }, { status: 500 })
  }
}
