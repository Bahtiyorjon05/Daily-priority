import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/habits/[id] - Update a habit
export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Check if habit belongs to user
    const existingHabit = await prisma.habit.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingHabit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    const habit = await prisma.habit.update({
      where: {
        id: params.id,
        userId: session.user.id
      },
      data: {
        title: body.title,
        description: body.description,
        frequency: body.frequency,
        targetDays: body.targetDays
      }
    })

    return NextResponse.json(habit)
  } catch (error) {
    console.error('Error updating habit:', error)
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 })
  }
}

// DELETE /api/habits/[id] - Delete a habit
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if habit belongs to user
    const existingHabit = await prisma.habit.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!existingHabit) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
    }

    // Delete habit and all its completions
    await prisma.habit.delete({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    return NextResponse.json({ message: 'Habit deleted successfully' })
  } catch (error) {
    console.error('Error deleting habit:', error)
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 })
  }
}