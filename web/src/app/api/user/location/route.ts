import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { latitude, longitude, city, country, timezone } = body

    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      return NextResponse.json({ 
        error: 'Latitude and longitude are required' 
      }, { status: 400 })
    }

    // Format location string consistently: "City, Country (lat, lon)"
    let location: string
    if (city && country) {
      location = `${city}, ${country} (${latitude}, ${longitude})`
    } else {
      location = `${latitude}, ${longitude}`
    }

    // Update user's location and timezone
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        location,
        timezone: timezone || 'UTC',
        updatedAt: new Date()
      },
      select: {
        id: true,
        location: true,
        timezone: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'Location updated successfully'
    })
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        location: true,
        timezone: true
      }
    })

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    )
  }
}
