'use client'

import { motion } from 'framer-motion'
import StatCard from './StatCard'
import { CheckCircle2, TrendingUp, Target, Clock } from 'lucide-react'
import { useUserStats } from '@/hooks/use-user-stats'

export default function StatsGrid() {
  const { stats, loading } = useUserStats()
  
  // Return loading skeleton if data is not available
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 h-32">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-2"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  // Create stats data from API response with fallbacks for new users
  const statsData = [
    {
      title: 'Tasks Completed',
      value: stats?.completedTasks?.toString() || '0',
      subtitle: `of ${stats?.totalTasks || 0} total`,
      icon: CheckCircle2,
      color: 'blue',
      progress: stats?.completionRate || 0,
      trend: stats?.completedTasks && stats.completedTasks > 0 ? 'up' : 'neutral',
      trendValue: stats?.completionRate ? `${stats.completionRate}%` : undefined
    },
    {
      title: 'Productivity Score',
      value: `${stats?.productivityScore || 0}%`,
      subtitle: 'Overall performance',
      icon: TrendingUp,
      color: 'emerald',
      progress: stats?.productivityScore || 0,
      trend: stats?.productivityScore && stats.productivityScore >= 70 ? 'up' : 
             stats?.productivityScore && stats.productivityScore >= 50 ? 'neutral' : 'down',
      trendValue: stats?.productivityScore ? `${stats.productivityScore}%` : undefined
    },
    {
      title: 'Weekly Goals',
      value: `${stats?.completedTasks || 0}/${stats?.totalTasks || 0}`,
      subtitle: stats?.totalTasks ? 
        `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% complete` : 
        'No goals set',
      icon: Target,
      color: 'purple',
      progress: stats?.totalTasks ? 
        Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0,
      trend: stats?.completedTasks && stats.completedTasks > 0 ? 'up' : 'neutral'
    },
    {
      title: 'Current Streak',
      value: `${stats?.currentStreak || 0}`,
      subtitle: stats?.currentStreak && stats.currentStreak > 0 ? 'days in a row' : 'Start today!',
      icon: Clock,
      color: 'orange',
      progress: Math.min((stats?.currentStreak || 0) * 10, 100), // 10 days = 100%
      trend: stats?.currentStreak && stats.currentStreak > 0 ? 'up' : 'neutral',
      trendValue: stats?.currentStreak && stats.currentStreak > 0 ? `${stats.currentStreak} days` : undefined
    }
  ] as const
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: index * 0.1,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          whileHover={{
            y: -5,
            transition: { duration: 0.2 }
          }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  )
}
