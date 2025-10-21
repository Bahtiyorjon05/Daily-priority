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

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Transform to frontend format
    const transformedEntries = entries.map(entry => ({
      id: entry.id,
      date: entry.date.toISOString().split('T')[0],
      gratitude: [entry.gratitude1, entry.gratitude2, entry.gratitude3].filter(Boolean),
      reflection: entry.reflection || '',
      mood: entry.mood || 'good',
      achievements: [], // Legacy field - can be added to schema if needed
      createdAt: entry.date.toISOString(),
    }))

    return NextResponse.json(transformedEntries)
  } catch (error: any) {
    console.error('Error fetching journal entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch journal entries', details: error.message },
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
    const { gratitude, reflection, mood, date } = body

    const entry = await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        date: date ? new Date(date) : new Date(),
        gratitude1: gratitude?.[0] || null,
        gratitude2: gratitude?.[1] || null,
        gratitude3: gratitude?.[2] || null,
        reflection: reflection || null,
        mood: mood || 'good',
      },
    })

    return NextResponse.json({
      id: entry.id,
      date: entry.date.toISOString().split('T')[0],
      gratitude: [entry.gratitude1, entry.gratitude2, entry.gratitude3].filter(Boolean),
      reflection: entry.reflection || '',
      mood: entry.mood || 'good',
      achievements: [],
      createdAt: entry.date.toISOString(),
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating journal entry:', error)
    return NextResponse.json(
      { error: 'Failed to create journal entry', details: error.message },
      { status: 500 }
    )
  }
}
