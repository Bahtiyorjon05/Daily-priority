/**
 * Unified Location Service
 *
 * This service provides a single source of truth for user location across the app.
 * Priority order:
 * 1. Database (user's saved location)
 * 2. localStorage cache (for performance)
 * 3. IP-based location (automatic, no permission needed)
 * 4. GPS/Browser location (requires permission, most accurate)
 *
 * All location updates are synced to both localStorage and database.
 */

export interface UnifiedLocation {
  latitude: number
  longitude: number
  city: string
  country: string
  region?: string
  timezone?: string
  timestamp: number
  source: 'database' | 'cache' | 'ip' | 'gps'
}

const LOCATION_CACHE_KEY = 'dailypriority_location'
const LOCATION_MAX_AGE_MS = 2 * 60 * 60 * 1000 // 2 hours
const LOCATION_DISTANCE_THRESHOLD_KM = 5 // Consider location changed if moved 5km

/**
 * Get user location with smart fallbacks
 * This is the main function to use throughout the app
 */
export async function getUserLocation(): Promise<UnifiedLocation | null> {
  try {
    // 1. Try database first (user's saved/home location)
    const dbLocation = await fetchDatabaseLocation()
    if (dbLocation && isLocationValid(dbLocation)) {
      console.log('Using database location:', formatLocationForDisplay(dbLocation))
      return dbLocation
    }

    // 2. Try localStorage cache
    const cachedLocation = getCachedLocation()
    if (cachedLocation && isLocationFresh(cachedLocation)) {
      console.log('Using cached location:', formatLocationForDisplay(cachedLocation))
      return cachedLocation
    }

    // 3. Try IP-based location (automatic, no permission)
    const ipLocation = await getIPBasedLocation()
    if (ipLocation) {
      console.log('Using IP-based location:', formatLocationForDisplay(ipLocation))
      // Save for future use
      await saveLocation(ipLocation)
      return ipLocation
    }

    // 4. All automatic methods failed, return null
    // Caller can prompt user for GPS permission
    console.warn('All automatic location methods failed')
    return cachedLocation // Return stale cache if available
  } catch (error) {
    console.error('Error getting user location:', error)
    // Return stale cache as last resort
    return getCachedLocation()
  }
}

/**
 * Request precise GPS location from browser (requires user permission)
 */
export async function requestGPSLocation(): Promise<UnifiedLocation> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser')
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          // Get city/country from coordinates
          const locationDetails = await reverseGeocode(latitude, longitude)

          const location: UnifiedLocation = {
            latitude,
            longitude,
            city: locationDetails.city || 'Unknown',
            country: locationDetails.country || 'Unknown',
            region: locationDetails.region,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: Date.now(),
            source: 'gps'
          }

          // Save to both cache and database
          await saveLocation(location)

          resolve(location)
        } catch (error) {
          // Even if geocoding fails, we have coordinates
          const location: UnifiedLocation = {
            latitude,
            longitude,
            city: 'Location',
            country: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: Date.now(),
            source: 'gps'
          }

          await saveLocation(location)
          resolve(location)
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location access denied. Please enable location in your browser settings.'))
            break
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location unavailable. Please check your device settings.'))
            break
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'))
            break
          default:
            reject(new Error('Failed to get location'))
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Accept 1 minute old position
      }
    )
  })
}

/**
 * Save location to both localStorage and database
 */
export async function saveLocation(location: UnifiedLocation): Promise<void> {
  try {
    // Save to localStorage immediately
    saveCachedLocation(location)

    // Save to database (don't await to avoid blocking)
    saveDatabaseLocation(location).catch(error => {
      console.error('Failed to save location to database:', error)
    })
  } catch (error) {
    console.error('Error saving location:', error)
  }
}

/**
 * Format location for display
 */
export function formatLocationForDisplay(location: UnifiedLocation | null): string {
  if (!location) {
    return 'Location not set'
  }

  const parts: string[] = []

  if (location.city && !isInvalidCityName(location.city)) {
    parts.push(location.city)
  }

  if (location.region && location.region !== location.city && !isInvalidCityName(location.region)) {
    parts.push(location.region)
  }

  if (location.country && !isInvalidCityName(location.country)) {
    parts.push(location.country)
  }

  if (parts.length > 0) {
    return parts.join(', ')
  }

  // Fallback to coordinates
  return `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`
}

/**
 * Get detailed location string with coordinates
 */
export function formatLocationDetailed(location: UnifiedLocation | null): string {
  if (!location) {
    return 'Location not set'
  }

  const display = formatLocationForDisplay(location)
  const coords = `${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`

  if (display.includes('°')) {
    // Already showing coordinates
    return display
  }

  return `${display} (${coords})`
}

/**
 * Check if location has moved significantly
 */
export function hasLocationChanged(
  oldLocation: UnifiedLocation | null,
  newLocation: UnifiedLocation
): boolean {
  if (!oldLocation) return true

  const distance = calculateDistance(
    oldLocation.latitude,
    oldLocation.longitude,
    newLocation.latitude,
    newLocation.longitude
  )

  return distance >= LOCATION_DISTANCE_THRESHOLD_KM
}

