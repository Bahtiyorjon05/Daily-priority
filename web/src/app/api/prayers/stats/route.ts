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
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const prayerLogs = await prisma.prayerTracking.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
        },
      },
    })

    // Calculate statistics
    const totalPrayers = prayerLogs.length
    const completedPrayers = prayerLogs.filter((log) => log.completedAt !== null).length
    const onTimePrayers = prayerLogs.filter((log) => log.onTime).length
    const completionRate = totalPrayers > 0 ? (completedPrayers / totalPrayers) * 100 : 0
    const onTimeRate = completedPrayers > 0 ? (onTimePrayers / completedPrayers) * 100 : 0

    // Calculate streak (consecutive days with all 5 prayers completed)
    const prayersByDate = new Map<string, any[]>()
    prayerLogs.forEach((log) => {
      const dateStr = log.date.toISOString().split('T')[0]
      if (!prayersByDate.has(dateStr)) {
        prayersByDate.set(dateStr, [])
      }
      prayersByDate.get(dateStr)!.push(log)
    })

    let currentStreak = 0
    let bestStreak = 0
    let tempStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check streak backwards from today
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      const dayPrayers = prayersByDate.get(dateStr) || []
      const completedCount = dayPrayers.filter((p) => p.completedAt !== null).length

      if (completedCount === 5) {
        tempStreak++
        if (i === 0 || tempStreak === currentStreak + 1) {
          currentStreak = tempStreak
        }
        bestStreak = Math.max(bestStreak, tempStreak)
      } else {
        if (i === 0) {
          currentStreak = 0
        }
        tempStreak = 0
      }
    }

    // Prayer-specific stats
    const prayerStats = {
      FAJR: { completed: 0, onTime: 0, total: 0 },
      DHUHR: { completed: 0, onTime: 0, total: 0 },
      ASR: { completed: 0, onTime: 0, total: 0 },
      MAGHRIB: { completed: 0, onTime: 0, total: 0 },
      ISHA: { completed: 0, onTime: 0, total: 0 },
    }

    prayerLogs.forEach((log) => {
      const prayer = log.prayerName
      prayerStats[prayer].total++
      if (log.completedAt) {
        prayerStats[prayer].completed++
        if (log.onTime) {
          prayerStats[prayer].onTime++
        }
      }
    })

    return NextResponse.json({
      totalPrayers,
      completedPrayers,
      onTimePrayers,
      completionRate: Math.round(completionRate * 100) / 100,
      onTimeRate: Math.round(onTimeRate * 100) / 100,
      currentStreak,
      bestStreak,
      prayerStats,
    })
  } catch (error) {
    console.error('Error fetching prayer stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prayer stats' },
      { status: 500 }
    )
  }
}
