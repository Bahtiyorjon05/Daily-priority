import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Severity = 'high' | 'medium' | 'low'

interface AppNotification {
  id: string
  type: 'task-overdue' | 'task-due-soon' | 'habit-due' | 'goal-overdue'
  title: string
  body: string
  href: string
  severity: Severity
  at: string
}

/**
 * Computes the signed-in user's actionable notifications from their live data:
 * overdue / due-soon tasks, daily habits not yet done today, and past-deadline
 * goals. Read-only. The client polls this and surfaces bell + system alerts.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    const [tasks, habits, goals] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { not: null, lte: soon },
        },
        select: { id: true, title: true, dueDate: true },
        orderBy: { dueDate: 'asc' },
        take: 50,
      }),
      prisma.habit.findMany({
        where: { userId, frequency: 'DAILY' },
        select: {
          id: true,
          title: true,
          completions: {
            where: { date: { gte: startOfToday } },
            select: { id: true },
            take: 1,
          },
        },
        take: 50,
      }),
      prisma.goal.findMany({
        where: { userId, completed: false, deadline: { not: null, lt: now } },
        select: { id: true, title: true, deadline: true },
        take: 50,
      }),
    ])

    const notifications: AppNotification[] = []

    for (const t of tasks) {
      if (!t.dueDate) continue
      const overdue = t.dueDate < now
      notifications.push({
        id: `${overdue ? 'task-overdue' : 'task-due-soon'}-${t.id}`,
        type: overdue ? 'task-overdue' : 'task-due-soon',
        title: overdue ? 'Overdue task' : 'Task due soon',
        body: t.title,
        href: '/dashboard',
        severity: overdue ? 'high' : 'medium',
        at: t.dueDate.toISOString(),
      })
    }

    const dayKey = startOfToday.toISOString().slice(0, 10).replace(/-/g, '')
    for (const h of habits) {
      if (h.completions.length === 0) {
        notifications.push({
          id: `habit-due-${h.id}-${dayKey}`,
          type: 'habit-due',
          title: 'Habit for today',
          body: `Not done yet: ${h.title}`,
          href: '/habits',
          severity: 'medium',
          at: startOfToday.toISOString(),
        })
      }
    }

    for (const g of goals) {
      notifications.push({
        id: `goal-overdue-${g.id}`,
        type: 'goal-overdue',
        title: 'Goal past deadline',
        body: g.title,
        href: '/goals',
        severity: 'high',
        at: (g.deadline ?? now).toISOString(),
      })
    }

    // High severity first, then most recent.
    const rank: Record<Severity, number> = { high: 0, medium: 1, low: 2 }
    notifications.sort(
      (a, b) => rank[a.severity] - rank[b.severity] || (a.at < b.at ? 1 : -1)
    )

    return NextResponse.json({ notifications, count: notifications.length })
  } catch (error) {
    console.error('[notifications] failed', error)
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 })
  }
}
