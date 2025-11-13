import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  sanitizeTitle,
  sanitizeText,
  sanitizeEnum,
  sanitizeNumber,
} from '@/lib/sanitize'

// GET /api/habits - Get all habits for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const habits = await prisma.habit.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        completions: {
          orderBy: {
            date: 'desc'
          },
          take: 30 // Last 30 days of completions
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Calculate streaks and other derived data
    const habitsWithStats = habits.map(habit => {
      // Calculate current streak based on frequency
      let currentStreak = 0
      let longestStreak = habit.longestStreak
      
      // Sort completions by date
      const sortedCompletions = habit.completions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      
      // Calculate current streak
      if (sortedCompletions.length > 0) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        let currentDate = new Date(today)
        let streak = 0
        
        // For DAILY habits, check consecutive days
        if (habit.frequency === 'DAILY') {
          for (const completion of sortedCompletions) {
            const completionDate = new Date(completion.date)
            completionDate.setHours(0, 0, 0, 0)
            
            // Check if completion is for current date in sequence
            if (completionDate.getTime() === currentDate.getTime()) {
              streak++
              currentDate.setDate(currentDate.getDate() - 1)
            } else if (completionDate.getTime() < currentDate.getTime()) {
              // Gap found, streak is broken
              break
            }
          }
        } 
        // For WEEKLY habits, check consecutive weeks
        else if (habit.frequency === 'WEEKLY') {
          // Get the start of current week (Sunday)
          const startOfWeek = new Date(today)
          const dayOfWeek = startOfWeek.getDay()
          startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek)
          startOfWeek.setHours(0, 0, 0, 0)
          
          let currentWeekStart = new Date(startOfWeek)
          const weekCompletions = new Set<number>()
          
          // Group completions by week
          for (const completion of sortedCompletions) {
            const completionDate = new Date(completion.date)
            completionDate.setHours(0, 0, 0, 0)
            
            const completionWeekStart = new Date(completionDate)
            const completionDayOfWeek = completionWeekStart.getDay()
            completionWeekStart.setDate(completionWeekStart.getDate() - completionDayOfWeek)
            completionWeekStart.setHours(0, 0, 0, 0)
            
            weekCompletions.add(completionWeekStart.getTime())
          }
          
          // Count consecutive weeks
          while (weekCompletions.has(currentWeekStart.getTime())) {
            streak++
            currentWeekStart.setDate(currentWeekStart.getDate() - 7)
          }
        }
        // For CUSTOM habits, check based on targetDays within a week
        else if (habit.frequency === 'CUSTOM') {
          // Count completions in last 7 days for current "week"
          const last7Days = new Date(today)
          last7Days.setDate(last7Days.getDate() - 7)
          
          const recentCompletions = sortedCompletions.filter(c => {
            const cDate = new Date(c.date)
            cDate.setHours(0, 0, 0, 0)
            return cDate >= last7Days && cDate <= today
          })
          
          // If met target in last 7 days, count as current streak
          if (recentCompletions.length >= habit.targetDays) {
            streak = 1 // Simplified for custom habits
          }
        }
        
        currentStreak = streak
        longestStreak = Math.max(longestStreak, streak)
        
        // Update longest streak in database if it increased
        if (longestStreak > habit.longestStreak) {
          prisma.habit.update({
            where: { id: habit.id },
            data: { longestStreak }
          }).catch(err => console.error('Error updating longest streak:', err))
        }
      }
      
      return {
        ...habit,
        currentStreak,
        longestStreak
      }
    })
    
    return NextResponse.json(habitsWithStats)
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }
}

// POST /api/habits - Create a new habit
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Sanitize and validate inputs
    const sanitizedTitle = sanitizeTitle(body.title)
    if (!sanitizedTitle) {
      return NextResponse.json(
        { error: 'Title is required and must be valid' },
        { status: 400 }
      )
    }

    const sanitizedDescription = sanitizeText(body.description)
    const sanitizedFrequency = sanitizeEnum(body.frequency, [
      'DAILY',
      'WEEKLY',
      'CUSTOM',
    ] as const)
    const sanitizedTargetDays = sanitizeNumber(body.targetDays, 1, 7)

    const habit = await prisma.habit.create({
      data: {
        title: sanitizedTitle,
        description: sanitizedDescription || null,
        frequency: sanitizedFrequency || 'DAILY',
        targetDays: sanitizedTargetDays || 7,
        userId: session.user.id,
      },
    })

    return NextResponse.json(habit)
  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    )
  }
}