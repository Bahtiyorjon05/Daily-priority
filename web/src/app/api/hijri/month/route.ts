import { NextRequest, NextResponse } from 'next/server'

/**
 * FAST Hijri calendar - gets entire Gregorian month with ONE API call
 * Uses Aladhan's calendar endpoint for maximum performance
 */

/*
  Islamic holidays, as message keys.

  These were English strings rendered straight onto the calendar, so an Uzbek
  reader's month grid said "Eid al-Fitr" and "Ramadan Begins". The emoji is kept
  separate from the name: an emoji is the same in every language, a name is not.
*/
const ISLAMIC_EVENTS: Record<string, { key: string; emoji: string }> = {
  '1-1': { key: 'ui.islamicNewYear', emoji: '🌙' },
  '10-1': { key: 'ui.dayOfAshura', emoji: '⭐' },
  '12-3': { key: 'ui.mawlidAlNabi', emoji: '🕌' },
  '27-7': { key: 'ui.lailatAlMiraj', emoji: '✨' },
  '15-8': { key: 'ui.lailatAlBaraAh', emoji: '🌟' },
  '1-9': { key: 'ui.firstDayOfRamadan', emoji: '🌙' },
  '27-9': { key: 'ui.laylatulQadr', emoji: '⭐' },
  '1-10': { key: 'ui.eidAlFitr', emoji: '🎉' },
  '9-12': { key: 'ui.dayOfArafah', emoji: '🕋' },
  '10-12': { key: 'ui.eidAlAdha', emoji: '🎉' },
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
      monthNumber: number
      month: string
      monthAr: string
      year: number
      eventKey?: string
      eventEmoji?: string
    }> = {}

    // data.data is array of days in the month
    data.data.forEach((dayData: any) => {
      const gregorian = dayData.gregorian
      const hijri = dayData.hijri
      
      const key = `${yearNum}-${monthNum}-${parseInt(gregorian.day, 10)}`
      
      // Check for Islamic events
      const eventKey = `${parseInt(hijri.day, 10)}-${parseInt(hijri.month.number, 10)}`
      const event = ISLAMIC_EVENTS[eventKey]
      
      /*
        `monthNumber` is what the client renders from — the name is looked up in
        the reader's language there. `month` stays in the payload only so a
        response already sitting in the CDN from before this change keeps working:
        this endpoint caches for a day and serves stale for a week.
      */
      hijriDates[key] = {
        day: parseInt(hijri.day, 10),
        monthNumber: parseInt(hijri.month.number, 10),
        month: hijri.month.en,
        monthAr: hijri.month.ar,
        year: parseInt(hijri.year, 10),
        ...(event && { eventKey: event.key, eventEmoji: event.emoji })
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
