import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  sanitizeTitle,
  sanitizeText,
  sanitizeNumber,
  sanitizeDate,
  sanitizeEnum,
} from '@/lib/sanitize'

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

    // Calculate stats
    const total = goals.length
    const completed = goals.filter(g => g.completed).length
    const active = goals.filter(g => !g.completed && g.status === 'IN_PROGRESS').length
    const overdue = goals.filter(g => 
      !g.completed && 
      g.deadline && 
      new Date(g.deadline) < new Date()
    ).length
    
    const dunyaGoals = goals.filter(g => g.goalType === 'DUNYA')
    const akhirahGoals = goals.filter(g => g.goalType === 'AKHIRAH')
    
    const stats = {
      total,
      completed,
      active,
      overdue,
      dunya: {
        total: dunyaGoals.length,
        completed: dunyaGoals.filter(g => g.completed).length,
        progress: dunyaGoals.length > 0 ? 
          dunyaGoals.reduce((sum, g) => sum + g.progress, 0) / dunyaGoals.length : 0
      },
      akhirah: {
        total: akhirahGoals.length,
        completed: akhirahGoals.filter(g => g.completed).length,
        progress: akhirahGoals.length > 0 ? 
          akhirahGoals.reduce((sum, g) => sum + g.progress, 0) / akhirahGoals.length : 0
      }
    }

    return NextResponse.json({ goals, stats })
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
    const { title, description, category, target, deadline, goalType } = body

    // Sanitize and validate inputs
    const sanitizedTitle = sanitizeTitle(title)
    const sanitizedCategory = category
      ? (sanitizeEnum(category, [
          'IBADAH',
          'KNOWLEDGE',
          'FAMILY',
          'WORK',
          'HEALTH',
          'COMMUNITY',
          'PERSONAL',
        ] as const) as 'IBADAH' | 'KNOWLEDGE' | 'FAMILY' | 'WORK' | 'HEALTH' | 'COMMUNITY' | 'PERSONAL')
      : 'PERSONAL'
    const sanitizedTarget = sanitizeNumber(target, 1, 1000000)

    if (!sanitizedTitle || !sanitizedTarget) {
      return NextResponse.json(
        {
          error: 'Title and target are required',
        },
        { status: 400 }
      )
    }

    const sanitizedDescription = sanitizeText(description)
    const sanitizedDeadline = sanitizeDate(deadline)
    const sanitizedGoalType = sanitizeEnum(goalType, [
      'DUNYA',
      'AKHIRAH',
    ] as const)

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        title: sanitizedTitle,
        description: sanitizedDescription || null,
        category: sanitizedCategory,
        target: sanitizedTarget,
        deadline: sanitizedDeadline,
        goalType: sanitizedGoalType || 'DUNYA',
        progress: 0,
        completed: false,
        status: 'IN_PROGRESS',
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
