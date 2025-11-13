import { NextRequest, NextResponse } from 'next/server'

/**
 * Calculate Qibla direction from coordinates to Kaaba
 */
function calculateQiblaDirection(latitude: number, longitude: number): number {
  const kaabaLat = 21.4225 // Kaaba latitude
  const kaabaLon = 39.8262 // Kaaba longitude

  const lat1 = (latitude * Math.PI) / 180
  const lat2 = (kaabaLat * Math.PI) / 180
  const deltaLon = ((kaabaLon - longitude) * Math.PI) / 180

  const x = Math.sin(deltaLon) * Math.cos(lat2)
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon)

  let bearing = Math.atan2(x, y)
  bearing = (bearing * 180) / Math.PI
  bearing = (bearing + 360) % 360

  return Math.round(bearing)
}

/**
 * Server-side API for Qibla direction
 * Tries Aladhan API first, falls back to calculation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = parseFloat(searchParams.get('latitude') || '0')
    const longitude = parseFloat(searchParams.get('longitude') || '0')

    // Validation
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { success: false, error: 'Valid latitude and longitude are required' },
        { status: 400 }
      )
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { success: false, error: 'Coordinates out of valid range' },
        { status: 400 }
      )
    }

    // Try Aladhan API first (may provide more accurate results based on location)
    try {
      const aladhanUrl = `https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`

      console.log('Fetching Qibla direction from Aladhan:', aladhanUrl)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort('Qibla API timeout'), 8000) // 8 second timeout

      const response = await fetch(aladhanUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DailyPriority/1.0',
        },
        signal: controller.signal,
        next: { revalidate: 604800 }, // Cache for 7 days (Qibla doesn't change)
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()

        if (data && data.data && typeof data.data.direction === 'number') {
          console.log('Qibla direction from Aladhan:', data.data.direction)

          return NextResponse.json({
            success: true,
            data: {
              direction: Math.round(data.data.direction),
              source: 'aladhan-api'
            }
          })
        }
      }
    } catch (apiError) {
      console.warn('Aladhan API failed, using calculation:', apiError)
    }

    // Fallback to mathematical calculation
    const calculatedDirection = calculateQiblaDirection(latitude, longitude)

    console.log('Qibla direction calculated:', calculatedDirection)

    return NextResponse.json({
      success: true,
      data: {
        direction: calculatedDirection,
        source: 'calculation'
      }
    })

  } catch (error) {
    console.error('Qibla direction error:', error)

    // Even on error, try to calculate
    try {
      const { searchParams } = new URL(request.url)
      const latitude = parseFloat(searchParams.get('latitude') || '0')
      const longitude = parseFloat(searchParams.get('longitude') || '0')

      if (latitude && longitude) {
        const direction = calculateQiblaDirection(latitude, longitude)
        return NextResponse.json({
          success: true,
          data: {
            direction,
            source: 'calculation-fallback'
          }
        })
      }
    } catch {
      // If even calculation fails, return error
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get Qibla direction'
      },
      { status: 500 }
    )
  }
}
