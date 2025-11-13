import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Export user data as JSON
 * GET /api/user/export
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Fetch all user data
    const [
      user,
      tasks,
      goals,
      habits,
      journalEntries,
      focusSessions,
      prayerTracking,
      adhkarProgress,
      calendarEvents,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          location: true,
          timezone: true,
          createdAt: true,
        },
      }),
      prisma.task.findMany({
        where: { userId },
        include: {
          category: true,
          subtasks: true,
          tags: true,
        },
      }),
      prisma.goal.findMany({
        where: { userId },
      }),
      prisma.habit.findMany({
        where: { userId },
        include: {
          completions: true,
        },
      }),
      prisma.journalEntry.findMany({
        where: { userId },
      }),
      prisma.focusSession.findMany({
        where: { userId },
      }),
      prisma.prayerTracking.findMany({
        where: { userId },
      }),
      prisma.adhkarProgress.findMany({
        where: { userId },
      }),
      prisma.calendarEvent.findMany({
        where: { userId },
      }),
    ])

    // Compile export data
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      user,
      data: {
        tasks,
        goals,
        habits,
        journalEntries,
        focusSessions,
        prayerTracking,
        adhkarProgress,
        calendarEvents,
      },
      statistics: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status === 'COMPLETED').length,
        totalGoals: goals.length,
        completedGoals: goals.filter((g) => g.completed).length,
        totalHabits: habits.length,
        totalJournalEntries: journalEntries.length,
        totalFocusSessions: focusSessions.length,
        totalPrayerTracking: prayerTracking.length,
        totalAdhkarProgress: adhkarProgress.length,
        totalCalendarEvents: calendarEvents.length,
      },
    }

    // Set download headers
    const filename = `daily-priority-export-${userId}-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Export data error:', error)
    return NextResponse.json(
      { error: 'Failed to export data', details: error.message },
      { status: 500 }
    )
  }
}
