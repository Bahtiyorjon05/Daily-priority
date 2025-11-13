'use client'

import { motion } from 'framer-motion'
import { Target, CheckCircle2, Flame, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface HabitsStatsProps {
  totalHabits: number
  completedToday: number
  activeStreak: number
  weeklyCompletion: number
}

export function HabitsStats({ totalHabits, completedToday, activeStreak, weeklyCompletion }: HabitsStatsProps) {
  const statCards = [
    {
      title: 'Total Habits',
      value: totalHabits,
      icon: Target,
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Completed Today',
      value: completedToday,
      icon: CheckCircle2,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Current Streak',
      value: `${activeStreak} days`,
      icon: Flame,
      gradient: 'from-orange-500 to-red-500',
      bg: 'from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      title: 'Weekly Rate',
      value: `${weeklyCompletion}%`,
      icon: TrendingUp,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`border-none bg-gradient-to-br ${stat.bg} hover:shadow-lg transition-shadow`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
