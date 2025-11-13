'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  Clock,
  Zap,
  Calendar,
  Flame,
  CheckCircle2,
  Activity,
  Brain,
  Star,
  Trophy,
  AlertCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { optimizedFetch } from '@/lib/performance'
import LoadingState from '../dashboard/components/LoadingState'
import ErrorState from '../dashboard/components/ErrorState'

// Dynamically import Recharts components (reduces initial bundle size)
const LineChart: any = dynamic(() => import('recharts').then((mod) => mod.LineChart as any), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
})
const BarChart: any = dynamic(() => import('recharts').then((mod) => mod.BarChart as any), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
})
const Line: any = dynamic(() => import('recharts').then((mod) => mod.Line as any), {
  ssr: false,
})
const Bar: any = dynamic(() => import('recharts').then((mod) => mod.Bar as any), {
  ssr: false,
})
const XAxis: any = dynamic(() => import('recharts').then((mod) => mod.XAxis as any), {
  ssr: false,
})
const YAxis: any = dynamic(() => import('recharts').then((mod) => mod.YAxis as any), {
  ssr: false,
})
const CartesianGrid: any = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid as any),
  { ssr: false }
)
const Tooltip: any = dynamic(() => import('recharts').then((mod) => mod.Tooltip as any), {
  ssr: false,
})
const Legend: any = dynamic(() => import('recharts').then((mod) => mod.Legend as any), {
  ssr: false,
})
const ResponsiveContainer: any = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer as any),
  { ssr: false }
)
const PieChart: any = dynamic(() => import('recharts').then((mod) => mod.PieChart as any), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
})
const Pie: any = dynamic(() => import('recharts').then((mod) => mod.Pie as any), {
  ssr: false,
})
const Cell: any = dynamic(() => import('recharts').then((mod) => mod.Cell as any), {
  ssr: false,
})

interface AnalyticsData {
  overview: {
    tasksCompleted: number
    totalTasks: number
    completionRate: number
    streak: number
    productivityScore: number
    averageTaskTime: number
    focusTime: number
  }
  weekly: {
    created: number
    completed: number
    completionRate: number
    avgPerDay: number
  }
  monthly: {
    created: number
    completed: number
    completionRate: number
    growth: number
    completionRateChange: number
  }
  lastMonth: {
    created: number
    completed: number
    completionRate: number
  }
  trends: {
    daily: Array<{ 
      date: string
      completed: number
      created: number
      dayOfWeek: string
      completionRate: number
    }>
    weekday: Array<{
      day: string
      created: number
      completed: number
      rate: number
    }>
    peakHours: number[]
  }
  taskStats: {
    priority: {
      urgent: number
      important: number
      completed: number
      pending: number
      inProgress: number
      cancelled: number
    }
    velocity: {
      today: number
      week: number
      avgPerDay: number
    }
  }
  insights: Array<{
    type: string
    title: string
    description: string
    icon: string
    value?: string
  }>
}

