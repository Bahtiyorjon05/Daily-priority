// Hijri Calendar Utilities

export interface HijriDate {
  day: number
  month: string
  monthNumber: number
  year: number
  weekday: string
  formatted: string
}

export interface SpecialDay {
  name: string
  description: string
  type: 'eid' | 'ramadan' | 'special'
}

/**
 * Convert Gregorian date to Hijri
 */
export async function gregorianToHijri(date: Date): Promise<HijriDate | null> {
  try {
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    const url = 'https://api.aladhan.com/v1/gToH/' + (day) + '-' + (month) + '-' + (year)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to convert date')
    }

    const data = await response.json()
    const hijri = data.data.hijri

    return {
      day: parseInt(hijri.day),
      month: hijri.month.en,
      monthNumber: parseInt(hijri.month.number),
      year: parseInt(hijri.year),
      weekday: hijri.weekday.en,
      formatted: (hijri.day) + ' ' + (hijri.month.en) + ' ' + (hijri.year) + ' AH'
    }
  } catch (error) {
    console.error('Error converting to Hijri:', error)
    return null
  }
}

/**
 * Convert Hijri date to Gregorian
 */
export async function hijriToGregorian(
  day: number,
  month: number,
  year: number
): Promise<Date | null> {
  try {
    const url = 'https://api.aladhan.com/v1/hToG/' + (day) + '-' + (month) + '-' + (year)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to convert date')
    }

    const data = await response.json()
    const gregorian = data.data.gregorian

    return new Date(
      parseInt(gregorian.year),
      parseInt(gregorian.month.number) - 1,
      parseInt(gregorian.day)
    )
  } catch (error) {
    console.error('Error converting to Gregorian:', error)
    return null
  }
}

/**
 * Get Islamic month names
 */
export function getIslamicMonths(): string[] {
  return [
    'Muharram',
    'Safar',
    "Rabi' al-Awwal",
    "Rabi' al-Thani",
    'Jumada al-Awwal',
    'Jumada al-Thani',
    'Rajab',
    "Sha'ban",
    'Ramadan',
    'Shawwal',
    "Dhu al-Qi'dah",
    'Dhu al-Hijjah'
  ]
}

/**
 * Check if a date is a special Islamic day
 */
export async function getSpecialDay(date: Date): Promise<SpecialDay | null> {
  const hijri = await gregorianToHijri(date)
  if (!hijri) return null

  // Ramadan
  if (hijri.monthNumber === 9) {
    if (hijri.day === 1) {
      return {
        name: 'First Day of Ramadan',
        description: 'The blessed month of fasting begins',
        type: 'ramadan'
      }
    }
    if (hijri.day >= 21 && hijri.day % 2 === 1) {
      return {
        name: 'Laylatul Qadr (Possible)',
        description: 'One of the last odd nights - seek the Night of Power',
        type: 'special'
      }
    }
    return {
      name: 'Ramadan Day ' + (hijri.day),
      description: 'Blessed month of fasting and worship',
      type: 'ramadan'
    }
  }

  // Eid al-Fitr
  if (hijri.monthNumber === 10 && hijri.day === 1) {
    return {
      name: 'Eid al-Fitr',
      description: 'Festival of Breaking the Fast',
      type: 'eid'
    }
  }

  // Eid al-Adha
  if (hijri.monthNumber === 12 && hijri.day === 10) {
    return {
      name: 'Eid al-Adha',
      description: 'Festival of Sacrifice',
      type: 'eid'
    }
  }

  // Day of Arafah
  if (hijri.monthNumber === 12 && hijri.day === 9) {
    return {
      name: 'Day of Arafah',
      description: 'The best day of the year - highly recommended to fast',
      type: 'special'
    }
  }

  // Ashura
  if (hijri.monthNumber === 1 && hijri.day === 10) {
    return {
      name: 'Day of Ashura',
      description: 'Recommended day of fasting',
      type: 'special'
    }
  }

  // Mawlid
  if (hijri.monthNumber === 3 && hijri.day === 12) {
    return {
      name: 'Mawlid al-Nabi',
      description: 'Birthday of Prophet Muhammad ﷺ',
      type: 'special'
    }
  }

  // Lailat al-Miraj
  if (hijri.monthNumber === 7 && hijri.day === 27) {
    return {
      name: 'Lailat al-Miraj',
      description: 'The Night Journey',
      type: 'special'
    }
  }

  // Lailat al-Bara'ah
  if (hijri.monthNumber === 8 && hijri.day === 15) {
    return {
      name: "Lailat al-Bara'ah",
      description: 'The Night of Forgiveness',
      type: 'special'
    }
  }

  return null
}

/**
 * Get days until Ramadan
 */
export async function getDaysUntilRamadan(): Promise<number | null> {
  try {
    const today = new Date()
    const hijriToday = await gregorianToHijri(today)
    if (!hijriToday) return null

    // If we're in Ramadan
    if (hijriToday.monthNumber === 9) {
      return 0
    }

    // Calculate Ramadan 1st of next year
    let ramadanYear = hijriToday.year
    if (hijriToday.monthNumber >= 9) {
      ramadanYear++
    }

    const ramadanStart = await hijriToGregorian(1, 9, ramadanYear)
    if (!ramadanStart) return null

    const diffTime = ramadanStart.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  } catch (error) {
    console.error('Error calculating days until Ramadan:', error)
    return null
  }
}

/**
 * Format Hijri date for display
 */
export function formatHijriDate(hijri: HijriDate): string {
  return (hijri.day) + ' ' + (hijri.month) + ' ' + (hijri.year) + ' AH'
}

/**
 * Get the current Islamic year
 */
export async function getCurrentIslamicYear(): Promise<number | null> {
  const hijri = await gregorianToHijri(new Date())
  return hijri ? hijri.year : null
}

/**
 * Check if date is during Hajj season
 */
export async function isHajjSeason(date: Date): Promise<boolean> {
  const hijri = await gregorianToHijri(date)
  if (!hijri) return false

  // Dhu al-Hijjah (month 12), days 8-13
  return hijri.monthNumber === 12 && hijri.day >= 8 && hijri.day <= 13
}
