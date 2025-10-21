'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, MapPin, CheckCircle2, Circle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface PrayerTime {
  name: string
  time: string
  arabic?: string
  completed: boolean
}

const DEFAULT_TIMES: PrayerTime[] = [
  { name: 'Fajr',    time: '05:30', arabic: 'الفجر',   completed: false },
  { name: 'Dhuhr',   time: '12:15', arabic: 'الظهر',   completed: false },
  { name: 'Asr',     time: '15:45', arabic: 'العصر',   completed: false },
  { name: 'Maghrib', time: '18:20', arabic: 'المغرب',  completed: false },
  { name: 'Isha',    time: '19:50', arabic: 'العشاء',  completed: false },
]

export default function PrayerTimesPanel() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [location, setLocation] = useState('Loading…')
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>(DEFAULT_TIMES)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    // Mock location; replace with real geolocation if desired
    setTimeout(() => setLocation('New York, NY'), 800)
    return () => clearInterval(timer)
  }, [])

  const togglePrayer = (index: number) => {
    setPrayerTimes(prev => prev.map((p, i) => (i === index ? { ...p, completed: !p.completed } : p)))
  }

  const getCurrentPrayer = () => {
    const current = currentTime.toTimeString().slice(0, 5)
    const upcoming = prayerTimes.find(p => p.time > current && !p.completed)
    return upcoming || prayerTimes[0]
  }

  const nextPrayer = getCurrentPrayer()
  const completedCount = prayerTimes.filter(p => p.completed).length

  return (
    <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Prayer Times
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Time & Location */}
        <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-500 text-sm mt-1">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
        </div>

        {/* Next Prayer */}
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Next Prayer</p>
              <p className="text-lg font-bold text-amber-900 dark:text-amber-300">
                {nextPrayer.name} • {nextPrayer.time}
              </p>
            </div>
            {nextPrayer.arabic && (
              <div className="text-xl sm:text-2xl text-amber-700 dark:text-amber-300">{nextPrayer.arabic}</div>
            )}
          </div>
        </div>

        {/* Prayer List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
            <span>Today's Prayers</span>
            <span className="text-emerald-600 dark:text-emerald-400">{completedCount}/5 completed</span>
          </div>

          {prayerTimes.map((prayer, index) => (
            <motion.div key={prayer.name} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}>
              <Button
                variant="ghost"
                onClick={() => togglePrayer(index)}
                className={`w-full justify-start p-3 h-auto rounded-xl transition-all duration-200 ${
                  prayer.completed ? 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
                aria-pressed={prayer.completed}
                aria-label={`${prayer.name} at ${prayer.time}${prayer.completed ? ' (completed)' : ''}`}
              >
                <div className="flex items-center gap-3 w-full">
                  {prayer.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  )}

                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className={`font-medium text-sm ${prayer.completed ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                        {prayer.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{prayer.time}</p>
                    </div>
                    {prayer.arabic && <span className="text-lg text-slate-400 dark:text-slate-500">{prayer.arabic}</span>}
                  </div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Progress */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Daily Progress</span>
            <span>{Math.round((completedCount / 5) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <motion.div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" initial={{ width: 0 }} animate={{ width: `${(completedCount / 5) * 100}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

