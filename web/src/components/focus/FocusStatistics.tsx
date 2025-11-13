'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trophy, Flame, Clock, TrendingUp, Calendar, BarChart3 } from 'lucide-react'

interface FocusStats {
  today: { focusTime: number; sessions: number }
  week: { focusTime: number; sessions: number; avgDailyFocusTime: number; avgDailySessions: number }
  month?: { focusTime: number; sessions: number; avgDailyFocusTime: number; avgDailySessions: number }
  allTime: { totalSessions: number; totalFocusTime: number; currentStreak: number; longestStreak: number }
  last7Days: Array<{ date: string; sessions: number; focusTime: number }>
  last30Days?: Array<{ date: string; sessions: number; focusTime: number }>
  typeBreakdown: Array<{ type: string; count: number; totalTime: number }>
}

interface FocusStatisticsProps {
  stats: FocusStats | null
}

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function FocusStatistics({ stats }: FocusStatisticsProps) {
  if (!stats) return null

  const maxFocusTime7Days = Math.max(...(stats.last7Days?.map(d => d.focusTime) || [1]))
  const maxFocusTime30Days = Math.max(...(stats.last30Days?.map(d => d.focusTime) || [1]))

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 shadow-lg hover:scale-105 transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Today</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                  {formatTime(stats.today.focusTime)}
                </p>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 font-medium">{stats.today.sessions} sessions</p>
              </div>
              <Clock className="h-10 w-10 text-purple-600 dark:text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 shadow-lg hover:scale-105 transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">This Week</p>
                <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-2">
                  {formatTime(stats.week.focusTime)}
                </p>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 font-medium">{stats.week.sessions} sessions</p>
              </div>
              <TrendingUp className="h-10 w-10 text-emerald-600 dark:text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-300 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-900/20 shadow-lg hover:scale-105 transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Current Streak</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-2">
                  {stats.allTime.currentStreak}
                </p>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 font-medium">days</p>
              </div>
              <Flame className="h-10 w-10 text-orange-600 dark:text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg hover:scale-105 transition-transform">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">All Time</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                  {stats.allTime.totalSessions}
                </p>
                <p className="text-xs text-slate-600 dark:text-gray-400 mt-1 font-medium">
                  {formatTime(stats.allTime.totalFocusTime)}
                </p>
              </div>
              <Trophy className="h-10 w-10 text-blue-600 dark:text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics with Tabs */}
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
          <TabsTrigger 
            value="daily" 
            className="text-slate-700 dark:text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-100 data-[state=active]:to-indigo-100 dark:data-[state=active]:from-purple-500 dark:data-[state=active]:to-indigo-500 data-[state=active]:text-purple-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md font-semibold"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Daily
          </TabsTrigger>
          <TabsTrigger 
            value="weekly" 
            className="text-slate-700 dark:text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-100 data-[state=active]:to-indigo-100 dark:data-[state=active]:from-purple-500 dark:data-[state=active]:to-indigo-500 data-[state=active]:text-purple-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md font-semibold"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Weekly
          </TabsTrigger>
          <TabsTrigger 
            value="monthly" 
            className="text-slate-700 dark:text-gray-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-100 data-[state=active]:to-indigo-100 dark:data-[state=active]:from-purple-500 dark:data-[state=active]:to-indigo-500 data-[state=active]:text-purple-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md font-semibold"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Monthly
          </TabsTrigger>
        </TabsList>

        {/* Daily View */}
        <TabsContent value="daily" className="space-y-6">
          <Card className="border-2 border-slate-200 dark:border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-gray-100 font-bold">Today's Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {stats.today.sessions}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Sessions</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {formatTime(stats.today.focusTime)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Focus Time</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {stats.today.sessions > 0 ? Math.round(stats.today.focusTime / stats.today.sessions) : 0}m
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Avg Session</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    {stats.allTime.currentStreak}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly View */}
        <TabsContent value="weekly" className="space-y-6">
          <Card className="border-2 border-slate-200 dark:border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-gray-100 font-bold">Last 7 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {stats.last7Days.map((day, index) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.focusTime / maxFocusTime7Days) * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="w-full bg-gradient-to-t from-purple-500 to-indigo-500 rounded-t-lg min-h-[20px] relative group cursor-pointer"
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                        {formatTime(day.focusTime)}
                      </div>
                    </motion.div>
                    <p className="text-xs text-slate-600 dark:text-gray-400 font-medium">{formatDate(day.date)}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 rounded-lg bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {stats.week.sessions}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Total Sessions</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {formatTime(stats.week.focusTime)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Total Time</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {formatTime(stats.week.avgDailyFocusTime)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Daily Avg</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    {stats.week.avgDailySessions.toFixed(1)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Sessions/Day</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly View */}
        <TabsContent value="monthly" className="space-y-6">
          <Card className="border-2 border-slate-200 dark:border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-gray-100 font-bold">Last 30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-1">
                {(stats.last30Days || stats.last7Days).map((day, index) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.focusTime / maxFocusTime30Days) * 100}%` }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      className="w-full bg-gradient-to-t from-emerald-500 to-teal-500 rounded-t-sm min-h-[10px] relative group cursor-pointer"
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                        {formatDate(day.date)}: {formatTime(day.focusTime)}
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 rounded-lg bg-purple-100 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {stats.month?.sessions || stats.week.sessions}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Total Sessions</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {formatTime(stats.month?.focusTime || stats.week.focusTime)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Total Time</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {stats.allTime.longestStreak}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Best Streak</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                    {formatTime(stats.month?.avgDailyFocusTime || stats.week.avgDailyFocusTime)}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-400 font-medium">Daily Avg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session Type Breakdown */}
          {stats.typeBreakdown && stats.typeBreakdown.length > 0 && (
            <Card className="border-2 border-slate-200 dark:border-gray-700 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-gray-100 font-bold">Session Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.typeBreakdown.map((type) => (
                    <div key={type.type} className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700 dark:text-gray-300 capitalize">
                            {type.type === 'shortBreak' ? 'Short Break' : type.type === 'longBreak' ? 'Long Break' : type.type}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-gray-400 font-medium">
                            {type.count} sessions • {formatTime(type.totalTime)}
                          </span>
                        </div>
                        <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(type.totalTime / stats.allTime.totalFocusTime) * 100}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full ${
                              type.type === 'focus' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' :
                              type.type === 'shortBreak' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                              'bg-gradient-to-r from-blue-500 to-cyan-500'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
