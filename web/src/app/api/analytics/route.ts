import { NextResponse } from 'next/server'
import { getUserTimezone, dateKeyInTimeZone } from '@/lib/server-date'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, APICache } from '../utils/api-helpers'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const userTz = await getUserTimezone(userId)
    const cacheKey = `analytics:${userId}`

    // Check cache first (30 second cache for analytics)
    const cachedData = APICache.get(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // Get time ranges
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Fetch all necessary data in parallel
    const allTasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        priority: true,
        urgent: true,
        important: true,
        createdAt: true,
        completedAt: true,
        estimatedTime: true,
        category: { select: { name: true, color: true } }
      }
    })

    /*
      Everything else the user actually does.

      This route queried `task` and nothing else, then reported "focus time"
      derived from the `estimatedTime` field on those tasks — a number labelled
      as one thing and computed from another. Meanwhile habits, goals, journal
      entries, real focus sessions and prayers were absent, on a page called
      Analytics.

      One parallel batch, and all counted server-side so the client is not
      totalling records it had to download first.
    */
    const [
      habitsTotal,
      habitCompletionsWeek,
      goalsTotal,
      goalsCompleted,
      journalWeek,
      journalTotal,
      focusWeek,
      focusAllTime,
      prayersWeek,
      prayersOnTimeWeek,
    ] = await Promise.all([
      prisma.habit.count({ where: { userId } }),
      prisma.habitCompletion.count({
        where: { habit: { userId }, date: { gte: startOfWeek } },
      }),
      prisma.goal.count({ where: { userId } }),
      prisma.goal.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.journalEntry.count({ where: { userId, date: { gte: startOfWeek } } }),
      prisma.journalEntry.count({ where: { userId } }),
      prisma.focusSession.aggregate({
        where: { userId, date: { gte: startOfWeek } },
        _sum: { duration: true },
        _count: { _all: true },
      }),
      prisma.focusSession.aggregate({
        where: { userId },
        _sum: { duration: true },
        _count: { _all: true },
      }),
      prisma.prayerTracking.count({
        where: { userId, date: { gte: startOfWeek }, completedAt: { not: null } },
      }),
      prisma.prayerTracking.count({
        where: { userId, date: { gte: startOfWeek }, completedAt: { not: null }, onTime: true },
      }),
    ])

    const completedTasks = allTasks.filter(task => task.status === 'COMPLETED')
    const todayTasks = allTasks.filter(task => task.createdAt >= startOfToday)
    const weekTasks = allTasks.filter(task => task.createdAt >= startOfWeek)
    const monthTasks = allTasks.filter(task => task.createdAt >= startOfMonth)
    const lastMonthTasks = allTasks.filter(task => 
      task.createdAt >= startOfLastMonth && task.createdAt < startOfMonth
    )

    // Calculate streak (optimized - only check last 90 days)
    let streak = 0
    const completedTaskDates = new Set(
      allTasks
        .filter(t => t.completedAt)
        .map(t => {
          const date = new Date(t.completedAt!)
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
        })
    )

    const currentDate = new Date(startOfToday)
    for (let i = 0; i < 90; i++) { // Reduced from 365 to 90 days
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`

      if (completedTaskDates.has(dateStr)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (i > 0) {
        break // Streak broken
      } else {
        // Allow today to not have completions yet
        currentDate.setDate(currentDate.getDate() - 1)
      }
    }

    // Calculate productivity score
    const totalTasks = allTasks.length
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0
    const productivityScore = Math.round(
      (completionRate * 0.7) +
      (Math.min(streak * 2, 30))
    )

    // Calculate focus time from estimated time on tasks
    const totalEstimatedMinutes = allTasks
      .filter(t => t.estimatedTime)
      .reduce((sum: number, task) => sum + (task.estimatedTime || 0), 0)
    const avgFocusTime = completedTasks.length > 0 ? totalEstimatedMinutes / (completedTasks.length * 60) : 0

    // Category analysis
    // Weekly and Monthly stats calculations
    const weekCompleted = weekTasks.filter(t => t.status === 'COMPLETED').length
    const weekTotal = weekTasks.length
    const weekCompletionRate = weekTotal > 0 ? ((weekCompleted / weekTotal) * 100) : 0

    const monthCompleted = monthTasks.filter(t => t.status === 'COMPLETED').length
    const monthTotal = monthTasks.length
    const monthCompletionRate = monthTotal > 0 ? ((monthCompleted / monthTotal) * 100) : 0

    const lastMonthCompleted = lastMonthTasks.filter(t => t.status === 'COMPLETED').length
    const lastMonthTotal = lastMonthTasks.length
    const lastMonthCompletionRate = lastMonthTotal > 0 ? ((lastMonthCompleted / lastMonthTotal) * 100) : 0

    // Month over month comparison
    const monthGrowth = lastMonthTotal > 0 ? ((monthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0
    const completionRateChange = lastMonthCompletionRate > 0 ? monthCompletionRate - lastMonthCompletionRate : 0

    // Daily trends - Extended to show more useful data
    const dailyTrends = []
    for (let i = 13; i >= 0; i--) { // Extended to 14 days for better visualization
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = dateKeyInTimeZone(date, userTz)

      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const created = allTasks.filter(t =>
        t.createdAt >= dayStart && t.createdAt <= dayEnd
      ).length

      const completed = allTasks.filter(t =>
        t.completedAt && t.completedAt >= dayStart && t.completedAt <= dayEnd
      ).length

      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' })

      dailyTrends.push({ 
        date: dateStr, 
        completed, 
        created,
        dayOfWeek,
        completionRate: created > 0 ? parseFloat(((completed / created) * 100).toFixed(1)) : 0
      })
    }

    // Priority distribution by actual task priority field
    const priorityBreakdown = [
      { 
        priority: 'URGENT', 
        total: allTasks.filter(t => t.priority === 'URGENT').length,
        completed: allTasks.filter(t => t.priority === 'URGENT' && t.status === 'COMPLETED').length
      },
      { 
        priority: 'HIGH', 
        total: allTasks.filter(t => t.priority === 'HIGH').length,
        completed: allTasks.filter(t => t.priority === 'HIGH' && t.status === 'COMPLETED').length
      },
      { 
        priority: 'MEDIUM', 
        total: allTasks.filter(t => t.priority === 'MEDIUM').length,
        completed: allTasks.filter(t => t.priority === 'MEDIUM' && t.status === 'COMPLETED').length
      },
      { 
        priority: 'LOW', 
        total: allTasks.filter(t => t.priority === 'LOW').length,
        completed: allTasks.filter(t => t.priority === 'LOW' && t.status === 'COMPLETED').length
      }
    ]

    // Status/flag-based stats for taskStats
    const priorityStats = allTasks.reduce(
      (stats, task) => {
        if (task.urgent) stats.urgent++
        if (task.important) stats.important++

        switch (task.status) {
          case 'COMPLETED':
            stats.completed++
            break
          case 'IN_PROGRESS':
            stats.inProgress++
            break
          case 'CANCELLED':
            stats.cancelled++
            break
          default:
            stats.pending++
            break
        }

        return stats
      },
      {
        urgent: 0,
        important: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
        cancelled: 0
      }
    )

    // Time-based patterns
    const hourlyDistribution = new Array(24).fill(0)
    allTasks.forEach(task => {
      if (task.createdAt) {
        const hour = task.createdAt.getHours()
        hourlyDistribution[hour]++
      }
    })

    // Find peak productivity hours
    const maxTasks = Math.max(...hourlyDistribution)
    const peakHours = hourlyDistribution
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count === maxTasks && h.count > 0)
      .map(h => h.hour)

    // Day of week performance
    type WeekdayStats = { created: number; completed: number }
    type WeekdayPerformance = {
      Monday: WeekdayStats
      Tuesday: WeekdayStats
      Wednesday: WeekdayStats
      Thursday: WeekdayStats
      Friday: WeekdayStats
      Saturday: WeekdayStats
      Sunday: WeekdayStats
      [key: string]: WeekdayStats
    }
    
    const weekdayPerformance: WeekdayPerformance = {
      'Monday': { created: 0, completed: 0 },
      'Tuesday': { created: 0, completed: 0 },
      'Wednesday': { created: 0, completed: 0 },
      'Thursday': { created: 0, completed: 0 },
      'Friday': { created: 0, completed: 0 },
      'Saturday': { created: 0, completed: 0 },
      'Sunday': { created: 0, completed: 0 }
    }

    allTasks.forEach(task => {
      const day = task.createdAt.toLocaleDateString('en-US', { weekday: 'long' }) as keyof WeekdayPerformance
      if (weekdayPerformance[day]) {
        weekdayPerformance[day].created++
        if (task.status === 'COMPLETED') {
          weekdayPerformance[day].completed++
        }
      }
    })

    const weekdayData = Object.entries(weekdayPerformance).map(([day, stats]) => ({
      day,
      ...stats,
      rate: stats.created > 0 ? parseFloat(((stats.completed / stats.created) * 100).toFixed(1)) : 0
    }))

    const analyticsData = {
      overview: {
        tasksCompleted: completedTasks.length,
        totalTasks: totalTasks,
        completionRate: parseFloat(completionRate.toFixed(1)),
        streak,
        productivityScore,
        averageTaskTime: avgFocusTime > 0 ? parseFloat((totalEstimatedMinutes / Math.max(completedTasks.length, 1)).toFixed(1)) : 0,
        /*
          Hours actually spent in focus sessions. This used to be
          `totalEstimatedMinutes / completedTasks` — an estimate the user typed
          on a task, divided by a task count, presented as time focused. It
          could be non-zero for someone who had never run a single session.
        */
        focusTime: parseFloat((((focusAllTime._sum.duration || 0) / 60)).toFixed(1)),
      },

      /* The rest of the app, which this page did not look at. */
      activity: {
        habits: { total: habitsTotal, completionsThisWeek: habitCompletionsWeek },
        goals: { total: goalsTotal, completed: goalsCompleted },
        journal: { total: journalTotal, thisWeek: journalWeek },
        focus: {
          sessionsThisWeek: focusWeek._count._all,
          minutesThisWeek: focusWeek._sum.duration || 0,
          sessionsAllTime: focusAllTime._count._all,
          minutesAllTime: focusAllTime._sum.duration || 0,
        },
        prayers: { loggedThisWeek: prayersWeek, onTimeThisWeek: prayersOnTimeWeek },
      },
      weekly: {
        created: weekTotal,
        completed: weekCompleted,
        completionRate: parseFloat(weekCompletionRate.toFixed(1)),
        avgPerDay: parseFloat((weekTotal / 7).toFixed(1))
      },
      monthly: {
        created: monthTotal,
        completed: monthCompleted,
        completionRate: parseFloat(monthCompletionRate.toFixed(1)),
        growth: parseFloat(monthGrowth.toFixed(1)),
        completionRateChange: parseFloat(completionRateChange.toFixed(1))
      },
      lastMonth: {
        created: lastMonthTotal,
        completed: lastMonthCompleted,
        completionRate: parseFloat(lastMonthCompletionRate.toFixed(1))
      },
      trends: {
        daily: dailyTrends,
        weekday: weekdayData,
        peakHours: peakHours.length > 0 ? peakHours : []
      },
      taskStats: {
        priority: priorityStats,
        velocity: {
          today: todayTasks.length,
          week: weekTotal,
          avgPerDay: parseFloat((weekTotal / 7).toFixed(1))
        }
      },
      insights: generateInsights(
        completionRate, 
        streak, 
        todayTasks.length, 
        weekTotal, 
        monthTotal, 
        weekCompletionRate, 
        monthCompletionRate, 
        completionRateChange,
        priorityBreakdown,
        peakHours.length > 0 ? peakHours : []
      )
    }

    // Cache the results for 30 seconds
    APICache.set(cacheKey, analyticsData, 30 * 1000)

    return NextResponse.json(analyticsData)
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    )
  }
}

function generateInsights(
  completionRate: number, 
  streak: number, 
  todayTasks: number,
  weekTasks: number,
  monthTasks: number,
  weekCompletionRate: number,
  monthCompletionRate: number,
  completionRateChange: number,
  priorityBreakdown: any[],
  peakHours: number[]
) {
  /*
    Insights are emitted as a CODE plus numbers, never as prose.

    They used to be built here as English template literals —
    `${rate}% of high-priority tasks done. Great focus!` — and rendered straight
    to the page. Server-generated English cannot be translated on the client, so
    the whole panel stayed English on an Uzbek dashboard no matter how complete
    the dictionary was. Twenty-four of them.

    The client looks up `analytics.insight.<code>.title` / `.body` and
    interpolates `params`. Numbers are rounded here so the two sides cannot
    disagree about precision.
  */
  const insights: {
    type: 'positive' | 'warning' | 'achievement' | 'improvement'
    code: string
    params?: Record<string, string | number>
    icon: string
    value?: string
  }[] = []

  const round1 = (n: number) => Number(n.toFixed(1))

  // --- Priority ---
  const urgentTasks = priorityBreakdown.find(p => p.priority === 'URGENT')
  const highTasks = priorityBreakdown.find(p => p.priority === 'HIGH')
  const urgentTotal = urgentTasks ? urgentTasks.total : 0
  const urgentCompleted = urgentTasks ? urgentTasks.completed : 0
  const highTotal = highTasks ? highTasks.total : 0

  if (urgentTotal > 10) {
    insights.push({
      type: 'warning', code: 'urgentOverload',
      params: { count: urgentTotal }, icon: 'alert',
    })
  } else if (urgentTotal > 0 && urgentCompleted === urgentTotal) {
    insights.push({
      type: 'achievement', code: 'urgentAllDone',
      params: { count: urgentCompleted }, icon: 'award',
    })
  }

  if (highTotal > 0) {
    const highCompleted = highTasks ? highTasks.completed : 0
    const highRate = (highCompleted / highTotal) * 100
    if (highRate >= 80) {
      insights.push({
        type: 'positive', code: 'highPriorityFocus',
        params: { rate: Math.round(highRate) }, icon: 'star',
      })
    }
  }

  // --- Peak hours ---
  // Sent as bare 24-hour numbers. The old version built "2PM (Afternoon)"
  // server-side, which is a second untranslatable string inside the first.
  if (peakHours.length > 0) {
    insights.push({
      type: 'positive', code: 'peakHours',
      params: { hours: peakHours.map(h => `${String(h).padStart(2, '0')}:00`).join(', ') },
      icon: 'clock',
    })
  }

  // --- Streak ---
  if (streak >= 30) {
    insights.push({ type: 'achievement', code: 'streakMonth', params: { days: streak }, icon: 'award', value: `${streak}` })
  } else if (streak >= 14) {
    insights.push({ type: 'achievement', code: 'streakTwoWeeks', params: { days: streak }, icon: 'star', value: `${streak}` })
  } else if (streak >= 7) {
    insights.push({ type: 'achievement', code: 'streakWeek', params: { days: streak }, icon: 'star', value: `${streak}` })
  } else if (streak >= 3) {
    insights.push({ type: 'positive', code: 'streakBuilding', params: { days: streak, remaining: 7 - streak }, icon: 'trending' })
  } else if (streak === 0 && todayTasks > 0) {
    insights.push({ type: 'improvement', code: 'streakStart', icon: 'target' })
  }

  // --- Completion rate ---
  if (completionRate >= 90) {
    insights.push({ type: 'achievement', code: 'completionExceptional', params: { rate: round1(completionRate) }, icon: 'award' })
  } else if (completionRate >= 75) {
    insights.push({ type: 'positive', code: 'completionStrong', params: { rate: round1(completionRate) }, icon: 'trending' })
  } else if (completionRate >= 50) {
    insights.push({ type: 'positive', code: 'completionDecent', params: { rate: round1(completionRate) }, icon: 'trending' })
  } else if (completionRate > 0) {
    insights.push({ type: 'improvement', code: 'completionImprove', params: { rate: round1(completionRate) }, icon: 'target' })
  }

  // --- This week ---
  const weekAvgPerDay = weekTasks / 7
  if (weekCompletionRate >= 80) {
    insights.push({ type: 'positive', code: 'weekStrong', params: { rate: round1(weekCompletionRate) }, icon: 'star' })
  }
  if (weekAvgPerDay >= 10) {
    insights.push({ type: 'positive', code: 'velocityHigh', params: { perDay: round1(weekAvgPerDay) }, icon: 'star' })
  } else if (weekAvgPerDay >= 5) {
    insights.push({ type: 'positive', code: 'velocityGood', params: { perDay: round1(weekAvgPerDay) }, icon: 'trending' })
  } else if (weekTasks > 0 && weekAvgPerDay < 3) {
    insights.push({ type: 'improvement', code: 'velocityLow', params: { perDay: round1(weekAvgPerDay) }, icon: 'target' })
  }

  // --- Month over month ---
  if (completionRateChange > 10) {
    insights.push({ type: 'achievement', code: 'trendMajorUp', params: { delta: round1(completionRateChange) }, icon: 'award' })
  } else if (completionRateChange > 0) {
    insights.push({ type: 'positive', code: 'trendUp', params: { delta: round1(completionRateChange) }, icon: 'trending' })
  } else if (completionRateChange < -10) {
    insights.push({ type: 'improvement', code: 'trendDown', params: { delta: round1(Math.abs(completionRateChange)) }, icon: 'target' })
  }

  const monthAvgPerDay = monthTasks / 30
  if (monthAvgPerDay >= 8) {
    insights.push({ type: 'positive', code: 'monthActive', params: { perDay: round1(monthAvgPerDay) }, icon: 'star' })
  }

  // --- Today ---
  if (todayTasks >= 10) {
    insights.push({ type: 'positive', code: 'todayProductive', params: { count: todayTasks }, icon: 'star' })
  } else if (todayTasks >= 5) {
    insights.push({ type: 'positive', code: 'todayGood', params: { count: todayTasks }, icon: 'trending' })
  } else if (todayTasks === 0 && weekTasks < 5) {
    insights.push({ type: 'improvement', code: 'todayStart', icon: 'target' })
  }

  // Return insights (limit to most relevant 12)
  return insights.slice(0, 12)
}


