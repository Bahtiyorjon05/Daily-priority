import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const date = searchParams.get('date')

    let whereClause: any = {
      userId: session.user.id,
    }

    if (date) {
      const targetDate = new Date(date)
      const dayStart = new Date(targetDate.setHours(0, 0, 0, 0))
      const dayEnd = new Date(targetDate.setHours(23, 59, 59, 999))
      whereClause.date = {
        gte: dayStart,
        lte: dayEnd,
      }
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const prayerLogs = await prisma.prayerTracking.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json({ prayerLogs })
  } catch (error) {
    console.error('Error fetching prayer logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prayer logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, prayerName, completed, onTime } = body

    if (!date || !prayerName) {
      return NextResponse.json(
        { error: 'Date and prayer name are required' },
        { status: 400 }
      )
    }

    const validPrayers = ['FAJR', 'DHUHR', 'ASR', 'MAGHRIB', 'ISHA']
    if (!validPrayers.includes(prayerName.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid prayer name' },
        { status: 400 }
      )
    }

    const targetDate = new Date(date)
    const dayStart = new Date(targetDate.setHours(0, 0, 0, 0))

    const prayerLog = await prisma.prayerTracking.upsert({
      where: {
        userId_date_prayerName: {
          userId: session.user.id,
          date: dayStart,
          prayerName: prayerName.toUpperCase(),
        },
      },
      update: {
        completedAt: completed ? new Date() : null,
        onTime: onTime || false,
      },
      create: {
        userId: session.user.id,
        date: dayStart,
        prayerName: prayerName.toUpperCase(),
        completedAt: completed ? new Date() : null,
        onTime: onTime || false,
      },
    })

    return NextResponse.json({ prayerLog })
  } catch (error) {
    console.error('Error tracking prayer:', error)
    return NextResponse.json(
      { error: 'Failed to track prayer' },
      { status: 500 }
    )
  }
}
