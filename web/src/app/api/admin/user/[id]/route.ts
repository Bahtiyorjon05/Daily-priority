import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decryptPassword } from '@/lib/password-vault'

export const dynamic = 'force-dynamic'

/** Full drill-down for one user: profile, decrypted password, and their records. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const taskStatus = searchParams.get('taskStatus') || 'all'

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        location: true,
        timezone: true,
        twoFactorEnabled: true,
        mustResetPassword: true,
        password: true,
        passwordEnc: true,
        // Closure state. Without these the detail panel showed a closed account
        // as if it were a normal active one — the list card carried a badge, but
        // opening the record said nothing at all.
        deletedAt: true,
        deletionReason: true,
        deletedEmail: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const taskWhere: Record<string, unknown> = { userId: id }
    if (taskStatus !== 'all') taskWhere.status = taskStatus

    const [
      tasks,
      habits,
      goals,
      journal,
      prayer,
      focus,
      calendar,
      adhkar,
      focusAgg,
      prayerOnTime,
      counts,
    ] = await Promise.all([
      prisma.task.findMany({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: taskWhere as any,
        select: { id: true, title: true, status: true, priority: true, dueDate: true, completedAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.habit.findMany({
        where: { userId: id },
        select: { id: true, title: true, frequency: true, streak: true, longestStreak: true, targetDays: true, _count: { select: { completions: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.goal.findMany({
        where: { userId: id },
        select: { id: true, title: true, category: true, goalType: true, progress: true, target: true, completed: true, status: true, deadline: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.journalEntry.findMany({
        where: { userId: id },
        select: { id: true, date: true, mood: true, reflection: true, gratitude1: true, createdAt: true },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      prisma.prayerTracking.findMany({
        where: { userId: id },
        select: { id: true, date: true, prayerName: true, onTime: true, completedAt: true },
        orderBy: { date: 'desc' },
        take: 100,
      }),
      prisma.focusSession.findMany({
        where: { userId: id },
        select: { id: true, duration: true, taskTitle: true, sessionType: true, completed: true, date: true },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      prisma.calendarEvent.findMany({
        where: { userId: id },
        select: { id: true, title: true, date: true, eventType: true },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      prisma.adhkarProgress.findMany({
        where: { userId: id },
        select: { id: true, adhkarName: true, category: true, count: true, target: true, completed: true, date: true },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      prisma.focusSession.aggregate({ where: { userId: id }, _sum: { duration: true }, _count: { _all: true } }),
      prisma.prayerTracking.count({ where: { userId: id, onTime: true } }),
      prisma.$transaction([
        prisma.task.count({ where: { userId: id } }),
        prisma.task.count({ where: { userId: id, status: 'COMPLETED' } }),
        prisma.habit.count({ where: { userId: id } }),
        prisma.goal.count({ where: { userId: id } }),
        prisma.journalEntry.count({ where: { userId: id } }),
        prisma.prayerTracking.count({ where: { userId: id } }),
      ]),
    ])

    const [tasksTotal, tasksCompleted, habitsTotal, goalsTotal, journalTotal, prayerTotal] = counts

    return NextResponse.json({
      user: {
        id: user.id,
        // `email` is a tombstone once the address has been handed back to a new
        // sign-up, so the real one has to come from `deletedEmail`.
        email: user.deletedEmail ?? user.email,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
        deleted: user.deletedAt != null,
        deletedAt: user.deletedAt?.toISOString() ?? null,
        deletionReason: user.deletionReason,
        // Set only when the address was released, i.e. the person signed up
        // again — worth distinguishing from a plain closure.
        addressReleased: user.deletedEmail != null,
        emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
        location: user.location,
        timezone: user.timezone,
        twoFactorEnabled: user.twoFactorEnabled,
        mustResetPassword: user.mustResetPassword,
        hasPassword: user.password != null,
        password: decryptPassword(user.passwordEnc),
      },
      stats: {
        tasksTotal,
        tasksCompleted,
        completionRate: tasksTotal ? Math.round((tasksCompleted / tasksTotal) * 100) : 0,
        habitsTotal,
        goalsTotal,
        journalTotal,
        prayerTotal,
        prayerOnTime,
        prayerOnTimeRate: prayerTotal ? Math.round((prayerOnTime / prayerTotal) * 100) : 0,
        focusSessions: focusAgg._count._all,
        focusMinutes: focusAgg._sum.duration || 0,
      },
      records: { tasks, habits, goals, journal, prayer, focus, calendar, adhkar },
    })
  } catch (error) {
    console.error('[admin/user/:id] failed', error)
    return NextResponse.json({ error: 'Failed to load user detail' }, { status: 500 })
  }
}
