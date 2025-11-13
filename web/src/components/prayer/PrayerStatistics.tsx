'use client'

import { Card } from '@/components/ui/card'
import { CheckCircle2, Clock, TrendingUp, Calendar as CalendarIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface PrayerStatisticsProps {
  dailyCompletion: number
  weeklyCompletion: number
  monthlyCompletion: number
  onTimePercentage: number
  totalPrayers: number
  completedPrayers: number
  todayCompleted: number
}

export default function PrayerStatistics({
  dailyCompletion,
  weeklyCompletion,
  monthlyCompletion,
  onTimePercentage,
  totalPrayers,
  completedPrayers,
  todayCompleted
}: PrayerStatisticsProps) {
  const stats = [
    {
      label: 'Today',
      value: dailyCompletion,
      icon: CalendarIcon,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-700 dark:text-emerald-300'
    },
    {
      label: 'This Week',
      value: weeklyCompletion,
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    {
      label: 'This Month',
      value: monthlyCompletion,
      icon: CheckCircle2,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-700 dark:text-purple-300'
    },
    {
      label: 'On Time',
      value: onTimePercentage,
      icon: Clock,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-700 dark:text-orange-300'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="p-6 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/30 dark:via-gray-800 dark:to-teal-950/30 border border-white/30 dark:border-gray-700/50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-300">Prayer Statistics</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {completedPrayers} / {totalPrayers} Total Prayers
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-4 ${stat.bgColor} border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.label}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-end gap-1">
                      <span className={`text-3xl font-bold ${stat.textColor}`}>
                        {stat.value}
                      </span>
                      <span className="text-lg text-gray-600 dark:text-gray-400 mb-1">%</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-white/50 dark:bg-gray-700/50 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.value}%` }}
                        transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                        className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Today's Progress */}
      <Card className="p-6 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">Today's Progress</h4>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {todayCompleted} of 5 prayers
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(todayCompleted / 5) * 100}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
          
          {todayCompleted === 5 && (
            <motion.p
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center text-sm text-emerald-700 dark:text-emerald-300 font-medium"
            >
              ✨ Alhamdulillah! All prayers completed today.
            </motion.p>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completion Rate</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0}%
            </p>
          </div>
        </Card>
        
        <Card className="p-4 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">On-Time Rate</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {onTimePercentage}%
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
