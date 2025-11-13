import { NextRequest, NextResponse } from 'next/server'
import { getCityFromCoordinates, getQiblaDirection } from '@/lib/prayer-times'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = parseFloat(searchParams.get('latitude') || '0')
    const longitude = parseFloat(searchParams.get('longitude') || '0')

    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid latitude and longitude are required'
        },
        { status: 400 }
      )
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coordinates out of valid range'
        },
        { status: 400 }
      )
    }

    // Call the internal fetch API to get prayer times
    const today = new Date()
    const baseUrl = request.nextUrl.origin
    const fetchUrl = `${baseUrl}/api/prayer-times/fetch?latitude=${latitude}&longitude=${longitude}&day=${today.getDate()}&month=${today.getMonth() + 1}&year=${today.getFullYear()}`

    console.log('Fetching prayer times via internal API:', fetchUrl)

    const prayerResponse = await fetch(fetchUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })

    const prayerResult = await prayerResponse.json()

    if (!prayerResult.success) {
      console.error('Prayer fetch failed:', prayerResult.error)
      throw new Error(prayerResult.error || 'Failed to fetch prayer times')
    }

    const prayerTimes = prayerResult.data

    // Fetch location info and Qibla direction in parallel
    const [locationInfo, qiblaDirection] = await Promise.all([
      getCityFromCoordinates(latitude, longitude),
      getQiblaDirection(latitude, longitude)
    ])

    return NextResponse.json({
      success: true,
      data: {
        prayerTimes,
        location: {
          latitude,
          longitude,
          ...locationInfo
        },
        qiblaDirection: qiblaDirection || 0
      }
    })
  } catch (error) {
    console.error('Prayer times API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}
