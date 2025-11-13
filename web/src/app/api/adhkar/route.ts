import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ADHKAR_LIST } from './data'

// GET /api/adhkar - Fetch adhkar progress for a date
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString()
    const category = searchParams.get('category')

    const targetDate = new Date(date)
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0))
    const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999))

    const whereClause: any = {
      userId: session.user.id,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    }

    if (category) {
      whereClause.category = category
    }

    const progress = await prisma.adhkarProgress.findMany({
      where: whereClause,
    })

    return NextResponse.json({ progress })
  } catch (error) {
    console.error('Error fetching adhkar progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch adhkar progress' },
      { status: 500 }
    )
  }
}

// POST /api/adhkar - Update adhkar count
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { adhkarId, adhkarName, category, count, target } = body

    if (!adhkarId || !category || count === undefined || !target) {
      return NextResponse.json(
        { error: 'Required fields missing' },
        { status: 400 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const progress = await prisma.adhkarProgress.upsert({
      where: {
        userId_adhkarId_date: {
          userId: session.user.id,
          adhkarId,
          date: today,
        },
      },
      update: {
        count,
        completed: count >= target,
      },
      create: {
        userId: session.user.id,
        adhkarId,
        adhkarName: adhkarName || adhkarId,
        category,
        count,
        target,
        date: today,
        completed: count >= target,
      },
    })

    return NextResponse.json({ progress })
  } catch (error) {
    console.error('Error updating adhkar progress:', error)
    return NextResponse.json(
      { error: 'Failed to update adhkar progress' },
      { status: 500 }
    )
  }
}
