'use client'

import { Card } from '@/components/ui/card'
import { Flame, Award, TrendingUp, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface PrayerStreakProps {
  currentStreak: number
  longestStreak: number
  lastMissedDate?: Date | null
  milestones: number[] // Array of milestone numbers like [7, 30, 100]
}

export default function PrayerStreak({ 
  currentStreak, 
  longestStreak, 
  lastMissedDate,
  milestones = [7, 30, 100, 365]
}: PrayerStreakProps) {
  // Find next milestone
  const nextMilestone = milestones.find(m => m > currentStreak) || milestones[milestones.length - 1]
  const progressToMilestone = (currentStreak / nextMilestone) * 100

  // Check if current streak just hit a milestone
  const justHitMilestone = milestones.includes(currentStreak)

  return (
    <div className="space-y-6">
      {/* Main Streak Card */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-orange-950/30 dark:via-gray-800 dark:to-red-950/30 border border-white/30 dark:border-gray-700/50 shadow-lg overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle, #f97316 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <motion.div 
              className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-xl"
              animate={{ 
                scale: justHitMilestone ? [1, 1.1, 1] : 1,
                rotate: justHitMilestone ? [0, 5, -5, 0] : 0
              }}
              transition={{ duration: 0.5, repeat: justHitMilestone ? 3 : 0 }}
            >
              <Flame className="h-8 w-8 text-white drop-shadow-lg" />
            </motion.div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Current Streak</p>
              <motion.p 
                className="text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 bg-clip-text text-transparent dark:from-orange-400 dark:via-red-400 dark:to-orange-500"
                key={currentStreak}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {currentStreak}
              </motion.p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {currentStreak === 1 ? 'day' : 'days'} of perfect prayers
              </p>
            </div>
          </div>

          {/* Milestone Progress */}
          {currentStreak < nextMilestone && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Next milestone:</span>
                <span className="font-bold text-orange-700 dark:text-orange-300">
                  {nextMilestone} days
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToMilestone}%` }}
                  transition={{ duration: 1 }}
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 relative"
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 text-right">
                {nextMilestone - currentStreak} days to go
              </p>
            </div>
          )}

          {/* Milestone Achievement */}
          {justHitMilestone && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-300 dark:border-yellow-700"
            >
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-bold text-yellow-900 dark:text-yellow-200">
                    🎉 Milestone Achieved!
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    You've reached {currentStreak} days! Keep it up!
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Longest Streak */}
        <Card className="p-4 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Best Streak</span>
          </div>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{longestStreak}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {longestStreak === 1 ? 'day' : 'days'} record
          </p>
        </Card>

        {/* Comparison */}
        <Card className="p-4 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Performance</span>
          </div>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
            {longestStreak > 0 ? Math.round((currentStreak / longestStreak) * 100) : 0}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">of best streak</p>
        </Card>

        {/* Last Missed */}
        <Card className="p-4 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Missed</span>
          </div>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {lastMissedDate 
              ? lastMissedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'Never'
            }
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {lastMissedDate 
              ? `${Math.floor((Date.now() - lastMissedDate.getTime()) / (1000 * 60 * 60 * 24))} days ago`
              : 'Perfect record!'
            }
          </p>
        </Card>
      </div>

      {/* Milestone Badges */}
      <Card className="p-6 bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-700/50">
        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Achievements</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {milestones.map((milestone) => {
            const achieved = currentStreak >= milestone || longestStreak >= milestone
            return (
              <motion.div
                key={milestone}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-xl text-center transition-all ${
                  achieved
                    ? 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-400 dark:border-yellow-600'
                    : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 opacity-50'
                }`}
              >
                <div className={`text-3xl mb-2 ${achieved ? 'animate-bounce' : ''}`}>
                  {milestone >= 365 ? '👑' : milestone >= 100 ? '🏆' : milestone >= 30 ? '🥇' : '⭐'}
                </div>
                <p className={`text-lg font-bold ${
                  achieved 
                    ? 'text-yellow-900 dark:text-yellow-200' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {milestone}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">days</p>
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Motivation Message */}
      <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-0">
        <p className="text-center text-sm text-emerald-800 dark:text-emerald-300 font-medium">
          {currentStreak === 0 
            ? "🌟 Start your streak today! Complete all 5 prayers to begin."
            : currentStreak < 7
            ? "💪 Great start! Keep the momentum going!"
            : currentStreak < 30
            ? "🔥 You're on fire! Stay consistent!"
            : currentStreak < 100
            ? "⚡ Amazing dedication! You're building a powerful habit!"
            : "👑 Legendary! Your commitment is inspiring MashaAllah!"
          }
        </p>
      </Card>
    </div>
  )
}
