import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, APICache } from '../../utils/api-helpers'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiResponse.unauthorized()
    }

    const userId = session.user.id
    const cacheKey = `user-stats:${userId}`

    // Check cache first
    const cachedData = APICache.get(cacheKey)
    if (cachedData) {
      return apiResponse.success(cachedData)
    }

    // Get user's tasks for statistics
    const tasks = await prisma.task.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        completedAt: true
      }
    })

    // Get user's goals
    const goals = await prisma.goal.findMany({
      where: { userId },
      select: {
        id: true,
        completed: true,
        createdAt: true
      }
    })

    // Calculate task statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length

    // Calculate weekly goals
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weeklyGoals = goals.filter(goal => 
      goal.createdAt >= weekStart
    ).length

    const completedWeeklyGoals = goals.filter(goal => 
      goal.createdAt >= weekStart && goal.completed === true
    ).length

    // Calculate streak (simplified - days with completed tasks)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let streak = 0
    let currentDate = new Date(today)

    for (let i = 0; i < 30; i++) { // Check last 30 days max
      const dayStart = new Date(currentDate)
      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)

      const dayTasks = tasks.filter(task => 
        task.completedAt && 
        new Date(task.completedAt) >= dayStart && 
        new Date(task.completedAt) <= dayEnd
      )

      if (dayTasks.length > 0) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    // Calculate productivity score (simplified algorithm)
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    const streakBonus = Math.min(streak * 2, 20) // Max 20 points from streak
    const productivityScore = Math.min(Math.round(completionRate + streakBonus), 100)

    // Get user achievements
    let achievements: Array<{
      id: string
      title: string
      description: string | null
      icon: string | null
      createdAt: Date
    }> = []

    const prismaAny = prisma as any
    if (typeof prismaAny?.achievement?.findMany === 'function') {
      achievements = await prismaAny.achievement.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3
      })
    }

    const response = {
      streak,
      productivityScore,
      tasksCompleted: completedTasks,
      totalTasks,
      weeklyGoals,
      completedGoals: completedWeeklyGoals,
      completionRate: Math.round(completionRate),
      achievements
    }

    // Cache the results for 2 minutes
    APICache.set(cacheKey, response, 2 * 60 * 1000)

    return apiResponse.success(response)
  } catch (error: any) {
    console.error('Get user stats error:', error)
    return apiResponse.error('Failed to fetch user stats', 500, error.message)
  }
}
