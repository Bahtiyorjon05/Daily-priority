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
  /*
    Message keys, not text.

    These were English sentences returned from a library function and rendered
    straight onto the prayers page, so "First Day of Ramadan" appeared above an
    otherwise fully Uzbek screen. A key follows the language switch; a string
    cannot.
  */
  nameKey: string
  descriptionKey: string
  /** Interpolation for the keys that take a number. */
  values?: Record<string, string | number>
  type: 'eid' | 'ramadan' | 'special'
}

/** Ramadan is the ninth Hijri month. One definition for the whole app. */
export const RAMADAN_MONTH = 9

/*
  The twelve Hijri months, as message keys.

  These keys already existed, already translated, and were used by nothing — an
  earlier sweep had lifted the English names out of this file into the dictionary
  without changing where the names were read from, so the app kept rendering the
  API's `month.en`. Pointing at them beats adding a second set.
*/
const HIJRI_MONTH_KEYS = [
  'ui.muharram',
  'ui.safar',
  'ui.rabiAlAwwal',
  'ui.rabiAlThani',
  'ui.jumadaAlAwwal',
  'ui.jumadaAlThani',
  'ui.rajab',
  'ui.shaban',
  'ui.ramadan',
  'ui.shawwal',
  'ui.dhuAlQiDah',
  'ui.dhuAlHijjah',
] as const

/**
 * Message key for a Hijri month, 1-12.
 *
 * Derived from the month NUMBER rather than passed through from the API's `en`
 * field, which is how "Rabi' al-Awwal" ended up on Uzbek screens. The number is
 * language-neutral and the name is looked up at the render site.
 *
 * An unusable number falls back to the first month rather than returning a key
 * that resolves to nothing: the month arrives from an API response and from a
 * cached payload, and a missing message renders as the raw key.
 */
export function hijriMonthKey(monthNumber: number): string {
  const n = Math.trunc(monthNumber)
  if (!Number.isFinite(n) || n < 1 || n > 12) return HIJRI_MONTH_KEYS[0]
  return HIJRI_MONTH_KEYS[n - 1]
}

/**
 * Convert Gregorian date to Hijri using internal API (bypasses CORS)
 */
/**
 * Cache of Gregorian date -> Hijri date.
 *
 * The Hijri date for a given Gregorian date never changes, so this is cacheable
 * forever. It matters because the conversion is a NETWORK CALL that measures
 * around 850ms, and the Ramadan page, the calendar and the dashboard each made
 * it on every mount.
 *
 * Not replaced with local arithmetic, though that was the first instinct: a
 * tabular Islamic conversion checked against Aladhan across 16 dates came out
 * off by up to TWO days. In an app that tells someone which day of Ramadan it is,
 * that is not a rounding error — it could miss the start of the month entirely.
 * So the answer stays authoritative and only the round trip goes away.
 *
 * In-memory first (same page session), localStorage behind it (across visits).
 */
const HIJRI_CACHE_PREFIX = 'dailypriority_hijri_'
const memoryCache = new Map<string, HijriDate>()

const cacheKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`

function readCache(key: string): HijriDate | null {
  const hit = memoryCache.get(key)
  if (hit) return hit
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(HIJRI_CACHE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as HijriDate
    // A malformed entry must not be trusted just because it parsed.
    if (typeof parsed?.monthNumber !== 'number' || typeof parsed?.day !== 'number') return null
    memoryCache.set(key, parsed)
    return parsed
  } catch {
    return null
  }
}

function writeCache(key: string, value: HijriDate): void {
  memoryCache.set(key, value)
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(HIJRI_CACHE_PREFIX + key, JSON.stringify(value))
  } catch {
    /* Quota or private mode; the memory cache still helps this session. */
  }
}

export async function gregorianToHijri(date: Date): Promise<HijriDate | null> {
  const key = cacheKey(date)
  const cached = readCache(key)
  if (cached) return cached

  try {
    const day = date.getDate()
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    // Use internal API route instead of direct Aladhan call
    const url = `/api/hijri/convert?date=${day}-${month}-${year}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('Hijri conversion timeout'), 15000) // 15 second timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Hijri conversion error:', errorData)
      throw new Error('Failed to convert date')
    }

    const result = await response.json()

    if (!result.success || !result.data || !result.data.hijri) {
      console.error('Invalid response structure:', result)
      throw new Error('Invalid response structure')
    }

    const hijri = result.data.hijri

    const converted: HijriDate = {
      day: hijri.day,
      month: hijri.month.en,
      monthNumber: hijri.month.number,
      year: hijri.year,
      weekday: hijri.weekday.en,
      formatted: hijri.formatted
    }

    writeCache(key, converted)
    return converted
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Hijri conversion timed out')
    } else {
      console.error('Error converting to Hijri:', error)
    }
    return null
  }
}

