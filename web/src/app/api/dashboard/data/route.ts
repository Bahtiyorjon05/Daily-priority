import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date(startOfDay)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    const [
      totalTasks,
      completedToday,
      overdueTasks,
      urgentImportantTasks,
      focusToday,
      focusWeek,
      goalsActive,
      goalsCompletedWeek,
      upcomingEvents,
      userProfile,
    ] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          status: { not: 'COMPLETED' },
          dueDate: { lt: startOfDay },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          OR: [{ urgent: true }, { important: true }],
          status: { not: 'COMPLETED' },
        },
      }),
      prisma.focusSession.aggregate({
        where: {
          userId,
          completed: true,
          date: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { duration: true },
        _count: { _all: true },
      }),
      prisma.focusSession.aggregate({
        where: {
          userId,
          completed: true,
          date: { gte: sevenDaysAgo, lte: endOfDay },
        },
        _sum: { duration: true },
        _count: { _all: true },
      }),
      prisma.goal.count({
        where: { userId, completed: false },
      }),
      prisma.goal.count({
        where: {
          userId,
          completed: true,
          updatedAt: { gte: startOfWeek },
        },
      }),
      prisma.calendarEvent.findMany({
        where: {
          userId,
          date: { gte: startOfDay },
        },
        orderBy: { date: 'asc' },
        take: 3,
        select: {
          id: true,
          title: true,
          date: true,
          eventType: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          image: true,
          location: true,
          timezone: true,
        },
      }),
    ])

    const focusTodayMinutes = focusToday._sum.duration || 0
    const focusWeekMinutes = focusWeek._sum.duration || 0

    return NextResponse.json({
      success: true,
      data: {
        user: userProfile,
        tasks: {
          total: totalTasks,
          completedToday,
          overdue: overdueTasks,
          priority: urgentImportantTasks,
        },
        focus: {
          todayMinutes: focusTodayMinutes,
          todaySessions: focusToday._count._all,
          weekMinutes: focusWeekMinutes,
          weekSessions: focusWeek._count._all,
        },
        goals: {
          active: goalsActive,
          completedThisWeek: goalsCompletedWeek,
        },
        calendar: {
          upcomingEvents,
        },
        generatedAt: now.toISOString(),
      },
    })
  } catch (error) {
    console.error('Dashboard data error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 },
    )
  }
}
