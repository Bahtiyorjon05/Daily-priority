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
 * Save prayer times to localStorage for faster loading
 */
export function savePrayerTimes(
  prayerTimes: PrayerTimes,
  latitude: number,
  longitude: number
): void {
  try {
    const data = {
      prayerTimes,
      latitude,
      longitude,
      timestamp: Date.now(),
      date: new Date().toDateString(),
    }
    localStorage.setItem('dailypriority_prayer_times', JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save prayer times to localStorage:', error)
  }
}

/**
 * Get stored prayer times from localStorage
 */
export function getStoredPrayerTimes(
  latitude: number,
  longitude: number
): PrayerTimes | null {
  try {
    const stored = localStorage.getItem('dailypriority_prayer_times')
    if (!stored) return null

    const data = JSON.parse(stored)
    const currentDate = new Date().toDateString()

    // Check if cached data is for today and same location (within 50km)
    if (
      data.date === currentDate &&
      data.prayerTimes &&
      Math.abs(data.latitude - latitude) < 0.5 &&
      Math.abs(data.longitude - longitude) < 0.5
    ) {
      return data.prayerTimes
    }

    return null
  } catch (error) {
    console.warn('Failed to retrieve stored prayer times:', error)
    return null
  }
}

/**
 * Fetch prayer times from internal API route (bypasses CORS)
 */
export async function fetchPrayerTimes(
  latitude: number,
  longitude: number,
  date?: Date,
  school: 0 | 1 = 0 // 0=Standard (Shafi), 1=Hanafi
): Promise<PrayerTimes | null> {
  try {
    // Check cache first for today's prayer times
    if (!date || date.toDateString() === new Date().toDateString()) {
      const cached = getStoredPrayerTimes(latitude, longitude)
      if (cached) {
        console.log('Using cached prayer times')
        return cached
      }
    }

    const targetDate = date || new Date()
    const day = targetDate.getDate()
    const month = targetDate.getMonth() + 1
    const year = targetDate.getFullYear()

    // Use internal API route instead of direct Aladhan API call
    // school parameter: 0=Standard (Shafi, Maliki, Hanbali), 1=Hanafi
    const url = `/api/prayer-times/fetch?latitude=${latitude}&longitude=${longitude}&day=${day}&month=${month}&year=${year}&school=${school}`

    // Add AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('Prayer times fetch timeout'), 15000) // 15 second timeout (increased)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error('Prayer times API error:', response.status, response.statusText)
      const errorData = await response.json().catch(() => ({}))
      console.error('Error details:', errorData)
      throw new Error(`Failed to fetch prayer times: ${response.status}`)
    }

    const result = await response.json()

    if (!result.success || !result.data) {
      console.error('Invalid prayer times response:', result)
      throw new Error('Invalid prayer times data structure')
    }

    // Cache the prayer times for today
    if (!date || date.toDateString() === new Date().toDateString()) {
      savePrayerTimes(result.data, latitude, longitude)
    }

    return result.data
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn('Prayer times fetch timed out, using fallback')
      } else {
        console.error('Error fetching prayer times:', error.message)
      }
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
 * Get city and country from coordinates using internal API (bypasses CORS)
 */
export async function getCityFromCoordinates(
  latitude: number,
  longitude: number
): Promise<{ city: string; region?: string; country: string }> {
  try {
    // Use internal geocoding API
    const url = `/api/geocode?lat=${latitude}&lon=${longitude}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('Geocoding timeout'), 10000)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const result = await response.json()

      if (result.success && result.data) {
        return {
          city: result.data.city || 'Unknown',
          region: result.data.region || undefined,
          country: result.data.country || 'Unknown'
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Geocoding timed out')
    } else {
      console.warn('Geocoding failed:', error)
    }
  }

  // Fallback to coordinates
  return {
    city: `Location`,
    country: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`
  }
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
 * Get Qibla direction for a location using internal API (bypasses CORS)
 */
export async function getQiblaDirection(
  latitude: number,
  longitude: number
): Promise<number | null> {
  try {
    // Use internal API route
    const url = `/api/qibla?latitude=${latitude}&longitude=${longitude}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('Qibla fetch timeout'), 10000)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn('Qibla API error:', response.status)
      return calculateQiblaDirection(latitude, longitude)
    }

    const result = await response.json()

    if (result.success && result.data && typeof result.data.direction === 'number') {
      return result.data.direction
    }

    // Fallback to calculation
    return calculateQiblaDirection(latitude, longitude)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('Qibla direction fetch timed out, using calculation')
    } else {
      console.warn('Error fetching Qibla direction:', error)
    }
    // Always fallback to manual calculation
    return calculateQiblaDirection(latitude, longitude)
  }
}

/**
 * Get Islamic date for today using internal API (bypasses CORS)
 */
export async function getHijriDate(): Promise<string | null> {
  try {
    const today = new Date()
    const day = today.getDate()
    const month = today.getMonth() + 1
    const year = today.getFullYear()

    // Use internal API route
    const url = `/api/hijri/convert?date=${day}-${month}-${year}`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Hijri date API error:', response.status)
      return null
    }

    const result = await response.json()

    if (result.success && result.data && result.data.hijri) {
      return result.data.hijri.formatted
    }

    return null
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

/**
 * Get approximate location from IP address (no permission needed)
 */
export async function getLocationFromIP(): Promise<{
  latitude: number
  longitude: number
  city: string
  country: string
  region?: string
  timezone?: string
} | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('IP location timeout'), 8000)

    const response = await fetch('/api/location/ip', {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn('IP location API failed:', response.status)
      return null
    }

    const result = await response.json()

    if (result.success && result.data) {
      return {
        latitude: result.data.latitude,
        longitude: result.data.longitude,
        city: result.data.city,
        country: result.data.country,
        region: result.data.region,
        timezone: result.data.timezone
      }
    }

    return null
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('IP location request timed out')
    } else {
      console.error('IP location failed:', error)
    }
    return null
  }
}

/**
 * Save location to localStorage for faster loading
 */
export function saveLocation(location: {
  latitude: number
  longitude: number
  city: string
  country: string
  region?: string
  timestamp?: number
}): void {
  try {
    const data = {
      ...location,
      timestamp: Date.now()
    }
    localStorage.setItem('dailypriority_location', JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to save location to localStorage:', error)
  }
}

/**
 * Get stored location from localStorage
 */
export function getStoredLocation(): {
  latitude: number
  longitude: number
  city: string
  country: string
  region?: string
  timestamp: number
} | null {
  try {
    const stored = localStorage.getItem('dailypriority_location')
    if (!stored) return null

    const data = JSON.parse(stored)

    // Validate data structure
    if (
      typeof data.latitude === 'number' &&
      typeof data.longitude === 'number' &&
      typeof data.city === 'string' &&
      typeof data.country === 'string'
    ) {
      return data
    }

    return null
  } catch (error) {
    console.warn('Failed to retrieve stored location:', error)
    return null
  }
}

/**
 * Check if cached location is still valid (within 7 days)
 */
export function isLocationValid(location: { timestamp: number } | null): boolean {
  if (!location || !location.timestamp) return false

  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
  const age = Date.now() - location.timestamp

  return age < sevenDaysInMs
}

/**
 * Smart location detection with multiple fallbacks
 * 1. Check localStorage cache (instant)
 * 2. Try IP-based location (automatic, no permission)
 * 3. Return null if all fail (caller can request GPS)
 */
export async function getSmartLocation(): Promise<{
  latitude: number
  longitude: number
  city: string
  country: string
  region?: string
  source: 'cache' | 'ip' | 'gps'
} | null> {
  // Try cached location first
  const cached = getStoredLocation()
  if (cached && isLocationValid(cached)) {
    console.log('Using cached location:', cached.city, cached.country)
    return {
      latitude: cached.latitude,
      longitude: cached.longitude,
      city: cached.city,
      country: cached.country,
      region: cached.region,
      source: 'cache'
    }
  }

  // Try IP-based location
  const ipLocation = await getLocationFromIP()
  if (ipLocation) {
    console.log('Using IP-based location:', ipLocation.city, ipLocation.country)

    // Cache for future use
    saveLocation(ipLocation)

    return {
      ...ipLocation,
      source: 'ip'
    }
  }

  // All automatic methods failed
  console.warn('Automatic location detection failed')
  return null
}
