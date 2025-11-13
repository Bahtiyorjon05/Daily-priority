import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Last 30 days
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const allProgress = await prisma.adhkarProgress.findMany({
      where: {
        userId: user.id,
        date: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { date: 'desc' }
    })

    // Calculate statistics
    const stats = {
      totalCompletions: 0,
      currentStreak: 0,
      longestStreak: 0,
      morningCompletions: 0,
      eveningCompletions: 0,
      generalCompletions: 0,
      completionRate: 0,
      last7Days: [] as boolean[],
      last30Days: [] as { date: string; completed: number; total: number }[]
    }

    // Group by date
    const progressByDate = new Map<string, typeof allProgress>()
    allProgress.forEach(p => {
      const dateKey = p.date.toISOString().split('T')[0]
      if (!progressByDate.has(dateKey)) {
        progressByDate.set(dateKey, [])
      }
      progressByDate.get(dateKey)!.push(p)
    })

    // Calculate streaks and stats
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]

      const dayProgress = progressByDate.get(dateKey) || []
      const completed = dayProgress.filter(p => p.completed).length
      const total = dayProgress.length

      stats.last30Days.unshift({ date: dateKey, completed, total })

      if (i < 7) {
        stats.last7Days.unshift(completed > 0)
      }

      // Count by category
      dayProgress.forEach(p => {
        if (p.completed) {
          stats.totalCompletions++
          if (p.category === 'morning') stats.morningCompletions++
          if (p.category === 'evening') stats.eveningCompletions++
          if (p.category === 'general') stats.generalCompletions++
        }
      })

      // Calculate streak
      if (completed > 0) {
        tempStreak++
        if (i === 0) currentStreak = tempStreak
      } else {
        if (tempStreak > longestStreak) longestStreak = tempStreak
        if (i > 0) tempStreak = 0 // Don't reset on first day
      }
    }

    stats.currentStreak = currentStreak
    stats.longestStreak = Math.max(longestStreak, currentStreak)
    stats.completionRate = Math.round((stats.totalCompletions / (allProgress.length || 1)) * 100)

    return NextResponse.json({ statistics: stats })
  } catch (error) {
    console.error('Error fetching adhkar statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
