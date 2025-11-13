'use client'

import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { Flame, Trophy, Star, Award } from 'lucide-react'

interface Milestone {
  days: number
  label?: string
  achieved?: boolean
}

interface PrayerStreakProps {
  currentStreak: number
  longestStreak: number
  milestones: Array<Milestone | number>
}

export default function PrayerStreak({ currentStreak, longestStreak, milestones }: PrayerStreakProps) {
  const getStreakColor = (streak: number) => {
    if (streak >= 100) return 'from-purple-500 to-pink-500'
    if (streak >= 30) return 'from-orange-500 to-red-500'
    if (streak >= 7) return 'from-yellow-500 to-orange-500'
    return 'from-emerald-500 to-green-500'
  }

  const getStreakIcon = (streak: number) => {
    if (streak >= 100) return Trophy
    if (streak >= 30) return Award
    if (streak >= 7) return Star
    return Flame
  }

  const StreakIcon = getStreakIcon(currentStreak)
  const normalizedMilestones: Milestone[] = milestones.map(milestone => {
    if (typeof milestone === 'number') {
      return {
        days: milestone,
        label: `${milestone} day streak`,
        achieved: longestStreak >= milestone
      }
    }

    return {
      days: milestone.days,
      label: milestone.label || `${milestone.days} day streak`,
      achieved:
        typeof milestone.achieved === 'boolean'
          ? milestone.achieved
          : longestStreak >= milestone.days
    }
  })

  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Prayer Streak</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Current Streak */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-2 border-emerald-200 dark:border-emerald-800"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Streak</p>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  {currentStreak}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400">days</p>
              </div>
            </div>
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className={`p-3 rounded-full bg-gradient-to-br ${getStreakColor(currentStreak)}`}
            >
              <StreakIcon className="h-8 w-8 text-white" />
            </motion.div>
          </div>
          {currentStreak >= 3 && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-4 font-medium">
              Keep it up! Consistency builds momentum.
            </p>
          )}
        </motion.div>

        {/* Longest Streak */}
        <div className="rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Best Streak</p>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {longestStreak}
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-400">days</p>
              </div>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Trophy className="h-8 w-8 text-white" />
            </div>
          </div>
          {currentStreak === longestStreak && currentStreak > 0 && (
            <p className="text-xs text-purple-700 dark:text-purple-400 mt-4 font-medium">
              Personal best! Keep pushing forward.
            </p>
          )}
        </div>
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Milestones</h4>
        {normalizedMilestones.map((milestone, index) => (
          <motion.div
            key={`${milestone.days}-${milestone.label || 'milestone'}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              milestone.achieved
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 dark:border-emerald-700'
                : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                milestone.achieved 
                  ? 'bg-emerald-100 dark:bg-emerald-900/50' 
                  : 'bg-gray-200 dark:bg-gray-800'
              }`}>
                {milestone.achieved ? (
                  <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Award className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                )}
              </div>
              <div>
                <p className={`font-medium ${
                  milestone.achieved 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {milestone.label ?? `${milestone.days} day streak`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {milestone.days} consecutive days
                </p>
              </div>
            </div>
            {milestone.achieved && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Achieved</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  )
}



