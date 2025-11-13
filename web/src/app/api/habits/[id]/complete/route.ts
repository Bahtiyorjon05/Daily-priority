import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/habits/[id]/complete - Mark a habit as completed
export async function POST(
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
    const date = body.date ? new Date(body.date) : new Date()

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

    // Check if completion already exists for this date
    const existingCompletion = await prisma.habitCompletion.findUnique({
      where: {
        habitId_date: {
          habitId: params.id,
          date: date
        }
      }
    })

    if (existingCompletion) {
      return NextResponse.json({
        message: 'Habit already completed for this date',
        completed: true,
        completion: existingCompletion
      })
    }

    // Create new completion
    const completion = await prisma.habitCompletion.create({
      data: {
        habitId: params.id,
        date: date,
        note: body.note
      }
    })

    return NextResponse.json({
      message: 'Habit marked as completed',
      completed: true,
      completion
    })
  } catch (error) {
    console.error('Error completing habit:', error)
    return NextResponse.json({ error: 'Failed to complete habit' }, { status: 500 })
  }
}

// DELETE /api/habits/[id]/complete - Remove habit completion
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

    const body = await request.json()
    const date = body.date ? new Date(body.date) : new Date()

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

    // Find and delete completion
    const existingCompletion = await prisma.habitCompletion.findUnique({
      where: {
        habitId_date: {
          habitId: params.id,
          date: date
        }
      }
    })

    if (!existingCompletion) {
      return NextResponse.json({
        message: 'No completion found for this date',
        completed: false
      })
    }

    await prisma.habitCompletion.delete({
      where: {
        id: existingCompletion.id
      }
    })

    return NextResponse.json({
      message: 'Habit completion removed',
      completed: false
    })
  } catch (error) {
    console.error('Error removing habit completion:', error)
    return NextResponse.json({ error: 'Failed to remove completion' }, { status: 500 })
  }
}