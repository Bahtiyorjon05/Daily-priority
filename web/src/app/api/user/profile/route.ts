import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        preferences: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create default preferences structure for frontend
    const defaultPreferences = {
      theme: 'system',
      language: user.preferences?.language || 'en',
      notifications: {
        email: true,
        push: user.preferences?.prayerNotifications ?? true,
        taskReminders: true,
        goalUpdates: true,
        weeklyReport: true
      },
      privacy: {
        profileVisibility: 'private',
        showActivity: true,
        showStats: true
      },
      dashboard: {
        startPage: 'dashboard',
        showGreeting: true,
        showQuote: true,
        showWeather: false
      }
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        location: user.location,
        timezone: user.timezone,
        preferences: defaultPreferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, image, location, timezone, preferences } = body

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(image && { image }),
        ...(location !== undefined && { location }),
        ...(timezone && { timezone }),
        updatedAt: new Date()
      }
    })

    // Update or create user preferences
    if (preferences) {
      await prisma.userPreference.upsert({
        where: { userId: session.user.id },
        update: {
          language: preferences.language || 'en',
          prayerNotifications: preferences.notifications?.push ?? true
        },
        create: {
          userId: session.user.id,
          language: preferences.language || 'en',
          prayerNotifications: preferences.notifications?.push ?? true
        }
      })
    }

    // Fetch updated user with preferences
    const userWithPreferences = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        preferences: true
      }
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        ...updatedUser,
        preferences: {
          theme: 'system',
          language: userWithPreferences?.preferences?.language || 'en',
          notifications: {
            email: true,
            push: userWithPreferences?.preferences?.prayerNotifications ?? true,
            taskReminders: true,
            goalUpdates: true,
            weeklyReport: true
          },
          privacy: {
            profileVisibility: 'private',
            showActivity: true,
            showStats: true
          },
          dashboard: {
            startPage: 'dashboard',
            showGreeting: true,
            showQuote: true,
            showWeather: false
          }
        }
      }
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