/**
 * Convert Hijri date to Gregorian using internal API (bypasses CORS)
 */
export async function hijriToGregorian(
  day: number,
  month: number,
  year: number
): Promise<Date | null> {
  try {
    // Use internal API route with POST method
    const url = '/api/hijri/convert'

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('Hijri to Gregorian timeout'), 15000)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ day, month, year }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Hijri to Gregorian conversion error:', errorData)
      throw new Error('Failed to convert date')
    }

    const result = await response.json()

    if (!result.success || !result.data || !result.data.gregorian) {
      console.error('Invalid response structure:', result)
      throw new Error('Invalid response structure')
    }

    const gregorian = result.data.gregorian

    return new Date(
      gregorian.year,
      gregorian.month - 1,
      gregorian.day
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Hijri to Gregorian conversion timed out')
    } else {
      console.error('Error converting to Gregorian:', error)
    }
    return null
  }
}

/**
 * The twelve Hijri months as message keys, in order.
 *
 * Keys rather than names for the same reason as everything else here: the caller
 * has the locale, this file does not.
 */
export function getIslamicMonthKeys(): readonly string[] {
  return HIJRI_MONTH_KEYS
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
        nameKey: 'ui.firstDayOfRamadan',
        descriptionKey: 'ui.theBlessedMonthOfFastingBegins',
        type: 'ramadan'
      }
    }
    if (hijri.day >= 21 && hijri.day % 2 === 1) {
      return {
        nameKey: 'ui.laylatulQadrPossible',
        descriptionKey: 'ui.oneOfTheLastOddNightsSeekTheNightOfPower',
        type: 'special'
      }
    }
    return {
      nameKey: 'ui.ramadanDayNumber',
      descriptionKey: 'ui.blessedMonthOfFastingAndWorship',
      values: { day: Math.floor(hijri.day) },
      type: 'ramadan'
    }
  }

  // Eid al-Fitr
  if (hijri.monthNumber === 10 && hijri.day === 1) {
    return {
      nameKey: 'ui.eidAlFitr',
      descriptionKey: 'ui.festivalOfBreakingTheFast',
      type: 'eid'
    }
  }

  // Eid al-Adha
  if (hijri.monthNumber === 12 && hijri.day === 10) {
    return {
      nameKey: 'ui.eidAlAdha',
      descriptionKey: 'ui.festivalOfSacrifice',
      type: 'eid'
    }
  }

  // Day of Arafah
  if (hijri.monthNumber === 12 && hijri.day === 9) {
    return {
      nameKey: 'ui.dayOfArafah',
      descriptionKey: 'ui.theBestDayOfTheYearHighlyRecommendedToFast',
      type: 'special'
    }
  }

  // Ashura
  if (hijri.monthNumber === 1 && hijri.day === 10) {
    return {
      nameKey: 'ui.dayOfAshura',
      descriptionKey: 'ui.recommendedDayOfFasting',
      type: 'special'
    }
  }

  // Mawlid
  if (hijri.monthNumber === 3 && hijri.day === 12) {
    return {
      nameKey: 'ui.mawlidAlNabi',
      descriptionKey: 'ui.birthdayOfProphetMuhammad',
      type: 'special'
    }
  }

  // Lailat al-Miraj
  if (hijri.monthNumber === 7 && hijri.day === 27) {
    return {
      nameKey: 'ui.lailatAlMiraj',
      descriptionKey: 'ui.theNightJourney',
      type: 'special'
    }
  }

  // Lailat al-Bara'ah
  if (hijri.monthNumber === 8 && hijri.day === 15) {
    return {
      nameKey: 'ui.lailatAlBaraAh',
      descriptionKey: 'ui.theNightOfForgiveness',
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
