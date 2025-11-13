'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import { motion } from 'framer-motion'

interface AggregatedHistoryDay {
  date: Date
  prayers: Record<string, { completed: boolean; onTime: boolean }>
  completionRate: number
}

interface PrayerHistoryProps {
  historyData?: AggregatedHistoryDay[]
  daysToShow?: number
  onDaysChange?: (days: number) => void
}

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
const DAY_OPTIONS = [7, 14, 30]

export default function PrayerHistory({
  historyData = [],
  daysToShow = 30,
  onDaysChange
}: PrayerHistoryProps) {
  // Use parent-controlled state if available, otherwise use local state
  const [localDays, setLocalDays] = useState(
    DAY_OPTIONS.includes(daysToShow) ? daysToShow : DAY_OPTIONS[0]
  )

  const selectedDays = onDaysChange ? daysToShow : localDays
  const handleDaysChange = onDaysChange || setLocalDays

  // Don't slice the data - it's already filtered by the parent
  const displayData = historyData
  const hasData = displayData.length > 0

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Prayer History</h3>
        <div className="flex gap-2">
          {DAY_OPTIONS.map(option => (
            <Button
              key={option}
              variant={selectedDays === option ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleDaysChange(option)}
              className={selectedDays === option ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {option} Days
            </Button>
          ))}
        </div>
      </div>

      {hasData ? (
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="grid grid-cols-[100px_1fr] gap-4">
              <div className="space-y-3 pt-12">
                {PRAYERS.map((prayer) => (
                  <div key={prayer} className="h-10 flex items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{prayer}</span>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <div className="flex gap-2">
                  {displayData.map(({ date, prayers }) => {
                    const dayKey = date.toISOString()
                    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
                    const dayNumber = date.getDate()
                    const completedCount = PRAYERS.filter(p => prayers[p.toLowerCase()]?.completed).length ?? 0

                    return (
                      <motion.div
                        key={dayKey}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center min-w-[60px]"
                      >
                        <div className="text-center mb-2">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {weekday}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            {dayNumber}
                          </div>
                        </div>
                        <div className="space-y-3">
                          {PRAYERS.map((prayer) => {
                            const key = prayer.toLowerCase()
                            const prayerData = prayers[key]
                            return (
                              <div
                                key={`${dayKey}-${prayer}`}
                                className="h-10 w-12 flex items-center justify-center rounded-lg border-2 transition-all"
                                style={{
                                  backgroundColor: prayerData?.completed
                                    ? prayerData.onTime
                                      ? 'rgba(16, 185, 129, 0.2)'
                                      : 'rgba(251, 191, 36, 0.2)'
                                    : 'transparent',
                                  borderColor: prayerData?.completed
                                    ? prayerData.onTime
                                      ? 'rgb(16, 185, 129)'
                                      : 'rgb(251, 191, 36)'
                                    : 'rgba(156, 163, 175, 0.3)'
                                }}
                              >
                                {prayerData?.completed ? (
                                  <CheckCircle2 className="h-5 w-5" style={{ color: prayerData.onTime ? 'rgb(16, 185, 129)' : 'rgb(251, 191, 36)' }} />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {completedCount}/5
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No prayer history available yet.</p>
          <p className="text-sm mt-2">Start tracking your prayers to see your history here.</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-emerald-500 bg-emerald-100 dark:bg-emerald-900/30"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">On Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-amber-500 bg-amber-100 dark:bg-amber-900/30"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Completed Late</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-gray-400 dark:border-gray-600"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">Missed</span>
        </div>
      </div>
    </Card>
  )
}
