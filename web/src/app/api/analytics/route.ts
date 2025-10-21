import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get time ranges
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch all necessary data in parallel
    const [
      allTasks,
      completedTasks,
      todayTasks,
      weekTasks,
      goals,
      prayerTracking,
      analyticsRecords
    ] = await Promise.all([
      // All tasks
      prisma.task.findMany({
        where: { userId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          completedAt: true,
          category: { select: { name: true, color: true } }
        }
      }),

      // Completed tasks
      prisma.task.count({
        where: { userId, status: 'COMPLETED' }
      }),

      // Today's tasks
      prisma.task.count({
        where: {
          userId,
          createdAt: { gte: startOfToday }
        }
      }),

      // This week's tasks
      prisma.task.findMany({
        where: {
          userId,
          createdAt: { gte: startOfWeek }
        },
        select: {
          createdAt: true,
          completedAt: true,
          status: true
        }
      }),

      // Goals
      prisma.goal.findMany({
        where: { userId },
        select: {
          category: true,
          completed: true,
          progress: true,
          target: true
        }
      }),

      // Prayer tracking
      prisma.prayerTracking.findMany({
        where: {
          userId,
          date: { gte: startOfMonth }
        },
        select: {
          date: true,
          completedAt: true,
          onTime: true
        }
      }),

      // Analytics records
      prisma.analytics.findMany({
        where: {
          userId,
          date: { gte: startOfWeek }
        },
        orderBy: { date: 'desc' }
      })
    ])

    // Calculate streak
    let streak = 0
    const sortedTasks = allTasks
      .filter(t => t.completedAt)
      .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))

    let currentDate = new Date(startOfToday)
    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(currentDate)
      const dayEnd = new Date(currentDate)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const hasTask = sortedTasks.some(t =>
        t.completedAt && t.completedAt >= dayStart && t.completedAt < dayEnd
      )

      if (hasTask) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (i > 0) {
        break
      } else {
        currentDate.setDate(currentDate.getDate() - 1)
      }
    }

    // Calculate productivity score
    const totalTasks = allTasks.length
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    const productivityScore = Math.round(
      (completionRate * 0.7) +
      (Math.min(streak * 2, 30))
    )

    // Calculate focus time from analytics
    const focusTime = analyticsRecords.reduce((sum, record) => sum + record.focusTimeMinutes, 0) / 60
    const avgFocusTime = analyticsRecords.length > 0
      ? focusTime / analyticsRecords.length
      : 0

    // Category analysis
    const categoryMap = new Map<string, { completed: number; total: number; color: string; timeSpent: number }>()
    allTasks.forEach(task => {
      const categoryName = task.category?.name || 'Uncategorized'
      const categoryColor = task.category?.color || '#3B82F6'

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          completed: 0,
          total: 0,
          color: categoryColor,
          timeSpent: 0
        })
      }

      const cat = categoryMap.get(categoryName)!
      cat.total++
      if (task.status === 'COMPLETED') {
        cat.completed++
        cat.timeSpent += 30 // Estimate 30min per task
      }
    })

    const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      ...data
    }))

    // Prayer analytics
    const totalPrayers = prayerTracking.length
    const completedPrayers = prayerTracking.filter(p => p.completedAt).length
    const prayerConsistency = totalPrayers > 0 ? (completedPrayers / totalPrayers) * 100 : 0

    const prayerStreak = prayerTracking
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .reduce((streak, prayer, index) => {
        if (index === 0 && prayer.completedAt) return 1
        if (prayer.completedAt && streak > 0) return streak + 1
        return streak
      }, 0)

    const onTimePrayers = prayerTracking.filter(p => p.onTime).length
    const avgDelay = totalPrayers > 0 ? (totalPrayers - onTimePrayers) * 5 : 0 // Rough estimate

    // Goals by category
    const goalsByCategory = {
      spiritual: {
        completed: goals.filter(g => g.category === 'IBADAH' && g.completed).length,
        total: goals.filter(g => g.category === 'IBADAH').length
      },
      personal: {
        completed: goals.filter(g => g.category === 'PERSONAL' && g.completed).length,
        total: goals.filter(g => g.category === 'PERSONAL').length
      },
      work: {
        completed: goals.filter(g => g.category === 'WORK' && g.completed).length,
        total: goals.filter(g => g.category === 'WORK').length
      },
      health: {
        completed: goals.filter(g => g.category === 'HEALTH' && g.completed).length,
        total: goals.filter(g => g.category === 'HEALTH').length
      }
    }

    // Daily trends
    const dailyTrends = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const created = weekTasks.filter(t =>
        t.createdAt >= dayStart && t.createdAt <= dayEnd
      ).length

      const completed = weekTasks.filter(t =>
        t.completedAt && t.completedAt >= dayStart && t.completedAt <= dayEnd
      ).length

      dailyTrends.push({ date: dateStr, completed, created })
    }

    const analyticsData = {
      overview: {
        tasksCompleted: completedTasks,
        totalTasks: totalTasks,
        completionRate: parseFloat(completionRate.toFixed(1)),
        streak,
        productivityScore,
        averageTaskTime: 35, // This could be calculated from task metadata if available
        focusTime: parseFloat(avgFocusTime.toFixed(1)),
        weeklyGoals: goals.length,
        completedGoals: goals.filter(g => g.completed).length
      },
      trends: {
        daily: dailyTrends,
        weekly: [], // Can be calculated if needed
        monthly: [] // Can be calculated if needed
      },
      categories: categories.length > 0 ? categories : [
        { name: 'General', completed: completedTasks, total: totalTasks, color: '#3B82F6', timeSpent: completedTasks * 30 }
      ],
      prayers: {
        consistency: parseFloat(prayerConsistency.toFixed(1)),
        streak: prayerStreak,
        timesCompleted: completedPrayers,
        averageDelay: parseFloat(avgDelay.toFixed(1))
      },
      goals: goalsByCategory,
      insights: generateInsights(completionRate, streak, prayerConsistency)
    }

    return NextResponse.json(analyticsData)
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    )
  }
}

function generateInsights(completionRate: number, streak: number, prayerConsistency: number) {
  const insights = []

  if (prayerConsistency >= 90) {
    insights.push({
      type: 'achievement',
      title: 'Prayer Consistency Champion',
      description: `You've maintained ${prayerConsistency.toFixed(1)}% prayer consistency - fantastic spiritual discipline!`,
      icon: 'award',
      value: `${prayerConsistency.toFixed(1)}%`
    })
  }

  if (streak >= 7) {
    insights.push({
      type: 'achievement',
      title: 'Strong Streak!',
      description: `You're on a ${streak}-day streak! Keep up the excellent consistency.`,
      icon: 'star',
      value: `${streak} days`
    })
  }

  if (completionRate >= 80) {
    insights.push({
      type: 'positive',
      title: 'High Completion Rate',
      description: `You're completing ${completionRate.toFixed(1)}% of your tasks. Excellent productivity!`,
      icon: 'trending'
    })
  } else if (completionRate < 50) {
    insights.push({
      type: 'improvement',
      title: 'Task Management Opportunity',
      description: 'Consider breaking down tasks into smaller, more manageable pieces to improve completion rate.',
      icon: 'target'
    })
  }

  if (insights.length === 0) {
    insights.push({
      type: 'positive',
      title: 'Keep Building Momentum',
      description: 'Stay consistent with your tasks and prayers to unlock more achievements.',
      icon: 'clock'
    })
  }

  return insights
}
