import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(goals)
  } catch (error: any) {
    console.error('Error fetching goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch goals', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, target, deadline } = body

    if (!title || !category || !target) {
      return NextResponse.json(
        { error: 'Missing required fields: title, category, target' },
        { status: 400 }
      )
    }

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        title,
        description: description || null,
        category,
        target: parseInt(target),
        deadline: deadline ? new Date(deadline) : null,
        progress: 0,
        completed: false,
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error: any) {
    console.error('Error creating goal:', error)
    return NextResponse.json(
      { error: 'Failed to create goal', details: error.message },
      { status: 500 }
    )
  }
}
