import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, paginate, APICache } from '../utils/api-helpers'

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
      include: {
        category: true,
        subtasks: true,
        tags: true,
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

    // Cache the results
    APICache.set(cacheKey, response)

    return apiResponse.success(response)
  } catch (error: any) {
    console.error('Get tasks error:', error)
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
      aiSuggested,
      aiReason,
    } = body

    // Validate required fields
    if (!title?.trim()) {
      return apiResponse.validationError({
        title: 'Task title is required'
      })
    }

    const normalizedStatus =
      typeof status === 'string' ? status.toUpperCase() : undefined

    const taskData: Record<string, unknown> = {
      title: title.trim(),
      description: description?.trim() || null,
      urgent: Boolean(urgent),
      important: Boolean(important),
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedTime:
        typeof estimatedTime === 'number' && !Number.isNaN(estimatedTime)
          ? Math.max(1, Math.min(1440, estimatedTime)) // 1 min to 24 hours
          : null,
      energyLevel: energyLevel || null,
      aiSuggested: aiSuggested ?? false,
      aiReason: aiReason?.trim() || null,
      userId: session.user.id,
    }

    if (categoryId) {
      taskData.categoryId = categoryId
    }

    if (normalizedStatus) {
      // Validate status against Prisma enum
      const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
      if (validStatuses.includes(normalizedStatus)) {
        taskData.status = normalizedStatus
      }
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
    for (let i = 1; i <= 10; i++) { // Clear first 10 pages
      APICache.delete(`tasks:${userId}:${i}:20`)
    }

    return apiResponse.success(task, 201)
  } catch (error: any) {
    console.error('Create task error:', error)
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return apiResponse.error('A task with this title already exists', 409)
    }
    
    return apiResponse.error('Failed to create task', 500, error.message)
  }
}
