import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
      // Calculate current streak
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
        
        let currentDate = today
        let streak = 0
        
        for (const completion of sortedCompletions) {
          const completionDate = new Date(completion.date)
          completionDate.setHours(0, 0, 0, 0)
          
          // Check if completion is for today or previous consecutive days
          if (completionDate.getTime() === currentDate.getTime()) {
            streak++
            currentDate.setDate(currentDate.getDate() - 1)
          } else if (completionDate.getTime() < currentDate.getTime()) {
            // If we find a completion from before our streak, stop
            break
          }
        }
        
        currentStreak = streak
        longestStreak = Math.max(longestStreak, streak)
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
    
    const habit = await prisma.habit.create({
      data: {
        title: body.title,
        description: body.description,
        frequency: body.frequency || 'DAILY',
        targetDays: body.targetDays || 7,
        userId: session.user.id
      }
    })
    
    return NextResponse.json(habit)
  } catch (error) {
    console.error('Error creating habit:', error)
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 })
  }
}