import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side proxy for Aladhan Prayer Times API
 * This bypasses CORS issues and provides better error handling
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')
    const day = searchParams.get('day')
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const school = searchParams.get('school') || '0' // 0=Standard Shafi, 1=Hanafi

    // Validation
    if (!latitude || !longitude || !day || !month || !year) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: latitude, longitude, day, month, year'
        },
        { status: 400 }
      )
    }

    // Validate coordinates
    const lat = parseFloat(latitude)
    const lon = parseFloat(longitude)

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { success: false, error: 'Invalid coordinate format' },
        { status: 400 }
      )
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        { success: false, error: 'Coordinates out of valid range (-90 to 90 for latitude, -180 to 180 for longitude)' },
        { status: 400 }
      )
    }

    // Call Aladhan API from server side (bypasses CORS)
    // school parameter: 0=Standard (Shafi, Maliki, Hanbali), 1=Hanafi
    const aladhanUrl = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${lat}&longitude=${lon}&method=2&school=${school}`

    console.log('Fetching prayer times from Aladhan:', aladhanUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('Prayer times API timeout'), 10000) // 10 second timeout

    const response = await fetch(aladhanUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DailyPriority/1.0',
      },
      signal: controller.signal,
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('Aladhan API error:', response.status, response.statusText)
      const errorText = await response.text().catch(() => 'No error details')
      console.error('Aladhan error details:', errorText)
      throw new Error(`Aladhan API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data || !data.data || !data.data.timings) {
      console.error('Invalid Aladhan response structure:', JSON.stringify(data).substring(0, 200))
      throw new Error('Invalid response structure from Aladhan API')
    }

    const timings = data.data.timings
    const dateInfo = data.data.date

    // Format times (remove timezone and seconds)
    const formatTime = (time: string): string => {
      const cleanTime = time.split(' ')[0]
      const [hours, minutes] = cleanTime.split(':')
      return `${hours}:${minutes}`
    }

    const prayerTimes = {
      fajr: formatTime(timings.Fajr),
      dhuhr: formatTime(timings.Dhuhr),
      asr: formatTime(timings.Asr),
      maghrib: formatTime(timings.Maghrib),
      isha: formatTime(timings.Isha),
      sunrise: formatTime(timings.Sunrise || '06:30'),
      date: dateInfo.readable || 'Unknown',
      hijriDate: dateInfo.hijri
        ? `${dateInfo.hijri.date} ${dateInfo.hijri.month.en} ${dateInfo.hijri.year}`
        : 'Unknown'
    }

    console.log('Successfully fetched prayer times:', prayerTimes)

    return NextResponse.json({
      success: true,
      data: prayerTimes
    })

  } catch (error) {
    console.error('Prayer times fetch error:', error)

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Request timeout - Aladhan API did not respond in time' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prayer times from Aladhan API'
      },
      { status: 500 }
    )
  }
}
