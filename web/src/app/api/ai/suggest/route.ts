import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateTaskSuggestions } from '@/lib/ai'
import { prisma } from '@/lib/prisma'

interface AISuggestedTask {
  title: string
  description: string
  reason: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  urgent: boolean
  important: boolean
  estimatedTime: number
  energyLevel: 'HIGH' | 'MEDIUM' | 'LOW'
}

export async function POST(request: Request) {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user preferences for better AI suggestions
    const [recentTasks, userGoals, todayTasksCount] = await Promise.all([
      // Get recent completed tasks (optimized query)
      prisma.task.findMany({
        where: {
          userId: session.user.id,
          status: 'COMPLETED',
          completedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        select: {
          title: true,
          category: { select: { name: true } }
        },
        take: 8,
        orderBy: { completedAt: 'desc' }
      }),
      
      // Get user goals for context
      prisma.goal.findMany({
        where: {
          userId: session.user.id,
          completed: false
        },
        select: { title: true },
        take: 3
      }),
      
      // Check today's task count to avoid overloading
      prisma.task.count({
        where: {
          userId: session.user.id,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ])

    // Prevent AI spam - limit suggestions if user already has many tasks
    if (todayTasksCount > 15) {
      return NextResponse.json({
        error: 'You have enough tasks for today! Focus on completing existing ones first.',
        suggestion: 'Complete some current tasks before requesting new suggestions'
      }, { status: 429 })
    }

    const completedTasks = recentTasks.map(t => t.title)
    const userGoalsText = userGoals.map(g => g.title).join(', ')
    const currentTime = new Date().toLocaleString()

    // Determine user's energy level based on time and patterns
    const hour = new Date().getHours()
    const energyLevel = hour < 10 || (hour > 14 && hour < 16) ? 'HIGH' : 
                       hour > 20 ? 'LOW' : 'MEDIUM'

    const suggestions = await generateTaskSuggestions({
      completedTasks,
      currentTime,
      userGoals: userGoalsText,
      energyLevel,
      userId: session.user.id
    })

    // Batch create AI-suggested tasks for better performance
    const tasksToCreate = suggestions.tasks.map((task: AISuggestedTask) => ({
      title: task.title,
      description: task.description,
      urgent: task.urgent,
      important: task.important,
      estimatedTime: task.estimatedTime,
      energyLevel: task.energyLevel,
      aiSuggested: true,
      aiReason: task.reason,
      userId: session.user.id,
      status: 'TODO' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    // Use createMany for better performance
    const createdResult = await prisma.task.createMany({
      data: tasksToCreate,
      skipDuplicates: true
    })

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      message: '🎯 ' + (createdResult.count) + ' smart tasks generated in ' + (processingTime) + 'ms',
      tasks: suggestions.tasks,
      count: createdResult.count,
      performance: {
        processingTime: (processingTime) + 'ms',
        cached: suggestions.cached || false
      }
    })
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('AI suggestions error:', error)
    
    return NextResponse.json({
      error: 'AI temporarily unavailable',
      message: 'Our AI is taking a quick break. Try again in a moment!',
      processingTime: (processingTime) + 'ms',
      fallback: true
    }, { status: 503 })
  }
}
