import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isVaultConfigured } from '@/lib/password-vault'

export const dynamic = 'force-dynamic'

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Aggregated metrics for the admin Overview page. Read-only. */
export async function GET() {
  try {
    const now = new Date()
    const d7 = new Date(now.getTime() - 7 * 864e5)
    const d30 = new Date(now.getTime() - 30 * 864e5)
    const d14 = new Date(now.getTime() - 14 * 864e5)

    const [
      totalUsers,
      pendingReset,
      passwordCaptured,
      twoFactorUsers,
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      totalHabits,
      totalGoals,
      completedGoals,
      totalJournal,
      totalPrayerTracking,
      focusAgg,
      allUsersCreatedAt,
      focusRecent,
      topTasksRaw,
      activeFocus,
      activeJournal,
      activeTasks,
      activePrayer,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { mustResetPassword: true } }),
      prisma.user.count({ where: { passwordEnc: { not: null } } }),
      prisma.user.count({ where: { twoFactorEnabled: true } }),
      prisma.task.count(),
      prisma.task.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.task.groupBy({ by: ['priority'], _count: { _all: true } }),
      prisma.habit.count(),
      prisma.goal.count(),
      prisma.goal.count({ where: { completed: true } }),
      prisma.journalEntry.count(),
      prisma.prayerTracking.count(),
      prisma.focusSession.aggregate({ _sum: { duration: true }, _count: { _all: true } }),
      prisma.user.findMany({ select: { createdAt: true } }),
      prisma.focusSession.findMany({
        where: { date: { gte: d14 } },
        select: { date: true, duration: true },
      }),
      prisma.task.groupBy({
        by: ['userId'],
        _count: { _all: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 5,
      }),
      prisma.focusSession.findMany({ where: { date: { gte: d7 } }, select: { userId: true }, distinct: ['userId'] }),
      prisma.journalEntry.findMany({ where: { date: { gte: d7 } }, select: { userId: true }, distinct: ['userId'] }),
      prisma.task.findMany({ where: { updatedAt: { gte: d7 } }, select: { userId: true }, distinct: ['userId'] }),
      prisma.prayerTracking.findMany({ where: { date: { gte: d7 } }, select: { userId: true }, distinct: ['userId'] }),
    ])

    // Active users in the last 7 days (union of activity signals).
    const activeSet = new Set<string>()
    for (const r of [...activeFocus, ...activeJournal, ...activeTasks, ...activePrayer]) activeSet.add(r.userId)

    // Signups per day for the last 30 days.
    const signupBuckets = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
      signupBuckets.set(dayKey(new Date(now.getTime() - i * 864e5)), 0)
    }
    for (const u of allUsersCreatedAt) {
      const k = dayKey(u.createdAt)
      if (signupBuckets.has(k)) signupBuckets.set(k, (signupBuckets.get(k) || 0) + 1)
    }
    let cumulative = totalUsers - allUsersCreatedAt.filter((u) => u.createdAt >= d30).length
    const signups = [...signupBuckets.entries()].map(([date, count]) => {
      cumulative += count
      return { date, count, total: cumulative }
    })

    // Focus minutes per day for the last 14 days.
    const focusBuckets = new Map<string, number>()
    for (let i = 13; i >= 0; i--) focusBuckets.set(dayKey(new Date(now.getTime() - i * 864e5)), 0)
    for (const f of focusRecent) {
      const k = dayKey(f.date)
      if (focusBuckets.has(k)) focusBuckets.set(k, (focusBuckets.get(k) || 0) + (f.duration || 0))
    }
    const focusTrend = [...focusBuckets.entries()].map(([date, minutes]) => ({ date, minutes }))

    // Resolve top users' emails.
    const topUserIds = topTasksRaw.map((t) => t.userId)
    const topUsersInfo = await prisma.user.findMany({
      where: { id: { in: topUserIds } },
      select: { id: true, email: true, name: true },
    })
    const topUsers = topTasksRaw.map((t) => {
      const u = topUsersInfo.find((x) => x.id === t.userId)
      return { userId: t.userId, email: u?.email || t.userId, name: u?.name || null, tasks: t._count._all }
    })

    const statusMap: Record<string, number> = {}
    for (const s of tasksByStatus) statusMap[s.status] = s._count._all
    const priorityMap: Record<string, number> = {}
    for (const p of tasksByPriority) priorityMap[p.priority] = p._count._all

    return NextResponse.json({
      kpis: {
        totalUsers,
        activeUsers7d: activeSet.size,
        pendingReset,
        passwordCaptured,
        twoFactorUsers,
        totalTasks,
        completedTasks: statusMap['COMPLETED'] || 0,
        totalHabits,
        totalGoals,
        completedGoals,
        totalJournal,
        totalPrayerTracking,
        focusSessions: focusAgg._count._all,
        focusMinutes: focusAgg._sum.duration || 0,
        vaultConfigured: isVaultConfigured(),
      },
      tasksByStatus: statusMap,
      tasksByPriority: priorityMap,
      signups,
      focusTrend,
      topUsers,
    })
  } catch (error) {
    console.error('[admin/overview] failed', error)
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 })
  }
}
