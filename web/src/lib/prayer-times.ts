// Enhanced Prayer Times Utilities with Location Services

export interface PrayerTime {
  name: string
  time: string
  arabicName: string
  nextPrayerIn?: string
  passed: boolean
}

export interface PrayerTimes {
  fajr: string
  dhuhr: string
  asr: string
  maghrib: string
  isha: string
  sunrise: string
  date: string
  hijriDate: string
}

export interface LocationInfo {
  latitude: number
  longitude: number
  city: string
  country: string
  timezone: string
}

export interface EnhancedPrayerResponse {
  prayers: PrayerTime[]
  location: LocationInfo
  qiblaDirection: number
  islamicDate: {
    hijri: string
    day: number
    month: string
    year: number
  }
}

export interface PrayerTimeResponse {
  timings: {
    Fajr: string
    Dhuhr: string
    Asr: string
    Maghrib: string
    Isha: string
  }
  date: {
    readable: string
    hijri: {
      date: string
      month: {
        en: string
        ar: string
      }
      year: string
      weekday: {
        en: string
      }
    }
  }
}

/**
 * Fetch prayer times from Aladhan API
 */
export async function fetchPrayerTimes(
  latitude: number,
  longitude: number,
  date?: Date
): Promise<PrayerTimes | null> {
  try {
    const targetDate = date || new Date()
    const day = targetDate.getDate()
    const month = targetDate.getMonth() + 1
    const year = targetDate.getFullYear()

    const url = `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=2`

    // Add AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-cache',
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('Prayer times API error:', response.status, response.statusText)
      throw new Error(`Failed to fetch prayer times: ${response.status}`)
    }

    const data = await response.json()

    if (!data || !data.data || !data.data.timings) {
      console.error('Invalid prayer times response:', data)
      throw new Error('Invalid prayer times data structure')
    }

    const timings = data.data.timings
    const dateInfo = data.data.date

    return {
      fajr: formatTime(timings.Fajr),
      dhuhr: formatTime(timings.Dhuhr),
      asr: formatTime(timings.Asr),
      maghrib: formatTime(timings.Maghrib),
      isha: formatTime(timings.Isha),
      sunrise: formatTime(timings.Sunrise || '06:30'),
      date: dateInfo.readable || 'Unknown',
      hijriDate: dateInfo.hijri ? `${dateInfo.hijri.date} ${dateInfo.hijri.month.en} ${dateInfo.hijri.year}` : 'Unknown'
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Prayer times fetch timed out, using fallback')
    } else {
      console.error('Error fetching prayer times:', error)
    }
    // Return default prayer times as fallback
    return {
      fajr: '05:30',
      dhuhr: '12:30',
      asr: '15:45',
      maghrib: '18:15',
      isha: '19:45',
      sunrise: '06:45',
      date: new Date().toLocaleDateString(),
      hijriDate: 'Unknown'
    }
  }
}

/**
 * Get user's location using browser geolocation
 */
export function getUserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        reject(error)
      }
    )
  })
}

/**
 * Get city and country from coordinates using reverse geocoding
 */
export async function getCityFromCoordinates(
  latitude: number,
  longitude: number
): Promise<{ city: string; country: string }> {
  // Always return a valid object, never null
  try {
    // Try OpenStreetMap Nominatim first (more reliable, no API issues)
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const osmResponse = await fetch(osmUrl, {
      headers: {
        'User-Agent': 'DailyPriorityApp/1.0',
        'Accept': 'application/json',
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (osmResponse.ok) {
      const osmData = await osmResponse.json()
      const city = osmData.address?.city || osmData.address?.town || osmData.address?.village || 'Unknown Location'
      const country = osmData.address?.country || 'Unknown Country'
      return { city, country }
    }
  } catch (error) {
    console.warn('Location fetch failed, using fallback:', error)
  }

  // Always return a valid fallback
  return { city: 'Your City', country: 'Your Country' }
}

/**
 * Format prayer time (remove seconds and timezone info)
 */
function formatTime(time: string): string {
  // Remove everything after space (timezone info)
  const cleanTime = time.split(' ')[0]
  // Remove seconds
  const [hours, minutes] = cleanTime.split(':')
  return (hours) + ':' + (minutes)
}

/**
 * Get next prayer time from PrayerTimes object
 */
export function getNextPrayerFromTimes(prayerTimes: PrayerTimes): {
  name: string
  time: string
  timeUntil: string
} | null {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const prayers = [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Dhuhr', time: prayerTimes.dhuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha }
  ]

  for (const prayer of prayers) {
    const [hours, minutes] = prayer.time.split(':').map(Number)
    const prayerTimeInMinutes = hours * 60 + minutes

    if (prayerTimeInMinutes > currentTime) {
      const diff = prayerTimeInMinutes - currentTime
      const hoursUntil = Math.floor(diff / 60)
      const minutesUntil = diff % 60

      return {
        name: prayer.name,
        time: prayer.time,
        timeUntil: hoursUntil > 0 ? (hoursUntil) + 'h ' + (minutesUntil) + 'm' : (minutesUntil) + 'm'
      }
    }
  }

  // If no prayer left today, return Fajr tomorrow
  return {
    name: 'Fajr',
    time: prayers[0].time,
    timeUntil: 'Tomorrow'
  }
}

/**
 * Check if it's time for prayer (within 10 minutes)
 */
export function isTimeForPrayer(prayerTime: string, reminderMinutes: number = 10): boolean {
  const now = new Date()
  const currentTime = now.getHours() * 60 + now.getMinutes()

  const [hours, minutes] = prayerTime.split(':').map(Number)
  const prayerTimeInMinutes = hours * 60 + minutes

  const diff = prayerTimeInMinutes - currentTime
  return diff > 0 && diff <= reminderMinutes
}

/**
 * Get Qibla direction for a location
 */
export async function getQiblaDirection(
  latitude: number,
  longitude: number
): Promise<number | null> {
  try {
    const url = `https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-cache',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Qibla direction: ${response.status}`)
    }

    const data = await response.json()
    return data.data.direction || calculateQiblaDirection(latitude, longitude)
  } catch (error) {
    console.error('Error fetching Qibla direction:', error)
    // Fallback to manual calculation
    return calculateQiblaDirection(latitude, longitude)
  }
}

/**
 * Get Islamic date for today
 */
export async function getHijriDate(): Promise<string | null> {
  try {
    const today = new Date()
    const day = today.getDate()
    const month = today.getMonth() + 1
    const year = today.getFullYear()

    const url = `https://api.aladhan.com/v1/gToH/${day}-${month}-${year}`
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-cache',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Hijri date: ${response.status}`)
    }

    const data = await response.json()
    const hijri = data.data.hijri

    return `${hijri.day} ${hijri.month.en} ${hijri.year} AH`
  } catch (error) {
    console.error('Error fetching Hijri date:', error)
    return null
  }
}

