import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/focus - Get focus session statistics
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Get focus sessions for this week
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    // Get focus sessions for this month
    const monthAgo = new Date(today)
    monthAgo.setDate(monthAgo.getDate() - 30)
    
    // OPTIMIZED: Get both week and month sessions in parallel with today
    const [todaySessions, weekSessions, monthSessions, allSessions, totalSessions, allTimeSessions, sessionTypes] = await Promise.all([
      // Today's sessions
      prisma.focusSession.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: today,
            lt: tomorrow
          },
          completed: true
        },
        select: {
          duration: true
        }
      }),
      
      // Week sessions
      prisma.focusSession.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: weekAgo
          },
          completed: true
        },
        select: {
          duration: true,
          date: true
        }
      }),
      
      // Month sessions
      prisma.focusSession.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: monthAgo
          },
          completed: true
        },
        select: {
          duration: true,
          date: true
        }
      }),
      
      // All sessions for streaks (dates only)
      prisma.focusSession.findMany({
        where: {
          userId: session.user.id,
          completed: true
        },
        orderBy: {
          date: 'desc'
        },
        select: {
          date: true
        }
      }),
      
      // Total session count
      prisma.focusSession.count({
        where: {
          userId: session.user.id,
          completed: true
        }
      }),
      
      // All time durations
      prisma.focusSession.aggregate({
        where: {
          userId: session.user.id,
          completed: true
        },
        _sum: {
          duration: true
        }
      }),
      
      // Session type breakdown
      prisma.focusSession.groupBy({
        by: ['sessionType'],
        where: {
          userId: session.user.id,
          completed: true
        },
        _count: {
          id: true
        },
        _sum: {
          duration: true
        }
      })
    ])
    
    // Calculate statistics
    const todayFocusTime = todaySessions.reduce((sum, session) => sum + session.duration, 0)
    const todaySessionsCount = todaySessions.length
    
    const weekFocusTime = weekSessions.reduce((sum, session) => sum + session.duration, 0)
    const weekSessionsCount = weekSessions.length
    
    const monthFocusTime = monthSessions.reduce((sum, session) => sum + session.duration, 0)
    const monthSessionsCount = monthSessions.length
    
    // Calculate daily averages
    const avgDailyFocusTimeWeek = weekSessionsCount > 0 ? Math.round(weekFocusTime / 7) : 0
    const avgDailySessionsWeek = Math.round(weekSessionsCount / 7 * 10) / 10
    
    const avgDailyFocusTimeMonth = monthSessionsCount > 0 ? Math.round(monthFocusTime / 30) : 0
    const avgDailySessionsMonth = Math.round(monthSessionsCount / 30 * 10) / 10
    
    // Calculate current streak
    let currentStreak = 0
    const sessionDates = new Set(
      allSessions.map(s => s.date.toISOString().split('T')[0])
    )
    
    let checkDate = new Date(today)
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      if (sessionDates.has(dateStr)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    let prevDate: Date | null = null

    allSessions.reverse().forEach(({ date }) => {
      const currentDate = new Date(date)
      currentDate.setHours(0, 0, 0, 0)

      if (prevDate) {
        const diffDays = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      } else {
        tempStreak = 1
      }

      prevDate = currentDate
    })
    longestStreak = Math.max(longestStreak, tempStreak)

    // Use aggregated total focus time
    const totalFocusTime = allTimeSessions._sum.duration || 0
    
    // Get last 7 days breakdown - OPTIMIZED: Single query instead of 7 separate queries
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    
    const last7DaysSessions = await prisma.focusSession.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: sevenDaysAgo
        },
        completed: true
      },
      select: {
        date: true,
        duration: true
      }
    })

    // Group by date
    const last7DaysMap = new Map<string, { sessions: number; focusTime: number }>()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      last7DaysMap.set(dateStr, { sessions: 0, focusTime: 0 })
    }
    
    last7DaysSessions.forEach(session => {
      const dateStr = session.date.toISOString().split('T')[0]
      const existing = last7DaysMap.get(dateStr)
      if (existing) {
        existing.sessions++
        existing.focusTime += session.duration
      }
    })
    
    const last7Days = Array.from(last7DaysMap.entries()).map(([date, data]) => ({
      date,
      sessions: data.sessions,
      focusTime: data.focusTime
    }))

    // Get last 30 days breakdown - OPTIMIZED: Single query instead of 30 separate queries
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    
    const last30DaysSessions = await prisma.focusSession.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: thirtyDaysAgo
        },
        completed: true
      },
      select: {
        date: true,
        duration: true
      }
    })

    // Group by date
    const last30DaysMap = new Map<string, { sessions: number; focusTime: number }>()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      last30DaysMap.set(dateStr, { sessions: 0, focusTime: 0 })
    }
    
    last30DaysSessions.forEach(session => {
      const dateStr = session.date.toISOString().split('T')[0]
      const existing = last30DaysMap.get(dateStr)
      if (existing) {
        existing.sessions++
        existing.focusTime += session.duration
      }
    })
    
    const last30Days = Array.from(last30DaysMap.entries()).map(([date, data]) => ({
      date,
      sessions: data.sessions,
      focusTime: data.focusTime
    }))

    const typeBreakdown = sessionTypes.map(type => ({
      type: type.sessionType,
      count: type._count.id,
      totalTime: type._sum.duration || 0
    }))
    
    return NextResponse.json({
      today: {
        focusTime: todayFocusTime,
        sessions: todaySessionsCount
      },
      week: {
        focusTime: weekFocusTime,
        sessions: weekSessionsCount,
        avgDailyFocusTime: avgDailyFocusTimeWeek,
        avgDailySessions: avgDailySessionsWeek
      },
      month: {
        focusTime: monthFocusTime,
        sessions: monthSessionsCount,
        avgDailyFocusTime: avgDailyFocusTimeMonth,
        avgDailySessions: avgDailySessionsMonth
      },
      allTime: {
        totalSessions,
        totalFocusTime,
        currentStreak,
        longestStreak
      },
      last7Days,
      last30Days,
      typeBreakdown
    })
  } catch (error: any) {
    console.error('Error fetching focus stats:', error)
    return NextResponse.json({ error: 'Failed to fetch focus statistics' }, { status: 500 })
  }
}

