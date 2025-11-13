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

      // Fetch prayer times with Hanafi calculation
      const prayerTimes = await fetchPrayerTimes(latitude, longitude, undefined, 1)

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
    <Card className="overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-300/70 dark:shadow-slate-500/30 bg-white dark:bg-slate-800">
      <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 shadow-sm">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
            <span className="text-emerald-900 dark:text-emerald-100">Prayer Times</span>
          </div>
          {location && (
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-300">
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
              <p className="text-sm text-slate-600 dark:text-slate-300">Loading prayer times...</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{error}</p>
              {locationDenied && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  You can enable location access in your browser settings.
                </p>
              )}
              <Button
                onClick={loadPrayerTimes}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-md hover:shadow-lg"
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
              <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 text-white p-5 rounded-xl shadow-xl shadow-emerald-200/50 dark:shadow-emerald-500/40 ring-1 ring-emerald-400/30 dark:ring-emerald-600/60 relative overflow-hidden">
                {/* Add subtle pattern */}
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='3' fill='white' fill-opacity='0.3'/%3E%3C/svg%3E\")", backgroundSize: "20px 20px"}}></div>
                <div className="relative z-10">
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
                      className={'flex items-center justify-between p-3 rounded-xl transition-all border ' +
                        (prayer.name === nextPrayer.name
                          ? 'bg-emerald-50/90 dark:bg-emerald-900/40 border-2 border-emerald-300/80 dark:border-emerald-700/70 shadow-md shadow-emerald-100/50 dark:shadow-emerald-500/30'
                          : prayer.passed
                          ? 'bg-slate-50/80 dark:bg-slate-700/60 opacity-60 border-slate-200/50 dark:border-slate-600/50'
                          : 'bg-white/80 dark:bg-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/80 border-slate-200/60 dark:border-slate-600/50 hover:border-slate-300 dark:hover:border-slate-500/70 hover:shadow-md dark:hover:shadow-slate-500/30'
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
                className="w-full border-slate-200 dark:border-slate-600/70 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-300 dark:hover:border-slate-500/70"
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
