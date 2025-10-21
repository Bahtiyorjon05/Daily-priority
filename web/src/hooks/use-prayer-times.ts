'use client'

import { useState, useEffect } from 'react'
import { 
  fetchPrayerTimes, 
  getCityFromCoordinates, 
  getCurrentLocation,
  enhancePrayerTimes,
  getNextPrayer,
  type PrayerTime,
  type PrayerTimes
} from '@/lib/prayer-times'

export function usePrayerTimes() {
  const [prayers, setPrayers] = useState<PrayerTime[]>([])
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null)
  const [location, setLocation] = useState<{ city: string; country: string } | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [locationDenied, setLocationDenied] = useState<boolean>(false)

  const loadPrayerTimes = async () => {
    try {
      setLoading(true)
      setError(null)
      setLocationDenied(false)

      // Get user's current location
      const position = await getCurrentLocation()
      const { latitude, longitude } = position.coords

      // Fetch prayer times
      const prayerTimes = await fetchPrayerTimes(latitude, longitude)

      if (!prayerTimes) {
        throw new Error('Failed to fetch prayer times')
      }

      // Enhance prayer times with status
      const enhancedPrayers = enhancePrayerTimes(prayerTimes)
      setPrayers(enhancedPrayers)

      // Get next prayer
      const next = getNextPrayer(enhancedPrayers)
      setNextPrayer(next)

      // Get location info (always returns a value, never null)
      const locationInfo = await getCityFromCoordinates(latitude, longitude)
      setLocation(locationInfo)

    } catch (err: any) {
      console.error('Error loading prayer times:', err)

      if (err.message.includes('denied')) {
        setLocationDenied(true)
        setError('Location access denied. Please enable location services to see prayer times.')
      } else {
        setError('Failed to load prayer times. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrayerTimes()
  }, [])

  return {
    prayers,
    nextPrayer,
    location,
    loading,
    error,
    locationDenied,
    refetch: loadPrayerTimes
  }
}