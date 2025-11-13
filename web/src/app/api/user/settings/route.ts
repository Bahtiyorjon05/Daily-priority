import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_SETTINGS = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartFocus: false,
  enableMusic: true,
  musicVolume: 50,
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      data: settings ?? { ...DEFAULT_SETTINGS, userId },
    })
  } catch (error) {
    console.error('Failed to fetch user settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const allowedKeys = [
      'focusDuration',
      'shortBreakDuration',
      'longBreakDuration',
      'autoStartBreaks',
      'autoStartFocus',
      'enableMusic',
      'musicVolume',
    ] as const

    const updates: Record<string, unknown> = {}
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updates[key] = body[key]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No settings provided' }, { status: 400 })
    }

    const userId = session.user.id
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: updates,
      create: {
        userId,
        ...DEFAULT_SETTINGS,
        ...updates,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedSettings,
    })
  } catch (error) {
    console.error('Failed to update user settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