/**
 * Check if currently Ramadan
 */
export async function isRamadan(): Promise<boolean> {
  try {
    const hijriDate = await getHijriDate()
    if (!hijriDate) return false

    // Check if month name contains "Ramadan"
    return hijriDate.toLowerCase().includes('ramadan')
  } catch (error) {
    console.error('Error checking Ramadan:', error)
    return false
  }
}

/**
 * Get user's current location with permission handling
 */
export async function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location access denied by user'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information unavailable'))
            break
          case error.TIMEOUT:
            reject(new Error('Location request timed out'))
            break
          default:
            reject(new Error('Unknown location error'))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    )
  })
}

/**
 * Calculate Qibla direction from coordinates to Kaaba
 */
export function calculateQiblaDirection(latitude: number, longitude: number): number {
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
 * Convert prayer times to enhanced format with status
 */
export function enhancePrayerTimes(prayerTimes: PrayerTimes): PrayerTime[] {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const prayers = [
    { name: 'Fajr', arabicName: 'الفجر', time: prayerTimes.fajr },
    { name: 'Sunrise', arabicName: 'الشروق', time: prayerTimes.sunrise },
    { name: 'Dhuhr', arabicName: 'الظهر', time: prayerTimes.dhuhr },
    { name: 'Asr', arabicName: 'العصر', time: prayerTimes.asr },
    { name: 'Maghrib', arabicName: 'المغرب', time: prayerTimes.maghrib },
    { name: 'Isha', arabicName: 'العشاء', time: prayerTimes.isha }
  ]

  return prayers.map(prayer => {
    const [hours, minutes] = prayer.time.split(':').map(Number)
    const prayerMinutes = hours * 60 + minutes
    const passed = currentMinutes > prayerMinutes

    return {
      ...prayer,
      passed,
      nextPrayerIn: !passed ? calculateTimeUntil(prayerMinutes - currentMinutes) : undefined
    }
  })
}

/**
 * Get next prayer time
 */
export function getNextPrayer(prayers: PrayerTime[]): PrayerTime | null {
  // Skip sunrise as it's not a prayer time
  const prayerTimes = prayers.filter(p => p.name !== 'Sunrise')
  
  for (const prayer of prayerTimes) {
    if (!prayer.passed) {
      return prayer
    }
  }

  // If all prayers have passed, return Fajr of next day
  return prayerTimes[0]
}

/**
 * Calculate time until target
 */
function calculateTimeUntil(minutes: number): string {
  if (minutes <= 0) return '0m'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0) {
    return (hours) + 'h ' + (mins) + 'm'
  }
  return (mins) + 'm'
}

/**
 * Check if it's currently prayer time (within notification window)
 */
export function isPrayerTime(prayers: PrayerTime[], windowMinutes: number = 5): PrayerTime | null {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  for (const prayer of prayers) {
    if (prayer.name === 'Sunrise') continue // Skip sunrise
    
    const [hours, minutes] = prayer.time.split(':').map(Number)
    const prayerMinutes = hours * 60 + minutes

    if (Math.abs(currentMinutes - prayerMinutes) <= windowMinutes) {
      return prayer
    }
  }

  return null
}

/**
 * Format prayer time for display
 */
export function formatPrayerTime(time: string, use24Hour: boolean = false): string {
  if (use24Hour) return time

  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours

  return (displayHours) + ':' + (minutes.toString().padStart(2, '0')) + ' ' + (period)
}