// ============================================================================
// Private Helper Functions
// ============================================================================

function isLocationValid(location: UnifiedLocation | null): boolean {
  if (!location) return false

  if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    return false
  }

  // Check if coordinates are not (0, 0) which is invalid
  if (Math.abs(location.latitude) < 0.1 && Math.abs(location.longitude) < 0.1) {
    return false
  }

  return true
}

function isLocationFresh(location: UnifiedLocation | null): boolean {
  if (!location || !location.timestamp) return false

  const age = Date.now() - location.timestamp
  return age < LOCATION_MAX_AGE_MS
}

function isInvalidCityName(name: string): boolean {
  if (!name || name.trim().length === 0) return true

  const invalid = /^(unknown|location|ocean|sea|water|null|undefined|n\/a)$/i
  return invalid.test(name.trim())
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// ============================================================================
// LocalStorage Operations
// ============================================================================

function getCachedLocation(): UnifiedLocation | null {
  try {
    const stored = localStorage.getItem(LOCATION_CACHE_KEY)
    if (!stored) return null

    const location = JSON.parse(stored) as UnifiedLocation

    if (isLocationValid(location)) {
      return {
        ...location,
        source: 'cache'
      }
    }

    return null
  } catch (error) {
    console.warn('Failed to get cached location:', error)
    return null
  }
}

function saveCachedLocation(location: UnifiedLocation): void {
  try {
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location))
  } catch (error) {
    console.warn('Failed to cache location:', error)
  }
}

// ============================================================================
// Database Operations
// ============================================================================

async function fetchDatabaseLocation(): Promise<UnifiedLocation | null> {
  try {
    const response = await fetch('/api/user/location', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    if (!response.ok) {
      // User might not be logged in or location not set
      return null
    }

    const result = await response.json()

    if (!result.success || !result.data?.location) {
      return null
    }

    // Parse location string: "City, Country (lat, lon)" or "lat, lon"
    const locationStr = result.data.location
    const timezone = result.data.timezone || 'UTC'

    // Try to extract coordinates from parentheses
    const coordMatch = locationStr.match(/\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/)

    if (coordMatch) {
      const latitude = parseFloat(coordMatch[1])
      const longitude = parseFloat(coordMatch[2])

      // Extract city/country before parentheses
      const cityCountry = locationStr.split('(')[0].trim()
      const parts = cityCountry.split(',').map((s: string) => s.trim()).filter(Boolean)

      return {
        latitude,
        longitude,
        city: parts[0] || 'Unknown',
        country: parts[1] || 'Unknown',
        region: parts[2],
        timezone,
        timestamp: Date.now(),
        source: 'database'
      }
    }

    // Old format: just "lat, lon"
    const simpleMatch = locationStr.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
    if (simpleMatch) {
      return {
        latitude: parseFloat(simpleMatch[1]),
        longitude: parseFloat(simpleMatch[2]),
        city: 'Location',
        country: 'Unknown',
        timezone,
        timestamp: Date.now(),
        source: 'database'
      }
    }

    return null
  } catch (error) {
    console.error('Failed to fetch database location:', error)
    return null
  }
}

async function saveDatabaseLocation(location: UnifiedLocation): Promise<void> {
  try {
    const response = await fetch('/api/user/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
        country: location.country,
        timezone: location.timezone || 'UTC'
      })
    })

    if (!response.ok) {
      // User might not be logged in, that's ok
      console.warn('Could not save location to database (user may not be logged in)')
    }
  } catch (error) {
    console.warn('Failed to save location to database:', error)
  }
}

// ============================================================================
// IP-based Location (Fallback)
// ============================================================================

async function getIPBasedLocation(): Promise<UnifiedLocation | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch('/api/location/ip', {
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const result = await response.json()

    if (result.success && result.data) {
      return {
        latitude: result.data.latitude,
        longitude: result.data.longitude,
        city: result.data.city || 'Unknown',
        country: result.data.country || 'Unknown',
        region: result.data.region,
        timezone: result.data.timezone || 'UTC',
        timestamp: Date.now(),
        source: 'ip'
      }
    }

    return null
  } catch (error) {
    console.warn('IP-based location failed:', error)
    return null
  }
}

// ============================================================================
// Reverse Geocoding
// ============================================================================

async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{ city: string; country: string; region?: string }> {
  try {
    const response = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`, {
      headers: { 'Accept': 'application/json' }
    })

    if (response.ok) {
      const result = await response.json()

      if (result.success && result.data) {
        return {
          city: result.data.city || 'Unknown',
          country: result.data.country || 'Unknown',
          region: result.data.region
        }
      }
    }
  } catch (error) {
    console.warn('Reverse geocoding failed:', error)
  }

  // Fallback
  return {
    city: 'Location',
    country: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`
  }
}
