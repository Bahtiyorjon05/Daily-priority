import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, paginate, APICache } from '../utils/api-helpers'
import {
  sanitizeTitle,
  sanitizeText,
  sanitizeBoolean,
  sanitizeNumber,
  sanitizeDate,
  sanitizeEnum,
} from '@/lib/sanitize'
import { createLogger } from '@/lib/logger'

const logger = createLogger('TasksAPI')

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiResponse.unauthorized()
    }

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Validate pagination parameters using our helper
    const pagination = paginate(page, limit)

    const userId = session.user.id
    const cacheKey = `tasks:${userId}:${pagination.page}:${pagination.limit}`

    // Check cache first
    const cachedData = APICache.get(cacheKey)
    if (cachedData) {
      return apiResponse.success(cachedData)
    }

    // Get total count for pagination info
    const totalCount = await prisma.task.count({
      where: {
        userId,
      },
    })

    const tasks = await prisma.task.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        urgent: true,
        important: true,
        status: true,
        dueDate: true,
        estimatedTime: true,
        energyLevel: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        subtasks: {
          select: {
            id: true,
            title: true,
            completed: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { urgent: 'desc' },
        { important: 'desc' },
        { dueDate: 'asc' },
      ],
      skip: pagination.skip,
      take: pagination.limit,
    })

    const response = {
      tasks,
      pagination: {
        currentPage: pagination.page,
        totalPages: Math.ceil(totalCount / pagination.limit),
        totalCount,
        hasNextPage: pagination.page < Math.ceil(totalCount / pagination.limit),
        hasPreviousPage: pagination.page > 1
      }
    }

    // Cache the results for only 5 seconds for real-time updates
    APICache.set(cacheKey, response, 5 * 1000)

    return apiResponse.success(response)
  } catch (error: any) {
    logger.error('Failed to fetch tasks', error)
    return apiResponse.error('Failed to fetch tasks', 500, error.message)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiResponse.unauthorized()
    }

    const body = await request.json()
    const {
      title,
      description,
      urgent,
      important,
      dueDate,
      categoryId,
      estimatedTime,
      energyLevel,
      status,
    } = body

    // Sanitize and validate inputs
    const sanitizedTitle = sanitizeTitle(title)
    if (!sanitizedTitle) {
      return apiResponse.validationError({
        title: 'Task title is required and must be valid',
      })
    }

    const sanitizedDescription = sanitizeText(description)
    const sanitizedUrgent = sanitizeBoolean(urgent)
    const sanitizedImportant = sanitizeBoolean(important)
    const sanitizedDueDate = sanitizeDate(dueDate)
    const sanitizedEstimatedTime = sanitizeNumber(estimatedTime, 1, 1440) // 1 min to 24 hours
    const sanitizedEnergyLevel = energyLevel
      ? sanitizeEnum(energyLevel, ['LOW', 'MEDIUM', 'HIGH'] as const)
      : null
    const sanitizedStatus = status
      ? sanitizeEnum(status, [
          'TODO',
          'IN_PROGRESS',
          'COMPLETED',
          'CANCELLED',
        ] as const)
      : null

    const taskData: Record<string, unknown> = {
      title: sanitizedTitle,
      description: sanitizedDescription || null,
      urgent: sanitizedUrgent,
      important: sanitizedImportant,
      dueDate: sanitizedDueDate,
      estimatedTime: sanitizedEstimatedTime,
      energyLevel: sanitizedEnergyLevel,
      userId: session.user.id,
    }

    if (categoryId) {
      taskData.categoryId = categoryId
    }

    if (sanitizedStatus) {
      taskData.status = sanitizedStatus
    }

    const task = await prisma.task.create({
      data: taskData as any,
      include: {
        category: true,
        subtasks: true,
        tags: true,
      },
    })

    // Clear cache for this user's tasks
    const userId = session.user.id
    for (let i = 1; i <= 10; i++) {
      // Clear first 10 pages
      APICache.delete(`tasks:${userId}:${i}:20`)
    }
    // Also clear user stats cache since task count changed
    APICache.delete(`user-stats:${userId}`)

    return apiResponse.success(task, 201)
  } catch (error: any) {
    logger.error('Failed to create task', error)

    // Handle specific database errors
    if (error.code === 'P2002') {
      return apiResponse.error('A task with this title already exists', 409)
    }

    return apiResponse.error('Failed to create task', 500, error.message)
  }
}