type WeekdayTrendPoint = AnalyticsData['trends']['weekday'][number]

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await optimizedFetch('/api/analytics', {
        timeout: 20000,
        retries: 2,
        retryDelay: 1500,
        cache: 'no-store'
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch analytics')
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      setError(error.message || 'Failed to load analytics')
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user?.id) {
      fetchAnalytics()
    }
  }, [session?.user?.id, fetchAnalytics])

  if (loading) return <LoadingState message="Loading analytics..." />
  if (error) return <ErrorState message={error} onRetry={fetchAnalytics} />
  if (!analytics) return <ErrorState message="No analytics data available" onRetry={fetchAnalytics} />

  const { overview, weekly, monthly, lastMonth, trends, insights, taskStats } = analytics

  // Prepare chart data with graceful fallbacks
  const normalizedCompletionRate = Math.min(
    Math.max(overview.completionRate ?? 0, 0),
    100
  )

  const completionRateData = [
    { name: 'Completed', value: normalizedCompletionRate, color: '#10b981' },
    {
      name: 'Incomplete',
      value: Math.max(0, parseFloat((100 - normalizedCompletionRate).toFixed(1))),
      color: '#e5e7eb'
    }
  ]

  const dailyTrends = Array.isArray(trends.daily) ? trends.daily : []
  const weekdayTrends = Array.isArray(trends.weekday) ? trends.weekday : []
  const peakHourValues = Array.isArray(trends.peakHours) ? trends.peakHours : []

  const hasDailyTrendData = dailyTrends.some(
    (day) => day.created > 0 || day.completed > 0
  )
  const hasWeekdayData = weekdayTrends.some(
    (day) => day.created > 0 || day.completed > 0
  )

  // Format peak hours
  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM'
    if (hour === 12) return '12 PM'
    if (hour < 12) return `${hour} AM`
    return `${hour - 12} PM`
  }

  const peakHoursText = peakHourValues.length > 0
    ? peakHourValues.map(formatHour).join(', ')
    : 'Not enough data'

  const findExtremeDay = (
    compare: (candidate: WeekdayTrendPoint, currentBest: WeekdayTrendPoint) => boolean
  ): WeekdayTrendPoint | null => {
    if (!hasWeekdayData || weekdayTrends.length === 0) {
      return null
    }
    let result = weekdayTrends[0]
    for (let i = 1; i < weekdayTrends.length; i++) {
      const candidate = weekdayTrends[i]
      if (compare(candidate, result)) {
        result = candidate
      }
    }
    return result
  }

  const bestDay = findExtremeDay((candidate, best) => candidate.rate > best.rate)
  const worstDay = findExtremeDay((candidate, best) => candidate.rate < best.rate)

  const formatPercentage = (value: number) => {
    const fixed = value.toFixed(1)
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed
  }

  const getIconByName = (iconName: string) => {
    const icons: Record<string, any> = {
      award: Award,
      star: Star,
      trending: TrendingUp,
      target: Target,
      clock: Clock
    }
    return icons[iconName] || Star
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300 mt-2">
            Deep insights into your productivity and spiritual growth
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500 dark:text-slate-400">Productivity Score</div>
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {overview.productivityScore}
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-emerald-200 dark:border-emerald-700/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Tasks Completed</p>
                  <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-2">
                    {overview.tasksCompleted}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    of {overview.totalTasks} total
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 border-orange-200 dark:border-orange-700/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Current Streak</p>
                  <p className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-2">
                    {overview.streak}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    days in a row
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                  <Flame className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-blue-200 dark:border-blue-700/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Completion Rate</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                    {formatPercentage(normalizedCompletionRate)}%
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    task success rate
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-2 border-purple-200 dark:border-purple-700/50 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Focus Time</p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                    {overview.focusTime.toFixed(1)}h
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    average per day
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Brain className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Task Velocity & Pipeline Section */}
      {taskStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Task Velocity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Card className="border-2 border-cyan-200 dark:border-cyan-700/50 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-5 w-5 text-cyan-500" />
                  Task Velocity
                </CardTitle>
                <CardDescription className="text-xs">Your task creation rate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Today</span>
                  <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                    {taskStats.velocity.today}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">This Week</span>
                  <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
                    {taskStats.velocity.week}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Daily Average</span>
                  <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                    {taskStats.velocity.avgPerDay.toFixed(1)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Peak Productivity Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-2 border-amber-200 dark:border-amber-700/50 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Peak Hours
                </CardTitle>
                <CardDescription className="text-xs">When you're most productive</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-2">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mb-1">
                    {peakHoursText}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    {peakHourValues.length > 0 
                      ? 'Schedule important tasks during these hours'
                      : 'Create more tasks to see patterns'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Best Day Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <Card className="border-2 border-rose-200 dark:border-rose-700/50 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star className="h-5 w-5 text-rose-500" />
                  Best Day
                </CardTitle>
                <CardDescription className="text-xs">Your highest performing day</CardDescription>
              </CardHeader>
              <CardContent>
                {bestDay ? (
                  <div className="text-center py-2">
                    <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mb-1">
                      {bestDay.day}
                    </p>
                    <p className="text-sm text-rose-600 dark:text-rose-400">
                      {bestDay.rate.toFixed(0)}% completion rate
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {bestDay.completed} of {bestDay.created} tasks
                    </p>
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-500 py-4">
                    Not enough data yet
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Task Pipeline Status */}
      {taskStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                Task Pipeline Status
              </CardTitle>
              <CardDescription>Current status breakdown of all your tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-700/50">
                  <p className="text-xs font-medium text-red-700 dark:text-red-300 uppercase">Urgent</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                    {taskStats.priority.urgent}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl border-2 border-amber-200 dark:border-amber-700/50">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase">Important</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                    {taskStats.priority.important}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700/50">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase">Pending</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {taskStats.priority.pending}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700/50">
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase">In Progress</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                    {taskStats.priority.inProgress}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-700/50">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                    {taskStats.priority.completed}
                  </p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-xl border-2 border-slate-200 dark:border-slate-700/50">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase">Cancelled</p>
                  <p className="text-3xl font-bold text-slate-600 dark:text-slate-400 mt-2">
                    {taskStats.priority.cancelled}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trends Chart - Extended to 14 Days */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" />
                Daily Activity Trends (14 Days)
              </CardTitle>
              <CardDescription>Tasks created vs completed over the last 2 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              {hasDailyTrendData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tickFormatter={(value: any) =>
                        new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      }
                    />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value: any, name: any) => {
                        if (name === 'Completion Rate') return `${value}%`
                        return value
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={3} name="Created" />
                    <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} name="Completed" />
                    <Line
                      type="monotone"
                      dataKey="completionRate"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Completion Rate"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                  <AlertCircle className="mb-3 h-10 w-10 text-slate-400" />
                  <p className="font-medium">No daily activity yet</p>
                  <p className="text-sm">Complete tasks to unlock this insight.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Rate Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Overall Completion Rate
              </CardTitle>
              <CardDescription>Percentage of tasks completed successfully</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {PieChart && (
                  <PieChart>
                    {Pie && (
                      <Pie
                        data={completionRateData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {Cell && completionRateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    )}
                    {Tooltip && <Tooltip />}
                  </PieChart>
                )}
              </ResponsiveContainer>
              <div className="text-center mt-4">
                <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPercentage(normalizedCompletionRate)}%
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Success Rate</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekly & Monthly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
        >
          <Card className="border-2 border-blue-200 dark:border-blue-700/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                This Week's Performance
              </CardTitle>
              <CardDescription>Last 7 days statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Tasks Created</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {weekly.created}
                  </p>
                </div>
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                    {weekly.completed}
                  </p>
                </div>
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Completion Rate</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                    {weekly.completionRate}%
                  </p>
                </div>
                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Avg Per Day</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
                    {weekly.avgPerDay}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="border-2 border-purple-200 dark:border-purple-700/50 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                This Month's Performance
              </CardTitle>
              <CardDescription>
                {monthly.growth >= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ↑ {monthly.growth.toFixed(1)}% growth vs last month
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">
                    ↓ {Math.abs(monthly.growth).toFixed(1)}% vs last month
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Tasks Created</span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {monthly.created}
                    <span className="text-sm text-slate-500 ml-2">({lastMonth.created} last month)</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Completed</span>
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {monthly.completed}
                    <span className="text-sm text-slate-500 ml-2">({lastMonth.completed} last month)</span>
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Completion Rate</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {monthly.completionRate}%
                    </span>
                    {monthly.completionRateChange !== 0 && (
                      <span className={`text-sm ml-2 ${monthly.completionRateChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {monthly.completionRateChange > 0 ? '↑' : '↓'} {Math.abs(monthly.completionRateChange).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Weekday Performance Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
      >
        <Card className="border-2 border-indigo-200 dark:border-indigo-700/50 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              Weekday Performance
            </CardTitle>
            <CardDescription>
              {bestDay && worstDay ? (
                <>
                  Best: <span className="font-semibold text-emerald-600">{bestDay.day}</span> ({bestDay.rate.toFixed(0)}%) |{' '}
                  Worst: <span className="font-semibold text-rose-600">{worstDay.day}</span> ({worstDay.rate.toFixed(0)}%)
                </>
              ) : (
                'Complete tasks across the week to reveal your patterns'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasWeekdayData ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekdayTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: any, name: any) => {
                      if (name === 'Completion Rate') return `${value.toFixed(1)}%`
                      return value
                    }}
                  />
                  <Legend />
                  <Bar dataKey="created" fill="#3b82f6" name="Created" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="rate" fill="#f59e0b" name="Completion Rate" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                <AlertCircle className="mb-3 h-10 w-10 text-slate-400" />
                <p className="font-medium">No weekday data yet</p>
                <p className="text-sm">Log activity on multiple days to unlock this chart.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Insights & Recommendations
            </CardTitle>
            <CardDescription>Personalized insights to boost your productivity</CardDescription>
          </CardHeader>
          <CardContent>
            {insights && insights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.map((insight, index) => {
                  const Icon = getIconByName(insight.icon)
                  const typeColors = {
                    achievement: 'from-amber-500 to-orange-500',
                    positive: 'from-emerald-500 to-teal-500',
                    improvement: 'from-blue-500 to-indigo-500',
                    warning: 'from-rose-500 to-pink-500'
                  }
                  const gradientClass = typeColors[insight.type as keyof typeof typeColors] || typeColors.positive

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.0 + index * 0.1 }}
                      className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg flex-shrink-0`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                            {insight.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {insight.description}
                          </p>
                          {insight.value && (
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                              {insight.value}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-16 w-16 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                  No insights yet
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                  Complete more tasks to generate personalized insights
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
