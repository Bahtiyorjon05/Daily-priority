'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { TrendingUp, Target, Clock, CheckCircle2 } from 'lucide-react'

interface PrayerStatisticsProps {
  dailyCompletion?: number
  weeklyCompletion?: number
  monthlyCompletion?: number
  onTimePercentage?: number
  totalPrayers?: number
  completedPrayers?: number
  todayCompleted?: number
}

const StatCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  color 
}: { 
  icon: any
  title: string
  value: string
  subtitle: string
  color: string 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className={`p-6 bg-gradient-to-br ${color} border border-white/30 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-shadow duration-300`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="p-3 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
    </Card>
  </motion.div>
)

export default function PrayerStatistics({
  dailyCompletion = 0,
  weeklyCompletion = 0,
  monthlyCompletion = 0,
  onTimePercentage = 0,
  totalPrayers = 0,
  completedPrayers = 0,
  todayCompleted = 0
}: PrayerStatisticsProps) {
  const safeTotal = Math.max(totalPrayers, 0)
  const safeCompleted = Math.min(Math.max(completedPrayers, 0), safeTotal)
  const completionRate = safeTotal > 0 ? Math.round((safeCompleted / safeTotal) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        icon={Target}
        title="Daily Completion"
        value={`${dailyCompletion.toFixed(0)}%`}
        subtitle="Today's progress"
        color="from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30"
      />
      <StatCard
        icon={TrendingUp}
        title="Weekly Average"
        value={`${weeklyCompletion.toFixed(0)}%`}
        subtitle="Last 7 days"
        color="from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"
      />
      <StatCard
        icon={CheckCircle2}
        title="Monthly Average"
        value={`${monthlyCompletion.toFixed(0)}%`}
        subtitle="Last 30 days"
        color="from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30"
      />
      <StatCard
        icon={Clock}
        title="On-Time Rate"
        value={`${onTimePercentage.toFixed(0)}%`}
        subtitle="Prayed on time"
        color="from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
      />
      <StatCard
        icon={CheckCircle2}
        title="Total Completion"
        value={`${completionRate}%`}
        subtitle={`${safeCompleted} of ${safeTotal} logged`}
        color="from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/40"
      />
      <StatCard
        icon={Target}
        title="Today Logged"
        value={`${Math.min(Math.max(todayCompleted, 0), 5)} / 5`}
        subtitle="Prayers completed today"
        color="from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/40"
      />
    </div>
  )
}
