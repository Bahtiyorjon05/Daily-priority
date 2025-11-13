import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface LocationData {
  latitude: number
  longitude: number
  city?: string
  country?: string
  timezone?: string
}

export function useUserLocation() {
  const { data: session, status } = useSession()
  const [location, setLocation] = useState<LocationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      const { latitude, longitude } = position.coords

      // Get timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      // Try to get city/country from reverse geocoding
      let city, country
      try {
        // Use OpenStreetMap Nominatim API for reverse geocoding (free, no API key needed)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'DailyPriority/1.0'
            }
          }
        )
        const data = await response.json()
        
        if (data && data.address) {
          city = data.address.city || data.address.town || data.address.village || data.address.state
          country = data.address.country
        }
      } catch (geoError) {
        console.warn('Reverse geocoding failed:', geoError)
        // Continue without city/country
      }

      const locationData: LocationData = {
        latitude,
        longitude,
        city,
        country,
        timezone
      }

      setLocation(locationData)

      // Save to backend if user is logged in
      if (session?.user?.id) {
        try {
          await fetch('/api/user/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(locationData)
          })
        } catch (saveError) {
          console.error('Failed to save location:', saveError)
        }
      }

      setLoading(false)
      return locationData
    } catch (err: any) {
      const errorMessage = err.code === 1
        ? 'Location permission denied. Please enable location access in your browser settings.'
        : err.code === 2
        ? 'Location unavailable. Please check your device settings.'
        : err.code === 3
        ? 'Location request timed out. Please try again.'
        : 'Failed to detect location'
      
      setError(errorMessage)
      setLoading(false)
      return null
    }
  }

  // Load saved location from database on mount
  useEffect(() => {
    if (status === 'authenticated' && !location && !loading && !error) {
      // Fetch saved location from database
      fetch('/api/user/location')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.location) {
            // Parse saved location
            const savedLocation = data.data.location
            const timezone = data.data.timezone || 'UTC'
            
            // Format: "City, Country (lat, lon)" or just "lat, lon"
            const coordMatch = savedLocation.match(/\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)/)
            if (coordMatch) {
              // Has coordinates in parentheses
              const lat = parseFloat(coordMatch[1])
              const lon = parseFloat(coordMatch[2])
              
              // Extract city/country before parentheses
              const cityCountry = savedLocation.split('(')[0].trim()
              const parts = cityCountry.split(',').map((s: string) => s.trim())
              
              setLocation({
                latitude: lat,
                longitude: lon,
                city: parts[0] || undefined,
                country: parts[1] || undefined,
                timezone
              })
            } else {
              // Old format or just coordinates
              const simpleCoordMatch = savedLocation.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
              if (simpleCoordMatch) {
                setLocation({
                  latitude: parseFloat(simpleCoordMatch[1]),
                  longitude: parseFloat(simpleCoordMatch[2]),
                  timezone,
                  city: undefined,
                  country: undefined
                })
              }
            }
          }
          // If no location saved, user can manually detect it from settings
        })
        .catch((err) => {
          console.error('Failed to load saved location:', err)
        })
    }
  }, [status, location, loading, error])

  return {
    location,
    loading,
    error,
    detectLocation,
    refetch: detectLocation
  }
}
