import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side API for Gregorian to Hijri date conversion
 * Bypasses CORS by calling Aladhan API from server
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // Format: DD-MM-YYYY

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter required (format: DD-MM-YYYY)' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{1,2}-\d{1,2}-\d{4}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use DD-MM-YYYY or D-M-YYYY' },
        { status: 400 }
      )
    }

    // Call Aladhan API for conversion
    const aladhanUrl = `https://api.aladhan.com/v1/gToH/${date}`

    console.log('Converting Gregorian to Hijri:', aladhanUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('Hijri conversion API timeout'), 10000)

    const response = await fetch(aladhanUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DailyPriority/1.0',
      },
      signal: controller.signal,
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('Aladhan API error:', response.status)
      throw new Error(`Aladhan API returned ${response.status}`)
    }

    const data = await response.json()

    if (!data || !data.data || !data.data.hijri) {
      console.error('Invalid response structure:', JSON.stringify(data).substring(0, 200))
      throw new Error('Invalid response structure from Aladhan API')
    }

    const hijri = data.data.hijri
    const gregorian = data.data.gregorian

    console.log('Successfully converted to Hijri:', hijri.date)

    return NextResponse.json({
      success: true,
      data: {
        hijri: {
          date: hijri.date,
          day: parseInt(hijri.day),
          month: {
            number: parseInt(hijri.month.number),
            en: hijri.month.en,
            ar: hijri.month.ar,
          },
          year: parseInt(hijri.year),
          designation: hijri.designation,
          weekday: {
            en: hijri.weekday.en,
            ar: hijri.weekday.ar
          },
          formatted: `${hijri.day} ${hijri.month.en} ${hijri.year} AH`
        },
        gregorian: {
          date: gregorian.date,
          day: gregorian.day,
          month: gregorian.month,
          year: gregorian.year
        }
      }
    })

  } catch (error) {
    console.error('Hijri conversion error:', error)

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Request timeout - Aladhan API did not respond in time' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed'
      },
      { status: 500 }
    )
  }
}

/**
 * Hijri to Gregorian conversion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { day, month, year } = body

    if (!day || !month || !year) {
      return NextResponse.json(
        { success: false, error: 'Day, month, and year are required' },
        { status: 400 }
      )
    }

    // Call Aladhan API for conversion
    const aladhanUrl = `https://api.aladhan.com/v1/hToG/${day}-${month}-${year}`

    console.log('Converting Hijri to Gregorian:', aladhanUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('Hijri to Gregorian API timeout'), 10000)

    const response = await fetch(aladhanUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'DailyPriority/1.0',
      },
      signal: controller.signal,
      next: { revalidate: 86400 }, // Cache for 24 hours
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Aladhan API returned ${response.status}`)
    }

    const data = await response.json()

    if (!data || !data.data || !data.data.gregorian) {
      throw new Error('Invalid response structure')
    }

    const gregorian = data.data.gregorian

    return NextResponse.json({
      success: true,
      data: {
        gregorian: {
          date: gregorian.date,
          day: parseInt(gregorian.day),
          month: parseInt(gregorian.month.number),
          year: parseInt(gregorian.year),
          formatted: `${gregorian.day} ${gregorian.month.en} ${gregorian.year}`
        }
      }
    })

  } catch (error) {
    console.error('Hijri to Gregorian conversion error:', error)

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Request timeout' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed'
      },
      { status: 500 }
    )
  }
}
