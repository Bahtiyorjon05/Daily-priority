import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Per-user list for the admin Users view, with search, filter and sort.
 * Dataset is small (tens of users) so counts are merged and sorted in memory.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim().toLowerCase()
    const filter = searchParams.get('filter') || 'all'
    const sort = searchParams.get('sort') || 'recent'

    const now = new Date()
    const d7 = new Date(now.getTime() - 7 * 864e5)

    const [users, completedByUser, lastTaskByUser, activeUserRows] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
          timezone: true,
          twoFactorEnabled: true,
          mustResetPassword: true,
          passwordEnc: true,
          // Soft-deleted users stay in this list on purpose — there is no
          // `where` filter here, so closing an account never hides its history
          // from the admin console. This just surfaces the state.
          deletedAt: true,
          deletionReason: true,
          _count: {
            select: {
              tasks: true,
              habits: true,
              goals: true,
              journalEntries: true,
              focusSessions: true,
              prayerTracking: true,
            },
          },
        },
      }),
      prisma.task.groupBy({ by: ['userId'], where: { status: 'COMPLETED' }, _count: { _all: true } }),
      prisma.task.groupBy({ by: ['userId'], _max: { updatedAt: true } }),
      prisma.task.findMany({ where: { updatedAt: { gte: d7 } }, select: { userId: true }, distinct: ['userId'] }),
    ])

    const completedMap = new Map(completedByUser.map((c) => [c.userId, c._count._all]))
    const lastActiveMap = new Map(lastTaskByUser.map((c) => [c.userId, c._max.updatedAt]))
    const activeSet = new Set(activeUserRows.map((r) => r.userId))

    let rows = users.map((u) => {
      const tasksCompleted = completedMap.get(u.id) || 0
      const completionRate = u._count.tasks ? Math.round((tasksCompleted / u._count.tasks) * 100) : 0
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        image: u.image,
        createdAt: u.createdAt.toISOString(),
        timezone: u.timezone,
        twoFactorEnabled: u.twoFactorEnabled,
        mustResetPassword: u.mustResetPassword,
        passwordCaptured: u.passwordEnc != null,
        deleted: u.deletedAt != null,
        deletedAt: u.deletedAt?.toISOString() ?? null,
        deletionReason: u.deletionReason,
        tasks: u._count.tasks,
        tasksCompleted,
        completionRate,
        habits: u._count.habits,
        goals: u._count.goals,
        journalEntries: u._count.journalEntries,
        focusSessions: u._count.focusSessions,
        prayerTracking: u._count.prayerTracking,
        active7d: activeSet.has(u.id),
        lastActive: (lastActiveMap.get(u.id) || u.createdAt).toISOString(),
      }
    })

    if (q) {
      rows = rows.filter(
        (r) => r.email.toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q)
      )
    }
    if (filter === 'pendingReset') rows = rows.filter((r) => r.mustResetPassword)
    else if (filter === 'captured') rows = rows.filter((r) => r.passwordCaptured)
    else if (filter === 'active') rows = rows.filter((r) => r.active7d)
    else if (filter === 'twofactor') rows = rows.filter((r) => r.twoFactorEnabled)

    const sorters: Record<string, (a: typeof rows[0], b: typeof rows[0]) => number> = {
      recent: (a, b) => (a.createdAt < b.createdAt ? 1 : -1),
      active: (a, b) => (a.lastActive < b.lastActive ? 1 : -1),
      tasks: (a, b) => b.tasks - a.tasks,
      completion: (a, b) => b.completionRate - a.completionRate,
      email: (a, b) => a.email.localeCompare(b.email),
    }
    rows.sort(sorters[sort] || sorters.recent)

    return NextResponse.json({ total: rows.length, users: rows })
  } catch (error) {
    console.error('[admin/users] failed', error)
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}