// POST /api/focus - Create/update focus session
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { 
      duration, 
      sessionType = 'focus',
      taskTitle,
      completed = true,
      completedAt 
    } = body
    
    // Validation
    if (!duration || duration < 1 || duration > 1440) {
      return NextResponse.json({ 
        error: 'Invalid duration. Must be between 1 and 1440 minutes.' 
      }, { status: 400 })
    }
    
    const validSessionTypes = ['focus', 'shortBreak', 'longBreak']
    if (!validSessionTypes.includes(sessionType)) {
      return NextResponse.json({ 
        error: 'Invalid session type. Must be: focus, shortBreak, or longBreak.' 
      }, { status: 400 })
    }
    
    const sessionDate = completedAt ? new Date(completedAt) : new Date()
    
    // Prevent future dates
    if (sessionDate > new Date()) {
      return NextResponse.json({ 
        error: 'Cannot create sessions in the future' 
      }, { status: 400 })
    }
    
    // Create focus session
    const focusSession = await prisma.focusSession.create({
      data: {
        userId: session.user.id,
        duration,
        sessionType,
        taskTitle: taskTitle?.trim() || null,
        completed,
        date: sessionDate
      }
    })
    
    return NextResponse.json({
      message: 'Focus session recorded successfully',
      session: focusSession
    })
  } catch (error: any) {
    console.error('Error recording focus session:', error)
    return NextResponse.json({ error: 'Failed to record focus session' }, { status: 500 })
  }
}