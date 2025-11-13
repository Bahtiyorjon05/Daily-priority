import { NextRequest, NextResponse } from 'next/server'

/**
 * FAST Hijri calendar - gets entire Gregorian month with ONE API call
 * Uses Aladhan's calendar endpoint for maximum performance
 */

// Islamic holidays and important dates (Hijri calendar)
const ISLAMIC_EVENTS: Record<string, string> = {
  '1-1': '🌙 Islamic New Year',
  '10-1': '⭐ Day of Ashura',
  '12-3': '🕌 Mawlid al-Nabi',
  '27-7': '✨ Isra & Mi\'raj',
  '15-8': "🌟 Laylat al-Bara'ah",
  '1-9': '🌙 Ramadan Begins',
  '27-9': '⭐ Laylat al-Qadr',
  '1-10': '🎉 Eid al-Fitr',
  '9-12': '🕋 Day of Arafah',
  '10-12': '🎉 Eid al-Adha',
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // 1-12
    const year = searchParams.get('year')

    if (!month || !year) {
      return NextResponse.json(
        { success: false, error: 'Month and year parameters required' },
        { status: 400 }
      )
    }

    const monthNum = parseInt(month, 10)
    const yearNum = parseInt(year, 10)

    if (monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
      return NextResponse.json(
        { success: false, error: 'Invalid month or year' },
        { status: 400 }
      )
    }

    // ONE API CALL for entire month! Super fast! ⚡
    const response = await fetch(
      `https://api.aladhan.com/v1/gToHCalendar/${monthNum}/${yearNum}`,
      {
        next: { revalidate: 86400 } // Cache for 24 hours
      }
    )

    if (!response.ok) {
      throw new Error(`Aladhan API returned ${response.status}`)
    }

    const data = await response.json()

    if (data.code !== 200 || !data.data) {
      throw new Error('Invalid response from Aladhan API')
    }

    // Process the calendar data
    const hijriDates: Record<string, { 
      day: number
      month: string
      monthAr: string
      year: number
      event?: string
    }> = {}

    // data.data is array of days in the month
    data.data.forEach((dayData: any) => {
      const gregorian = dayData.gregorian
      const hijri = dayData.hijri
      
      const key = `${yearNum}-${monthNum}-${parseInt(gregorian.day, 10)}`
      
      // Check for Islamic events
      const eventKey = `${parseInt(hijri.day, 10)}-${parseInt(hijri.month.number, 10)}`
      const event = ISLAMIC_EVENTS[eventKey]
      
      hijriDates[key] = {
        day: parseInt(hijri.day, 10),
        month: hijri.month.en, // Full month name
        monthAr: hijri.month.ar,
        year: parseInt(hijri.year, 10),
        ...(event && { event })
      }
    })

    return NextResponse.json({
      success: true,
      data: hijriDates
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      }
    })

  } catch (error) {
    console.error('Hijri calendar error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Calendar fetch failed'
      },
      { status: 500 }
    )
  }
}
