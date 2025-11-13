'use client'

import { Card } from '@/components/ui/card'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface DayPrayerData {
  date: Date
  prayers: {
    fajr: { completed: boolean; onTime: boolean }
    dhuhr: { completed: boolean; onTime: boolean }
    asr: { completed: boolean; onTime: boolean }
    maghrib: { completed: boolean; onTime: boolean }
    isha: { completed: boolean; onTime: boolean }
  }
  completionRate: number
}

interface PrayerHistoryProps {
  historyData: DayPrayerData[]
  daysToShow?: number
}

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

export default function PrayerHistory({ historyData, daysToShow = 7 }: PrayerHistoryProps) {
  const displayData = historyData.slice(0, daysToShow)

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Prayer History</h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">Last {daysToShow} days</span>
      </div>

      <div className="space-y-4">
        {displayData.map((day, dayIndex) => (
          <motion.div
            key={day.date.toISOString()}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: dayIndex * 0.05 }}
          >
            <Card className="p-4 bg-gray-50 dark:bg-gray-700/30 border-0">
              {/* Date Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">{getDayName(day.date)}</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatDate(day.date)}</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {day.completionRate}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">completed</div>
                  </div>
                </div>

                {/* Completion Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  day.completionRate === 100
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : day.completionRate >= 80
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : day.completionRate >= 60
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  {day.completionRate === 100 ? 'Perfect' : day.completionRate >= 80 ? 'Great' : day.completionRate >= 60 ? 'Good' : 'Needs Effort'}
                </div>
              </div>

              {/* Prayer Grid */}
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(day.prayers).map(([prayerKey, prayer], prayerIndex) => (
                  <motion.div
                    key={prayerKey}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: dayIndex * 0.05 + prayerIndex * 0.02 }}
                    className="relative"
                  >
                    <div className={`p-3 rounded-lg text-center transition-all ${
                      prayer.completed
                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}>
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {PRAYER_NAMES[prayerIndex]}
                      </div>
                      <div className="flex items-center justify-center">
                        {prayer.completed ? (
                          <CheckCircle2 className={`h-5 w-5 ${
                            prayer.onTime 
                              ? 'text-emerald-600 dark:text-emerald-400' 
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`} />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      
                      {/* On-time indicator */}
                      {prayer.completed && (
                        <div className="mt-1">
                          {prayer.onTime ? (
                            <Clock className="h-3 w-3 text-emerald-600 dark:text-emerald-400 mx-auto" />
                          ) : (
                            <div className="text-xs text-yellow-600 dark:text-yellow-400">Late</div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${day.completionRate}%` }}
                  transition={{ duration: 0.5, delay: dayIndex * 0.05 }}
                  className={`h-full rounded-full ${
                    day.completionRate === 100
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                      : day.completionRate >= 60
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  }`}
                />
              </div>
            </Card>
          </motion.div>
        ))}

        {displayData.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No prayer history available yet.</p>
            <p className="text-sm mt-2">Start tracking your prayers to see your history here.</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Completed on time</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <span>Completed late</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-gray-400" />
            <span>Not completed</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
