import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  sanitizeText,
  sanitizeDate,
  sanitizeEnum,
  sanitizeString,
} from '@/lib/sanitize'

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

    // Serialize dates to avoid Next.js serialization issues
    const serializedEntries = entries.map(entry => ({
      ...entry,
      date: entry.date.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    }))

    return NextResponse.json({ entries: serializedEntries })
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
    const {
      gratitude1,
      gratitude2,
      gratitude3,
      goodDeeds,
      lessons,
      duas,
      reflection,
      mood,
      date,
      hijriDate,
    } = body

    // Sanitize all text inputs
    const sanitizedGratitude1 = sanitizeText(gratitude1)
    const sanitizedGratitude2 = sanitizeText(gratitude2)
    const sanitizedGratitude3 = sanitizeText(gratitude3)
    const sanitizedGoodDeeds = sanitizeText(goodDeeds)
    const sanitizedLessons = sanitizeText(lessons)
    const sanitizedDuas = sanitizeText(duas)
    const sanitizedReflection = sanitizeText(reflection)
    const sanitizedHijriDate = sanitizeString(hijriDate)

    // Sanitize mood enum - must match frontend MOODS array
    const sanitizedMood = sanitizeEnum(mood, [
      'happy',
      'grateful',
      'peaceful',
      'neutral',
      'sad',
    ] as const)

    // Sanitize date
    const sanitizedDate = sanitizeDate(date) || new Date()

    const entry = await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        date: sanitizedDate,
        gratitude1: sanitizedGratitude1 || null,
        gratitude2: sanitizedGratitude2 || null,
        gratitude3: sanitizedGratitude3 || null,
        goodDeeds: sanitizedGoodDeeds || null,
        lessons: sanitizedLessons || null,
        duas: sanitizedDuas || null,
        reflection: sanitizedReflection || null,
        mood: sanitizedMood || 'neutral',
        hijriDate: sanitizedHijriDate || null,
      },
    })

    // Serialize dates
    const serializedEntry = {
      ...entry,
      date: entry.date.toISOString(),
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    }

    return NextResponse.json({ entry: serializedEntry }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating journal entry:', error)
    return NextResponse.json(
      { error: 'Failed to create journal entry', details: error.message },
      { status: 500 }
    )
  }
}
