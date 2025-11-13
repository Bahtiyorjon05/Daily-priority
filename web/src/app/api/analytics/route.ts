import { NextResponse } from 'next/server'
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

    let currentDate = new Date(startOfToday)
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
      const dateStr = date.toISOString().split('T')[0]

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
        focusTime: parseFloat(avgFocusTime.toFixed(1))
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
  const insights = []

  // Priority insights based on ACTUAL data
  const urgentTasks = priorityBreakdown.find(p => p.priority === 'URGENT')
  const highTasks = priorityBreakdown.find(p => p.priority === 'HIGH')
  const urgentTotal = urgentTasks ? urgentTasks.total : 0
  const urgentCompleted = urgentTasks ? urgentTasks.completed : 0
  const highTotal = highTasks ? highTasks.total : 0
  
  if (urgentTotal > 10) {
    insights.push({
      type: 'warning',
      title: '⚠️ Too Many Urgent Tasks',
      description: `${urgentTotal} urgent tasks detected. Consider better planning to avoid last-minute rushes.`,
      icon: 'alert',
      value: `${urgentTotal} urgent`
    })
  } else if (urgentTotal > 0 && urgentCompleted === urgentTotal) {
    insights.push({
      type: 'achievement',
      title: '🎯 All Urgent Tasks Done',
      description: `${urgentCompleted} urgent tasks completed! Excellent prioritization!`,
      icon: 'award'
    })
  }

  if (highTotal > 0) {
    const highCompleted = highTasks ? highTasks.completed : 0
    const highCompletionRate = highTotal > 0 ? (highCompleted / highTotal) * 100 : 0
    if (highCompletionRate >= 80) {
      insights.push({
        type: 'positive',
        title: '🔥 Prioritizing Well',
        description: `${highCompletionRate.toFixed(0)}% of high-priority tasks done. Great focus!`,
        icon: 'star'
      })
    }
  }

  // Peak hours insight based on ACTUAL data
  if (peakHours.length > 0) {
    const hourNames = peakHours.map(h => {
      if (h >= 5 && h < 12) return `${h}AM (Morning)`
      if (h >= 12 && h < 17) return `${h === 12 ? 12 : h - 12}PM (Afternoon)`
      if (h >= 17 && h < 21) return `${h - 12}PM (Evening)`
      return `${h > 12 ? h - 12 : h}${h >= 12 ? 'PM' : 'AM'} (Night)`
    })
    insights.push({
      type: 'positive',
      title: '⏰ Peak Productivity Hours',
      description: `You're most productive at ${hourNames.join(', ')}. Schedule important tasks then!`,
      icon: 'clock'
    })
  }

  // Streak insights based on ACTUAL data
  if (streak >= 30) {
    insights.push({
      type: 'achievement',
      title: '🏆 Month-Long Streak!',
      description: `${streak} consecutive days of task completion! You're unstoppable!`,
      icon: 'award',
      value: `${streak} days`
    })
  } else if (streak >= 14) {
    insights.push({
      type: 'achievement',
      title: '🔥 Two-Week Streak!',
      description: `${streak} days in a row! Consistency is your superpower.`,
      icon: 'star',
      value: `${streak} days`
    })
  } else if (streak >= 7) {
    insights.push({
      type: 'achievement',
      title: '✨ Week-Long Streak!',
      description: `${streak}-day streak achieved! Keep pushing forward.`,
      icon: 'star',
      value: `${streak} days`
    })
  } else if (streak >= 3) {
    insights.push({
      type: 'positive',
      title: '💪 Building Momentum',
      description: `${streak}-day streak! ${7 - streak} more days to hit a full week.`,
      icon: 'trending'
    })
  } else if (streak === 0 && todayTasks > 0) {
    insights.push({
      type: 'improvement',
      title: '🎯 Build Your Streak',
      description: 'You created tasks today! Complete one to start your consistency streak.',
      icon: 'target'
    })
  }

  // Completion rate insights based on ACTUAL performance
  if (completionRate >= 90) {
    insights.push({
      type: 'achievement',
      title: '⭐ Exceptional Completion Rate',
      description: `${completionRate.toFixed(1)}% completion rate! You're crushing your tasks!`,
      icon: 'award'
    })
  } else if (completionRate >= 75) {
    insights.push({
      type: 'positive',
      title: '✅ Strong Performance',
      description: `${completionRate.toFixed(1)}% of tasks completed. Excellent work!`,
      icon: 'trending'
    })
  } else if (completionRate >= 50) {
    insights.push({
      type: 'positive',
      title: '📈 Decent Progress',
      description: `${completionRate.toFixed(1)}% completion rate. Room to improve!`,
      icon: 'trending'
    })
  } else if (completionRate > 0 && completionRate < 50) {
    insights.push({
      type: 'improvement',
      title: '💡 Improve Task Completion',
      description: `${completionRate.toFixed(1)}% completion. Try breaking tasks into smaller steps.`,
      icon: 'target'
    })
  }

  // Weekly performance insights
  const weekAvgPerDay = weekTasks / 7
  if (weekCompletionRate >= 80) {
    insights.push({
      type: 'positive',
      title: '🎯 Strong Week',
      description: `${weekCompletionRate.toFixed(1)}% weekly completion rate. Fantastic!`,
      icon: 'star'
    })
  }

  if (weekAvgPerDay >= 10) {
    insights.push({
      type: 'positive',
      title: '🚀 High Velocity',
      description: `${weekAvgPerDay.toFixed(1)} tasks/day this week. Great planning!`,
      icon: 'star'
    })
  } else if (weekAvgPerDay >= 5) {
    insights.push({
      type: 'positive',
      title: 'Good Pace',
      description: `${weekAvgPerDay.toFixed(1)} tasks per day. Solid productivity!`,
      icon: 'trending'
    })
  } else if (weekTasks > 0 && weekAvgPerDay < 3) {
    insights.push({
      type: 'improvement',
      title: 'Create More Tasks',
      description: `Only ${weekAvgPerDay.toFixed(1)} tasks/day. Consider adding more goals.`,
      icon: 'target'
    })
  }

  // Monthly trend insights based on ACTUAL comparison
  if (completionRateChange > 10) {
    insights.push({
      type: 'achievement',
      title: '📊 Major Improvement',
      description: `Completion rate up ${completionRateChange.toFixed(1)}% from last month!`,
      icon: 'award'
    })
  } else if (completionRateChange > 0) {
    insights.push({
      type: 'positive',
      title: '📈 Trending Up',
      description: `${completionRateChange.toFixed(1)}% better than last month!`,
      icon: 'trending'
    })
  } else if (completionRateChange < -10) {
    insights.push({
      type: 'improvement',
      title: '⚠️ Completion Rate Dropped',
      description: `Down ${Math.abs(completionRateChange).toFixed(1)}% from last month. Refocus!`,
      icon: 'target'
    })
  }

  // Monthly volume insights
  const monthAvgPerDay = monthTasks / 30
  if (monthAvgPerDay >= 8) {
    insights.push({
      type: 'positive',
      title: '🔥 Highly Active',
      description: `${monthAvgPerDay.toFixed(1)} tasks/day this month. Impressive!`,
      icon: 'star'
    })
  }

  // Today's activity
  if (todayTasks >= 10) {
    insights.push({
      type: 'positive',
      title: '💪 Productive Today',
      description: `${todayTasks} tasks created today! You're on fire!`,
      icon: 'star'
    })
  } else if (todayTasks >= 5) {
    insights.push({
      type: 'positive',
      title: '✨ Good Day',
      description: `${todayTasks} tasks today. Keep it up!`,
      icon: 'trending'
    })
  } else if (todayTasks === 0 && weekTasks < 5) {
    insights.push({
      type: 'improvement',
      title: '🌅 Start Your Day',
      description: 'Create your first task! Small steps lead to big achievements.',
      icon: 'target'
    })
  }

  // Return insights (limit to most relevant 12)
  return insights.slice(0, 12)
}


