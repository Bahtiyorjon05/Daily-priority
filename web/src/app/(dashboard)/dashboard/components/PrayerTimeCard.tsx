'use client'

import { motion } from 'framer-motion'

interface PrayerTimeCardProps {
  prayer: any
  isNext?: boolean
  timeUntil?: string
}

export default function PrayerTimeCard({ 
  prayer, 
  isNext, 
  timeUntil 
}: PrayerTimeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -3 }}
      className={'relative p-4 rounded-2xl border-2 transition-all duration-300 ' + (prayer.passed 
          ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 opacity-70' 
          : isNext
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-300 dark:border-emerald-600 shadow-lg shadow-emerald-500/20'
            : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600')}
    >
      {isNext && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
      )}
      
      <div className="text-center">
        <div className="text-lg font-arabic text-gray-600 dark:text-gray-300 mb-1">
          {prayer.arabicName}
        </div>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
          {prayer.name}
        </div>
        <div className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">
          {prayer.time}
        </div>
        {timeUntil && !prayer.passed && (
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            in {timeUntil}
          </div>
        )}
      </div>
    </motion.div>
  )
}