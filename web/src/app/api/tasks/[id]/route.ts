import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { apiResponse, APICache } from '../../utils/api-helpers'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiResponse.unauthorized()
    }

    const { id } = await context.params
    const body = await request.json()
    const { title, description, status, urgent, important, dueDate, categoryId, estimatedTime, energyLevel } = body

    // Validate task ID format
    if (!id || typeof id !== 'string') {
      return apiResponse.error('Invalid task ID', 400)
    }

    // Verify task belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id },
    })

    if (!existingTask || existingTask.userId !== session.user.id) {
      return apiResponse.notFound('Task not found')
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) {
      if (typeof title === 'string') {
        updateData.title = title.trim() || existingTask.title
      }
    }
    if (description !== undefined) {
      updateData.description = typeof description === 'string' ? description.trim() : null
    }
    if (status !== undefined) {
      // Normalize status to uppercase to match Prisma enum
      const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : status
      // Validate status against Prisma enum
      const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
      if (validStatuses.includes(normalizedStatus)) {
        updateData.status = normalizedStatus
        // Always update completedAt when status changes to/from COMPLETED
        if (normalizedStatus === 'COMPLETED') {
          updateData.completedAt = new Date()
        } else if (normalizedStatus !== 'COMPLETED') {
          updateData.completedAt = null
        }
      }
    }
    
    // Handle explicit completedAt updates
    if (body.completedAt !== undefined) {
      updateData.completedAt = body.completedAt ? new Date(body.completedAt) : null
    }
    if (urgent !== undefined) updateData.urgent = Boolean(urgent)
    if (important !== undefined) updateData.important = Boolean(important)
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null
    }
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId || null
    }
    if (estimatedTime !== undefined) {
      updateData.estimatedTime = typeof estimatedTime === 'number' && !Number.isNaN(estimatedTime)
        ? Math.max(1, Math.min(1440, estimatedTime)) // 1 min to 24 hours
        : null
    }
    if (energyLevel !== undefined) {
      updateData.energyLevel = energyLevel || null
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        subtasks: true,
      },
    })

    // Clear cache for this user's tasks
    const userId = session.user.id
    for (let i = 1; i <= 10; i++) { // Clear first 10 pages
      APICache.delete(`tasks:${userId}:${i}:20`)
    }
    // Also clear user stats cache since task status changed
    APICache.delete(`user-stats:${userId}`)

    return apiResponse.success(task)
  } catch (error: any) {
    console.error('Update task error:', error)
    
    // Handle specific database errors
    if (error.code === 'P2025') {
      return apiResponse.notFound('Task not found or already deleted')
    }
    
    return apiResponse.error('Failed to update task', 500, error.message)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return apiResponse.unauthorized()
    }

    const { id } = await context.params

    // Validate task ID format
    if (!id || typeof id !== 'string') {
      return apiResponse.error('Invalid task ID', 400)
    }

    // Verify task belongs to user
    const existingTask = await prisma.task.findUnique({
      where: { id },
    })

    if (!existingTask || existingTask.userId !== session.user.id) {
      return apiResponse.notFound('Task not found')
    }

    await prisma.task.delete({
      where: { id },
    })

    // Clear cache for this user's tasks
    const userId = session.user.id
    for (let i = 1; i <= 10; i++) { // Clear first 10 pages
      APICache.delete(`tasks:${userId}:${i}:20`)
    }
    // Also clear user stats cache since task was deleted
    APICache.delete(`user-stats:${userId}`)

    return apiResponse.success({ message: 'Task deleted successfully' })
  } catch (error: any) {
    console.error('Delete task error:', error)
    
    // Handle specific database errors
    if (error.code === 'P2025') {
      return apiResponse.notFound('Task not found or already deleted')
    }
    
    return apiResponse.error('Failed to delete task', 500, error.message)
  }
}
