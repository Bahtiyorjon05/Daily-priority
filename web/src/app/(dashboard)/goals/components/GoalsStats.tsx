'use client'

import { motion } from 'framer-motion'
import { Target, TrendingUp, Award, Clock, CheckCircle2, Flame } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface GoalsStatsProps {
  stats: {
    total: number
    completed: number
    active: number
    overdue: number
    dunya: {
      total: number
      completed: number
      progress: number
    }
    akhirah: {
      total: number
      completed: number
      progress: number
    }
  }
}

export function GoalsStats({ stats }: GoalsStatsProps) {
  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

  const statCards = [
    {
      title: 'Total Goals',
      value: stats.total,
      icon: Target,
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Active',
      value: stats.active,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      gradient: 'from-green-500 to-emerald-500',
      bg: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: Clock,
      gradient: 'from-red-500 to-rose-500',
      bg: 'from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30',
      iconColor: 'text-red-600 dark:text-red-400'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats */}
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

      {/* Type Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Dunya Progress */}
        <Card className="border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 dark:text-amber-300">
                      Dunya Goals
                    </h3>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Worldly pursuits
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">
                    {stats.dunya.completed}/{stats.dunya.total}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {stats.dunya.total > 0 ? Math.round((stats.dunya.completed / stats.dunya.total) * 100) : 0}% done
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-700 dark:text-amber-400">Average Progress</span>
                  <span className="font-bold text-amber-900 dark:text-amber-300">
                    {Math.round(stats.dunya.progress)}%
                  </span>
                </div>
                <div className="w-full bg-amber-200 dark:bg-amber-900 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.dunya.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Akhirah Progress */}
        <Card className="border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 dark:text-purple-300">
                      Akhirah Goals
                    </h3>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      Hereafter pursuits
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                    {stats.akhirah.completed}/{stats.akhirah.total}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {stats.akhirah.total > 0 ? Math.round((stats.akhirah.completed / stats.akhirah.total) * 100) : 0}% done
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-700 dark:text-purple-400">Average Progress</span>
                  <span className="font-bold text-purple-900 dark:text-purple-300">
                    {Math.round(stats.akhirah.progress)}%
                  </span>
                </div>
                <div className="w-full bg-purple-200 dark:bg-purple-900 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-violet-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.akhirah.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Completion */}
      <Card className="border-none bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Overall Completion Rate
              </h3>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {Math.round(completionRate)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
