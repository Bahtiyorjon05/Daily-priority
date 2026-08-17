'use client'

import { useState, useEffect } from 'react'
import { useT } from '@/lib/i18n/client'
import { 
  fetchPrayerTimes, 
  getCityFromCoordinates, 
  getCurrentLocation,
  enhancePrayerTimes,
  getNextPrayer,
  DEFAULT_CALC,
  type PrayerTime,
  type PrayerTimes
} from '@/lib/prayer-times'

export function usePrayerTimes() {
  const { t } = useT()
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

      // CRITICAL: Prayer times MUST use CURRENT location
      // User might be traveling, moved, or in different city
      // Prayer times are location-specific and time-sensitive!
      
      // ALWAYS get user's CURRENT location from browser
      const position = await getCurrentLocation()
      const { latitude, longitude } = position.coords

      // Get location name from coordinates
      const locationName = await getCityFromCoordinates(latitude, longitude)
      setLocation(locationName)

      // Fetch prayer times using CURRENT coordinates
      // No consumers today, but it defaulted to Shafi'i while the live screens
      // passed Hanafi — two conventions in one app, waiting to be revived.
      const prayerTimes = await fetchPrayerTimes(latitude, longitude, undefined, DEFAULT_CALC)

      if (!prayerTimes) {
        throw new Error('Failed to fetch prayer times')
      }

      // Enhance prayer times with status
      const enhancedPrayers = enhancePrayerTimes(prayerTimes)
      setPrayers(enhancedPrayers)

      // Get next prayer
      const next = getNextPrayer(enhancedPrayers)
      setNextPrayer(next)

    } catch (err: any) {
      console.error('Error loading prayer times:', err)

      if (err.message.includes('denied') || err.code === 1) {
        setLocationDenied(true)
        setError('Location access denied. Please enable location services to see accurate prayer times for your current location.')
      } else if (err.message.includes('unavailable') || err.code === 2) {
        setError(t('Location unavailable. Please check your device settings.'))
      } else if (err.message.includes('timeout') || err.code === 3) {
        setError(t('Location request timed out. Please try again.'))
      } else {
        setError(t('Failed to load prayer times. Please enable location services.'))
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