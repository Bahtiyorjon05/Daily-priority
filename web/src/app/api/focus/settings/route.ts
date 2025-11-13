import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/focus/settings - Get user's focus settings
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const settings = await prisma.userSettings.findUnique({
      where: {
        userId: session.user.id
      },
      select: {
        focusDuration: true,
        shortBreakDuration: true,
        longBreakDuration: true,
        autoStartBreaks: true,
        autoStartFocus: true,
        enableMusic: true,
        musicVolume: true
      }
    })
    
    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({
        focusDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        autoStartBreaks: false,
        autoStartFocus: false,
        enableMusic: true,
        musicVolume: 50
      })
    }
    
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error fetching focus settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST /api/focus/settings - Update user's focus settings
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const {
      focusDuration,
      shortBreakDuration,
      longBreakDuration,
      autoStartBreaks,
      autoStartFocus,
      enableMusic,
      musicVolume
    } = body
    
    // Validation
    if (focusDuration !== undefined && (focusDuration < 1 || focusDuration > 120)) {
      return NextResponse.json({ 
        error: 'Focus duration must be between 1 and 120 minutes' 
      }, { status: 400 })
    }
    
    if (shortBreakDuration !== undefined && (shortBreakDuration < 1 || shortBreakDuration > 30)) {
      return NextResponse.json({ 
        error: 'Short break duration must be between 1 and 30 minutes' 
      }, { status: 400 })
    }
    
    if (longBreakDuration !== undefined && (longBreakDuration < 1 || longBreakDuration > 60)) {
      return NextResponse.json({ 
        error: 'Long break duration must be between 1 and 60 minutes' 
      }, { status: 400 })
    }
    
    if (musicVolume !== undefined && (musicVolume < 0 || musicVolume > 100)) {
      return NextResponse.json({ 
        error: 'Music volume must be between 0 and 100' 
      }, { status: 400 })
    }
    
    const settings = await prisma.userSettings.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        ...(focusDuration !== undefined && { focusDuration }),
        ...(shortBreakDuration !== undefined && { shortBreakDuration }),
        ...(longBreakDuration !== undefined && { longBreakDuration }),
        ...(autoStartBreaks !== undefined && { autoStartBreaks }),
        ...(autoStartFocus !== undefined && { autoStartFocus }),
        ...(enableMusic !== undefined && { enableMusic }),
        ...(musicVolume !== undefined && { musicVolume })
      },
      create: {
        userId: session.user.id,
        focusDuration: focusDuration || 25,
        shortBreakDuration: shortBreakDuration || 5,
        longBreakDuration: longBreakDuration || 15,
        autoStartBreaks: autoStartBreaks || false,
        autoStartFocus: autoStartFocus || false,
        enableMusic: enableMusic !== undefined ? enableMusic : true,
        musicVolume: musicVolume || 50
      }
    })
    
    return NextResponse.json({
      message: 'Settings updated successfully',
      settings
    })
  } catch (error: any) {
    console.error('Error updating focus settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 400 })
  }
}
