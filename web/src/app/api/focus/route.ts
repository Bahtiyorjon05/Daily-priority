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
    
    // Get focus sessions for today
    const todaySessions = await prisma.analytics.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    })
    
    // Get focus sessions for this week
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const weekSessions = await prisma.analytics.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: weekAgo
        }
      },
      orderBy: {
        date: 'asc'
      }
    })
    
    // Calculate statistics
    const todayFocusTime = todaySessions.reduce((sum, session) => sum + session.focusTimeMinutes, 0)
    const todaySessionsCount = todaySessions.reduce((sum, session) => sum + session.tasksCompleted, 0)
    
    const weekFocusTime = weekSessions.reduce((sum, session) => sum + session.focusTimeMinutes, 0)
    const weekSessionsCount = weekSessions.reduce((sum, session) => sum + session.tasksCompleted, 0)
    
    // Calculate daily averages
    const weekDays = Math.min(7, weekSessions.length)
    const avgDailyFocusTime = weekDays > 0 ? Math.round(weekFocusTime / weekDays) : 0
    const avgDailySessions = weekDays > 0 ? Math.round(weekSessionsCount / weekDays) : 0
    
    // Get productivity trend
    const productivityTrend = weekSessions.map(session => ({
      date: session.date.toISOString().split('T')[0],
      focusTime: session.focusTimeMinutes,
      productivityScore: session.productivityScore
    }))
    
    return NextResponse.json({
      today: {
        focusTime: todayFocusTime,
        sessions: todaySessionsCount
      },
      week: {
        focusTime: weekFocusTime,
        sessions: weekSessionsCount,
        avgDailyFocusTime,
        avgDailySessions
      },
      trend: productivityTrend
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
      mode, 
      completedAt 
    } = body
    
    const sessionDate = completedAt ? new Date(completedAt) : new Date()
    sessionDate.setHours(0, 0, 0, 0)
    
    // Find or create analytics record for the day
    let analyticsRecord = await prisma.analytics.findFirst({
      where: {
        userId: session.user.id,
        date: sessionDate
      }
    })
    
    if (!analyticsRecord) {
      analyticsRecord = await prisma.analytics.create({
        data: {
          userId: session.user.id,
          date: sessionDate,
          tasksCreated: 0,
          tasksCompleted: 0,
          focusTimeMinutes: 0,
          productivityScore: 0,
          energyLevel: 0
        }
      })
    }
    
    // Update focus time
    const updatedRecord = await prisma.analytics.update({
      where: {
        id: analyticsRecord.id
      },
      data: {
        focusTimeMinutes: {
          increment: duration
        }
      }
    })
    
    return NextResponse.json({
      message: 'Focus session recorded',
      focusTime: updatedRecord.focusTimeMinutes
    })
  } catch (error: any) {
    console.error('Error recording focus session:', error)
    return NextResponse.json({ error: 'Failed to record focus session' }, { status: 500 })
  }
}