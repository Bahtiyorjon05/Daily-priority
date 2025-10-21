'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, MapPin, Loader2, AlertCircle, Navigation } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  fetchPrayerTimes,
  getCityFromCoordinates,
  getCurrentLocation,
  enhancePrayerTimes,
  getNextPrayer,
  type PrayerTime,
  type PrayerTimes
} from '@/lib/prayer-times'

export default function PrayerTimesWidget() {
  const [prayers, setPrayers] = useState<PrayerTime[]>([])
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null)
  const [location, setLocation] = useState<{ city: string; country: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)

  useEffect(() => {
    loadPrayerTimes()
  }, [])

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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-b border-emerald-100 dark:border-emerald-900/30">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-900 dark:text-emerald-100">Prayer Times</span>
          </div>
          {location && (
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <MapPin className="h-3 w-3" />
              {location.city}
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Loading prayer times...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
              {locationDenied && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  You can enable location access in your browser settings.
                </p>
              )}
              <Button
                onClick={loadPrayerTimes}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Try Again
              </Button>
            </motion.div>
          ) : nextPrayer ? (
            <motion.div
              key="prayers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Next Prayer Highlight */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-5 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-emerald-50">Next Prayer</p>
                  <Navigation className="h-4 w-4 text-emerald-50" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold mb-1">{nextPrayer.name}</p>
                  <p className="text-4xl font-bold font-mono mb-2">{nextPrayer.time}</p>
                  {nextPrayer.nextPrayerIn && (
                    <p className="text-emerald-50 text-sm">
                      in {nextPrayer.nextPrayerIn}
                    </p>
                  )}
                </div>
              </div>

              {/* All Prayer Times */}
              <div className="space-y-2">
                {prayers
                  .filter(p => p.name !== 'Sunrise')
                  .map((prayer, index) => (
                    <motion.div
                      key={prayer.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={'flex items-center justify-between p-3 rounded-lg transition-all ' +
                        (prayer.name === nextPrayer.name
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-800'
                          : prayer.passed
                          ? 'bg-slate-50 dark:bg-slate-800/30 opacity-60'
                          : 'bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className={'w-2 h-2 rounded-full ' +
                          (prayer.name === nextPrayer.name
                            ? 'bg-emerald-500 animate-pulse'
                            : prayer.passed
                            ? 'bg-slate-300 dark:bg-slate-600'
                            : 'bg-slate-400 dark:bg-slate-500'
                          )
                        } />
                        <div>
                          <p className={'font-medium ' +
                            (prayer.passed
                              ? 'text-slate-500 dark:text-slate-400'
                              : 'text-slate-900 dark:text-slate-100'
                            )
                          }>
                            {prayer.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {prayer.arabicName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={'text-lg font-mono font-semibold ' +
                          (prayer.passed
                            ? 'text-slate-500 dark:text-slate-400'
                            : 'text-slate-900 dark:text-slate-100'
                          )
                        }>
                          {prayer.time}
                        </p>
                        {prayer.nextPrayerIn && !prayer.passed && prayer.name !== nextPrayer.name && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            in {prayer.nextPrayerIn}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </div>

              {/* View All Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/prayers'}
              >
                View All Prayer Times
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
