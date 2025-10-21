import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const { title, description, category, target, progress, deadline, completed } = body

    // Verify goal belongs to user
    const existingGoal = await prisma.goal.findUnique({
      where: { id },
    })

    if (!existingGoal || existingGoal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (target !== undefined) updateData.target = parseInt(target)
    if (progress !== undefined) {
      updateData.progress = parseInt(progress)
      // Auto-complete if progress reaches target
      if (parseInt(progress) >= existingGoal.target) {
        updateData.completed = true
      }
    }
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null
    if (completed !== undefined) updateData.completed = completed

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(goal)
  } catch (error: any) {
    console.error('Update goal error:', error)
    return NextResponse.json(
      { error: 'Failed to update goal', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Verify goal belongs to user
    const existingGoal = await prisma.goal.findUnique({
      where: { id },
    })

    if (!existingGoal || existingGoal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    await prisma.goal.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Goal deleted successfully' })
  } catch (error: any) {
    console.error('Delete goal error:', error)
    return NextResponse.json(
      { error: 'Failed to delete goal', details: error.message },
      { status: 500 }
    )
  }
}
