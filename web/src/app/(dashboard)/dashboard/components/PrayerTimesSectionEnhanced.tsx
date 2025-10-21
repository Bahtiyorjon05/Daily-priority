'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, AlertCircle } from 'lucide-react'
import PrayerTimeCard from './PrayerTimeCard'

interface PrayerTimesSectionProps {
  prayerTimes: any[]
  nextPrayer: any
  location: { city: string; country: string } | null
  locationLoading: boolean
  locationError: string | null
  qiblaDirection: number
  onRefresh: () => void
}

export default function PrayerTimesSectionEnhanced({
  prayerTimes,
  nextPrayer,
  location,
  locationLoading,
  locationError,
  qiblaDirection,
  onRefresh
}: PrayerTimesSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">🕌 Prayer Times</h2>
            {locationLoading ? (
              <div className="text-white/80 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                Getting your location...
              </div>
            ) : location ? (
              <p className="text-white/80">📍 {location.city}, {location.country}</p>
            ) : locationError ? (
              <div className="text-white/80 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{locationError}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  className="text-white/80 hover:text-white hover:bg-white/10 ml-2 px-2 py-1 text-xs"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <p className="text-white/80">📍 Default Location</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center bg-white/20 rounded-lg p-2 backdrop-blur-sm">
              <div className="text-xs text-white/80">Qibla</div>
              <div className="text-lg font-bold text-white">🧭 {qiblaDirection}°</div>
            </div>
            {!locationLoading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                disabled={locationLoading}
              >
                <Activity className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-5">
        {locationLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading prayer times...</p>
            </div>
          </div>
        ) : prayerTimes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {prayerTimes.filter(prayer => prayer.name !== 'Sunrise').map((prayer, index) => (
              <PrayerTimeCard 
                key={prayer.name}
                prayer={prayer}
                isNext={prayer.name === nextPrayer?.name}
                timeUntil={prayer.nextPrayerIn}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Unable to load prayer times</p>
              <p className="text-sm">Check your internet connection and try again</p>
            </div>
            <Button
              variant="outline"
              onClick={onRefresh}
              className="text-sm"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
      
      {/* Additional Prayer Information */}
      {nextPrayer && !locationLoading && (
        <div className="border-t border-gray-200 dark:border-gray-700/50 p-5 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Next Prayer</h3>
              <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                {nextPrayer.name} at {nextPrayer.time}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {nextPrayer.timeUntil ? 'in ' + (nextPrayer.timeUntil) : 'Starting soon'}
              </p>
            </div>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              Set Reminder
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  )
}