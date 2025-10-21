'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Target,
  TrendingUp,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  Trash2,
  Brain,
  Flame,
  Trophy,
  Filter,
  Grid3X3,
  List,
  AlertCircle,
  Flag,
  Star,
  Activity,
  BookOpen,
  X,
  Sparkles,
  Calendar as CalendarIcon,
  BarChart3,
  ChevronRight,
  Moon,
  Sun,
  Lightbulb,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import PrayerTimesWidget from './components/PrayerTimesWidget'
import ErrorState from './components/ErrorState'
import LoadingState from './components/LoadingState'
import { optimizedFetch, PerformanceMonitor, clientCache } from '@/lib/performance'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  urgent: boolean
  important: boolean
  estimatedTime?: number
  energyLevel?: string
  aiSuggested: boolean
  aiReason?: string
  createdAt: string
  completedAt?: string
  priority?: string
  dueDate?: string
  category?: {
    name: string
    color: string
  }
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  createdAt: string
}

interface Stats {
  streak: number
  productivityScore: number
  tasksCompleted: number
  totalTasks: number
  weeklyGoals: number
  completedGoals: number
  achievements?: Achievement[]
}

export default function DashboardPageRedesigned() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [dailyQuote, setDailyQuote] = useState<{ text: string; source: string } | null>(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    urgent: false,
    important: false,
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchTasks()
      fetchDailyQuote()
      fetchUserStats()
    }
  }, [session?.user?.id])

  const retryApiCall = async <T,>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    let lastError: any

    // Start performance monitoring
    const stopMonitoring = PerformanceMonitor.start('api_retry_call')

    for (let i = 0; i < retries; i++) {
      try {
        const result = await fn()
        stopMonitoring()
        return result
      } catch (error) {
        lastError = error
        if (i < retries - 1) {
          // Use exponential backoff with jitter
          const jitter = Math.random() * 1000
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i) + jitter))
        }
      }
    }

    stopMonitoring()
    throw lastError
  }

  const fetchUserStats = async () => {
    try {
      // Check cache first
      const cachedStats = clientCache.get('user_stats')
      if (cachedStats) {
        setStats(cachedStats)
        return
      }

      const data = await retryApiCall(async () => {
        const response = await optimizedFetch('/api/user/stats', {
          timeout: 8000,
          retries: 2,
          retryDelay: 1500
        })
        if (response.ok) {
          return await response.json()
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch user stats')
        }
      })

      const statsData: Stats = {
        streak: data?.streak ?? 0,
        productivityScore: data?.productivityScore ?? 0,
        tasksCompleted: data?.tasksCompleted ?? 0,
        totalTasks: data?.totalTasks ?? 0,
        weeklyGoals: data?.weeklyGoals ?? 0,
        completedGoals: data?.completedGoals ?? 0,
        achievements: data?.achievements ?? []
      }

      // Cache the results for 5 minutes
      clientCache.set('user_stats', statsData, 5 * 60 * 1000)
      setStats(statsData)
    } catch (error: any) {
      console.error('Error fetching user stats:', error)
      // More user-friendly error message
      const userMessage = error.message.includes('fetch') 
        ? 'Network error. Please check your connection and try again.' 
        : error.message || 'Failed to load your statistics. Please try again.';
      setError(userMessage)
      toast.error(userMessage)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check cache first
      const cachedTasks = clientCache.get('tasks')
      if (cachedTasks && cachedTasks.length > 0) {
        setTasks(cachedTasks)
        setLoading(false)
        return
      }

      const data = await retryApiCall(async () => {
        const response = await optimizedFetch('/api/tasks', {
          timeout: 10000,
          retries: 2,
          retryDelay: 2000
        })
        if (response.ok) {
          return await response.json()
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch tasks')
        }
      })

      // Validate tasks data before setting
      const validTasks = Array.isArray(data.tasks)
        ? data.tasks.filter((t: any) => t && t.id && t.status && t.title)
        : []
      
      // Cache the results for 2 minutes
      clientCache.set('tasks', validTasks, 2 * 60 * 1000)
      setTasks(validTasks)
    } catch (error: any) {
      console.error('Error fetching tasks:', error)
      // More user-friendly error message
      const userMessage = error.message.includes('fetch') 
        ? 'Network error. Please check your connection and try again.' 
        : error.message || 'Failed to load your tasks. Please try again.';
      setError(userMessage)
      toast.error(userMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyQuote = async () => {
    try {
      // Check cache first
      const cachedQuote = clientCache.get('daily_quote')
      if (cachedQuote) {
        setDailyQuote(cachedQuote)
        return
      }

      const data = await retryApiCall(async () => {
        const response = await optimizedFetch('/api/quotes/daily', {
          timeout: 5000,
          retries: 1,
          retryDelay: 1000
        })
        if (response.ok) {
          return await response.json()
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch daily quote')
        }
      })

      const quoteData = data.quote || {
        text: "And Allah is with those who are patient.",
        source: "Quran 2:153"
      }

      // Cache the results for 1 hour
      clientCache.set('daily_quote', quoteData, 60 * 60 * 1000)
      setDailyQuote(quoteData)
    } catch (error: any) {
      console.error('Error fetching daily quote:', error)
      // Don't show error to user for quotes as it's not critical
      setDailyQuote({
        text: "And Allah is with those who are patient.",
        source: "Quran 2:153"
      })
    }
  }

  const createTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Please enter a task title')
      return
    }

    try {
      const response = await optimizedFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
        timeout: 8000,
        retries: 1
      })

      if (response.ok) {
        const data = await response.json()
        setTasks(prev => [data.task, ...prev])
        setNewTask({ title: '', description: '', urgent: false, important: false })
        setShowNewTask(false)
        toast.success('Task created successfully!')
        fetchUserStats()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }
    } catch (error: any) {
      console.error('Error creating task:', error)
      const userMessage = error.message.includes('fetch') 
        ? 'Network error. Please check your connection and try again.' 
        : error.message || 'Failed to create task. Please try again.';
      toast.error(userMessage)
    }
  }

  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task || !task.status) {
        console.error('Task not found or invalid:', taskId)
        toast.error('Task not found')
        return
      }

      const newStatus = task.status.toUpperCase() === 'COMPLETED' ? 'TODO' : 'COMPLETED'

      const response = await optimizedFetch('/api/tasks/' + taskId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        timeout: 8000,
        retries: 1
      })

      if (response.ok) {
        setTasks(prev => prev.map(t =>
          t.id === taskId
            ? { ...t, status: newStatus, completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined }
            : t
        ))
        toast.success(newStatus === 'COMPLETED' ? '🎉 Task completed!' : 'Task reopened')
        // Clear cache when task status changes
        clientCache.clear()
        fetchUserStats()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }
    } catch (error: any) {
      console.error('Error toggling task:', error)
      const userMessage = error.message.includes('fetch') 
        ? 'Network error. Please check your connection and try again.' 
        : error.message || 'Failed to update task. Please try again.';
      toast.error(userMessage)
    }
  }

  const deleteTask = async (taskId: string) => {
    // Use a more accessible confirmation method
    const confirmed = window.confirm('Are you sure you want to delete this task?')
    if (!confirmed) return

    try {
      const response = await optimizedFetch('/api/tasks/' + taskId, {
        method: 'DELETE',
        timeout: 8000,
        retries: 1
      })

      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId))
        toast.success('Task deleted')
        // Clear cache when task is deleted
        clientCache.clear()
        fetchUserStats()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }
    } catch (error: any) {
      console.error('Error deleting task:', error)
      const userMessage = error.message.includes('fetch') 
        ? 'Network error. Please check your connection and try again.' 
        : error.message || 'Failed to delete task. Please try again.';
      toast.error(userMessage)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const filteredTasks = tasks.filter(task => {
    if (!task || !task.status) return false
    if (filter === 'all') return true
    if (filter === 'completed') return task.status.toUpperCase() === 'COMPLETED'
    if (!showCompletedTasks && task.status.toUpperCase() === 'COMPLETED') return false
    return task.status.toUpperCase() !== 'COMPLETED'
  })

  const totalEstimatedMinutes = tasks.reduce((total, task) => total + (task.estimatedTime ?? 0), 0)
  const focusHours = totalEstimatedMinutes / 60
  const displayedFocusTime = focusHours > 0 ? `${focusHours.toFixed(1)}h` : '0h'

  const completionRate = stats && stats.totalTasks > 0 ? (stats.tasksCompleted / stats.totalTasks) * 100 : 0
  const goalProgress = stats && stats.weeklyGoals > 0 ? (stats.completedGoals / stats.weeklyGoals) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-4 shadow-lg"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 font-medium flex-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchTasks()
                    fetchDailyQuote()
                    fetchUserStats()
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950/30"
                >
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
          <LoadingState message="Loading your dashboard..." size="lg" />
        )}

        {/* Error State */}
        {!loading && error && !tasks.length && (
          <ErrorState 
            title="Unable to Load Dashboard" 
            message={error}
            onRetry={() => {
              fetchTasks()
              fetchDailyQuote()
              fetchUserStats()
            }}
            retryLabel="Retry Loading"
          />
        )}

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden"
        >
          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-700 text-white relative overflow-hidden">
            {/* Background patterns */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between gap-4">
                {/* User Info - Compact */}
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="h-12 w-12 border-2 border-white/30 shadow-lg">
                    <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                    <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-lg font-bold">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold truncate">
                      {getGreeting()}, {session?.user?.name || 'User'}! 👋
                    </h1>
                    <p className="text-white/80 text-sm">Let's be productive today</p>
                  </div>
                </div>

                {/* Streak Badge - Compact */}
                <div className="bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-2 border border-white/30">
                  <Flame className="h-5 w-5 text-orange-300" />
                  <div className="text-left">
                    <div className="text-2xl font-bold leading-none">{stats ? stats.streak : '--'}</div>
                    <div className="text-xs text-white/80">days</div>
                  </div>
                </div>
              </div>

              {/* Daily Quote - Compact */}
              {dailyQuote && (
                <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                  <p className="text-white/95 text-sm font-medium italic leading-relaxed">
                    "{dailyQuote.text}"
                  </p>
                  <p className="text-white/70 text-xs mt-1">— {dailyQuote.source}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tasks Completed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 dark:border dark:border-blue-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-300 mb-1">Tasks Done</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{stats ? stats.tasksCompleted : '--'}<span className="text-sm text-blue-500 dark:text-blue-400">/{stats ? stats.totalTasks : '--'}</span></p>
                  </div>
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="bg-blue-200/50 dark:bg-blue-900/40 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: (stats ? completionRate : 0) + '%' }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
                    />
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 text-right font-medium">{stats ? Math.round(completionRate) + '%' : '--%'}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Productivity Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 dark:border dark:border-emerald-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-300 mb-1">Productivity</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-200">{stats ? `${stats.productivityScore}%` : '--%'}</p>
                  </div>
                  <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="bg-emerald-200/50 dark:bg-emerald-900/40 rounded-full h-2">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{width: `${stats ? stats.productivityScore : 0}%`}}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 dark:border dark:border-purple-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-300 mb-1">Weekly Goals</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-200">{stats ? stats.completedGoals : '--'}<span className="text-sm text-purple-500 dark:text-purple-400">/{stats ? stats.weeklyGoals : '--'}</span></p>
                  </div>
                  <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center">
                    <Target className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="bg-purple-200/50 dark:bg-purple-900/40 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: (stats ? goalProgress : 0) + '%' }}
                      transition={{ delay: 0.4, duration: 0.8 }}
                      className="bg-gradient-to-r from-purple-500 to-violet-500 h-full rounded-full"
                    />
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 text-right font-medium">{stats ? Math.round(goalProgress) + '%' : '--%'}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Focus Time */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 dark:border dark:border-orange-900/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-300 mb-1">Focus Time</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-200">
                      {displayedFocusTime}
                    </p>
                  </div>
                  <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/50 rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-none text-xs h-8"
                  onClick={() => window.location.href = '/focus'}
                >
                  {totalEstimatedMinutes > 0 ? 'Continue Session' : 'Start First Session'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Insights Section - Compact */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 dark:border-indigo-900/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm mb-1">AI Suggestion</h3>
                <p className="text-indigo-700 dark:text-indigo-300 text-xs leading-relaxed">
                  Complete Quran reading after Fajr for maximum focus and spiritual connection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tasks Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Today's Tasks</h2>
                <p className="text-slate-600 dark:text-slate-300 mt-1">Focus on what truly matters</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  className="border-slate-200 dark:border-slate-700"
                  aria-label={viewMode === 'grid' ? "Switch to list view" : "Switch to grid view"}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                  className="border-slate-200 dark:border-slate-700"
                  aria-label={showCompletedTasks ? "Hide completed tasks" : "Show completed tasks"}
                >
                  {showCompletedTasks ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={() => setShowNewTask(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg border-none"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </div>

            {/* Task Filters */}
            <Card className="border-slate-200 dark:border-slate-700 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  {['all', 'pending', 'completed'].map((filterOption) => (
                    <Button
                      key={filterOption}
                      variant={filter === filterOption ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter(filterOption as 'all' | 'pending' | 'completed')}
                      className={filter === filterOption
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                      aria-pressed={filter === filterOption}
                    >
                      {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                      {filter === filterOption && (
                        <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                          {filteredTasks.length}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tasks List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 bg-emerald-500/20 rounded-full"></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={'group border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 ' +
                          (task.status.toUpperCase() === 'COMPLETED'
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-white dark:bg-slate-800/50 hover:border-emerald-300 dark:hover:border-emerald-700'
                          )
                        }>
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleTask(task.id)}
                                className={'h-7 w-7 rounded-full flex-shrink-0 transition-all ' +
                                  (task.status.toUpperCase() === 'COMPLETED'
                                    ? 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                                    : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                                  )
                                }
                                aria-label={task.status.toUpperCase() === 'COMPLETED' ? "Mark task as incomplete" : "Mark task as complete"}
                              >
                                {task.status.toUpperCase() === 'COMPLETED' ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  <Circle className="h-5 w-5" />
                                )}
                              </Button>

                              <div className="flex-1 min-w-0">
                                <h3 className={'text-lg font-semibold mb-1 ' +
                                  (task.status.toUpperCase() === 'COMPLETED'
                                    ? 'line-through text-slate-500 dark:text-slate-400'
                                    : 'text-slate-900 dark:text-slate-100'
                                  )
                                }>
                                  {task.title}
                                </h3>
                                {task.description && (
                                  <p className={'text-sm mb-3 ' +
                                    (task.status.toUpperCase() === 'COMPLETED'
                                      ? 'text-slate-400 dark:text-slate-500'
                                      : 'text-slate-600 dark:text-slate-400'
                                    )
                                  }>
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 flex-wrap">
                                  {task.urgent && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                                      <AlertCircle className="h-3 w-3" />
                                      Urgent
                                    </span>
                                  )}
                                  {task.important && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                                      <Flag className="h-3 w-3" />
                                      Important
                                    </span>
                                  )}
                                  {task.aiSuggested && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium">
                                      <Brain className="h-3 w-3" />
                                      AI Suggested
                                    </span>
                                  )}
                                  {task.estimatedTime && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">
                                      <Clock className="h-3 w-3" />
                                      {task.estimatedTime}m
                                    </span>
                                  )}
                                </div>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteTask(task.id)}
                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                aria-label="Delete task"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {filteredTasks.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                  >
                    <Card className="border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                      <CardContent className="p-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                          {filter === 'completed' ? (
                            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Target className="h-10 w-10 text-slate-400" />
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                          {filter === 'completed' ? 'No completed tasks yet' : 'No tasks found'}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
                          {filter === 'completed'
                            ? 'Complete some tasks to see them here and celebrate your progress!'
                            : 'Create your first task and start building productive habits today.'
                          }
                        </p>
                        <Button
                          onClick={() => setShowNewTask(true)}
                          size="lg"
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Create Your First Task
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-200 dark:hover:border-emerald-800 border border-transparent transition-all"
                  onClick={() => window.location.href = '/prayers'}
                >
                  <Activity className="h-4 w-4 mr-3 text-emerald-600" />
                  <span className="flex-1 text-left">Prayer Times</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:border-orange-200 dark:hover:border-orange-800 border border-transparent transition-all"
                  onClick={() => window.location.href = '/focus'}
                >
                  <Clock className="h-4 w-4 mr-3 text-orange-600" />
                  <span className="flex-1 text-left">Focus Session</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-purple-50 dark:hover:bg-purple-950/20 hover:border-purple-200 dark:hover:border-purple-800 border border-transparent transition-all"
                  onClick={() => window.location.href = '/journal'}
                >
                  <BookOpen className="h-4 w-4 mr-3 text-purple-600" />
                  <span className="flex-1 text-left">Journal</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-200 dark:hover:border-blue-800 border border-transparent transition-all"
                  onClick={() => window.location.href = '/goals'}
                >
                  <Target className="h-4 w-4 mr-3 text-blue-600" />
                  <span className="flex-1 text-left">Goals</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-200 dark:hover:border-indigo-800 border border-transparent transition-all"
                  onClick={() => window.location.href = '/analytics'}
                >
                  <BarChart3 className="h-4 w-4 mr-3 text-indigo-600" />
                  <span className="flex-1 text-left">Analytics</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {stats && stats.achievements && stats.achievements.length > 0 ? (
                  stats.achievements.map((achievement, index) => {
                    // Map achievement icons to Lucide React components
                    const getIconComponent = (iconName: string) => {
                      switch (iconName) {
                        case 'Star': return Star;
                        case 'Target': return Target;
                        case 'Brain': return Brain;
                        case 'Trophy': return Trophy;
                        case 'Flame': return Flame;
                        default: return Trophy;
                      }
                    };
                    
                    const IconComponent = getIconComponent(achievement.icon);
                    
                    // Determine color scheme based on icon
                    const getColorClasses = (iconName: string) => {
                      switch (iconName) {
                        case 'Star': return 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800/50 bg-amber-100 dark:bg-amber-900/50 text-amber-600';
                        case 'Target': return 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800/50 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600';
                        case 'Brain': return 'from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800/50 bg-purple-100 dark:bg-purple-900/50 text-purple-600';
                        case 'Flame': return 'from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800/50 bg-red-100 dark:bg-red-900/50 text-red-600';
                        default: return 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800/50 bg-blue-100 dark:bg-blue-900/50 text-blue-600';
                      }
                    };
                    
                    const colorClasses = getColorClasses(achievement.icon);
                    
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className={`flex items-center gap-3 p-4 bg-gradient-to-r ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[1]} rounded-xl border ${colorClasses.split(' ')[4]}`}
                      >
                        <div className={`h-12 w-12 ${colorClasses.split(' ')[2]} rounded-xl flex items-center justify-center shadow-md`}>
                          <IconComponent className={`h-6 w-6 ${colorClasses.split(' ')[3]}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white">{achievement.title}</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{achievement.description}</p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 mb-2">No achievements yet</p>
                    <p className="text-sm text-slate-500 dark:text-slate-500">Complete tasks to earn your first achievement!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prayer Times Widget */}
            <PrayerTimesWidget />
            
            {/* Productivity Tips */}
            <Card className="border-slate-200 dark:border-slate-700 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Productivity Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border border-yellow-200 dark:border-yellow-800/50">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <span className="font-semibold">Pro Tip:</span> Start your day with the most challenging task when your energy is highest.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800/50">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <span className="font-semibold">Reminder:</span> Take a 5-minute break every hour to maintain focus and prevent burnout.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/50">
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">
                    <span className="font-semibold">Suggestion:</span> Align your tasks with your natural energy cycles for maximum efficiency.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* New Task Modal */}
        <AnimatePresence>
          {showNewTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setShowNewTask(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create New Task</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewTask(false)}
                    className="rounded-full"
                    aria-label="Close new task form"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-5">
                  <div>
                    <Input
                      id="task-title"
                      label="Task Title"
                      required
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="What needs to be done?"
                      className="mt-2 h-12 text-base border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500"
                      autoFocus
                      description="Enter a clear and specific task title"
                    />
                  </div>

                  <div>
                    <Textarea
                      id="task-description"
                      label="Description"
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Add details about your task..."
                      className="mt-2 min-h-[100px] text-base border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 resize-none"
                      rows={4}
                      description="Optional: Add details about your task"
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={newTask.urgent}
                          onChange={(e) => setNewTask(prev => ({ ...prev, urgent: e.target.checked }))}
                          className="sr-only peer"
                          aria-label="Mark as urgent"
                        />
                        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded peer-checked:bg-red-500 peer-checked:border-red-500 transition-all"></div>
                        <CheckCircle2 className="absolute inset-0 h-5 w-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-red-600 transition-colors">
                        Urgent
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={newTask.important}
                          onChange={(e) => setNewTask(prev => ({ ...prev, important: e.target.checked }))}
                          className="sr-only peer"
                          aria-label="Mark as important"
                        />
                        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 rounded peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all"></div>
                        <CheckCircle2 className="absolute inset-0 h-5 w-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-amber-600 transition-colors">
                        Important
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-8">
                  <Button
                    onClick={createTask}
                    disabled={!newTask.title.trim()}
                    className="flex-1 h-12 text-base bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Task
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewTask(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
