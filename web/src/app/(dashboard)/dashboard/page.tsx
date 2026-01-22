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
  Filter,
  Grid3X3,
  List,
  AlertCircle,
  Flag,
  Activity,
  BookOpen,
  X,
  Sparkles,
  Calendar as CalendarIcon,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  Lightbulb,
  Eye,
  EyeOff,
  Edit2
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
import ConfirmModal from '@/components/modals/ConfirmModal'
import { optimizedFetch, PerformanceMonitor, clientCache } from '@/lib/performance'
import { useUserProfile } from '@/hooks/useUserProfile'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  urgent: boolean
  important: boolean
  estimatedTime?: number
  energyLevel?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  priority?: string
  dueDate?: string
  category?: {
    name: string
    color: string
  }
}

interface Stats {
  streak: number
  productivityScore: number
  tasksCompleted: number
  totalTasks: number
  weeklyGoals: number
  completedGoals: number
}

interface FocusStats {
  todayFocusTime: number
  todaySessionsCount: number
  weekFocusTime: number
  weekSessionsCount: number
  totalSessions: number
  streak: number
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }
  if (typeof error === 'string') {
    return new Error(error)
  }
  return new Error('Unknown error')
}

function isTimeoutError(error: Error): boolean {
  const message = (error.message || '').toLowerCase()
  return error.name === 'AbortError' || message.includes('timeout')
}

export default function DashboardPageRedesigned() {
  const { data: session } = useSession()
  const { profile } = useUserProfile()
  const userCacheKey = session?.user?.id ?? 'guest'
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [focusStats, setFocusStats] = useState<FocusStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [dailyQuote, setDailyQuote] = useState<{ text: string; source: string } | null>(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    urgent: false,
    important: false,
    estimatedTime: '',
    dueDate: '',
  })
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const tasksPerPage = 10
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchTasks()
      fetchDailyQuote()
      fetchUserStats()
      fetchFocusStats()
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
      const cachedStats = clientCache.get(`user_stats:${userCacheKey}`)
      if (cachedStats) {
        setStats(cachedStats)
        return
      }

      const data = await retryApiCall(async () => {
        const response = await optimizedFetch('/api/user/stats', {
          timeout: 15000, // Increased timeout for database queries
          retries: 2,
          retryDelay: 1500
        })
        if (response.ok) {
          return await response.json()
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch user stats')
        }
      })

      const statsData: Stats = {
        streak: data?.data?.streak ?? 0,
        productivityScore: data?.data?.productivityScore ?? 0,
        tasksCompleted: data?.data?.tasksCompleted ?? 0,
        totalTasks: data?.data?.totalTasks ?? 0,
        weeklyGoals: data?.data?.weeklyGoals ?? 0,
        completedGoals: data?.data?.completedGoals ?? 0
      }

      // Cache the results for only 5 seconds for real-time updates
      clientCache.set(`user_stats:${userCacheKey}`, statsData, 5 * 1000)
      setStats(statsData)
    } catch (error: unknown) {
      const normalizedError = normalizeError(error)
      const isTimeout = isTimeoutError(normalizedError)
      if (!isTimeout) {
        console.error('Error fetching user stats:', normalizedError)
      }
      const userMessage = isTimeout
        ? 'Network error. Please check your connection and try again.'
        : normalizedError.message || 'Failed to load your statistics. Please try again.'
      setError(userMessage)
      toast.error(userMessage)
    }
  }

  const fetchFocusStats = async () => {
    try {
      // Check cache first
      const cachedFocusStats = clientCache.get(`focus_stats:${userCacheKey}`)
      if (cachedFocusStats) {
        setFocusStats(cachedFocusStats)
        return
      }

      const data = await retryApiCall(async () => {
        const response = await optimizedFetch('/api/focus', {
          timeout: 15000, // Increased timeout for database queries
          retries: 2,
          retryDelay: 1500
        })
        if (response.ok) {
          return await response.json()
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch focus stats')
        }
      })

      const focusStatsData: FocusStats = {
        todayFocusTime: data?.today?.focusTime ?? 0,
        todaySessionsCount: data?.today?.sessions ?? 0,
        weekFocusTime: data?.week?.focusTime ?? 0,
        weekSessionsCount: data?.week?.sessions ?? 0,
        totalSessions: data?.allTime?.totalSessions ?? 0,
        streak: data?.allTime?.currentStreak ?? 0,
      }

      // Cache the results for 5 seconds for real-time updates
      clientCache.set(`focus_stats:${userCacheKey}`, focusStatsData, 5 * 1000)
      setFocusStats(focusStatsData)
    } catch (error: unknown) {
      // Silently fail for focus stats as it's not critical
      // Only log if it's not a timeout
      const normalizedError = normalizeError(error)
      if (!isTimeoutError(normalizedError)) {
        console.warn('Failed to load focus stats:', normalizedError.message)
      }
    }
  }

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check cache first
      const cachedTasks = clientCache.get(`tasks:${userCacheKey}`)
      if (cachedTasks && cachedTasks.length > 0) {
        // Filter cached tasks by today's date in user's local timezone
        const todaysTasks = filterTasksByToday(cachedTasks)
        setTasks(todaysTasks)
        setLoading(false)
        return
      }

      const data = await retryApiCall(async () => {
        const response = await optimizedFetch('/api/tasks', {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          timeout: 15000, // Increased timeout for database queries
          retries: 2,
          retryDelay: 2000
        })
        if (response.ok) {
          return await response.json()
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch tasks')
        }
      })

      // Validate tasks data before setting
      const validTasks = Array.isArray(data.data?.tasks)
        ? data.data.tasks.filter((t: any) => t && t.id && t.status && t.title)
        : []

      // Cache the results for 5 seconds for real-time updates
      clientCache.set(`tasks:${userCacheKey}`, validTasks, 5 * 1000)

      // Filter tasks to show only today's tasks in user's timezone
      const todaysTasks = filterTasksByToday(validTasks)
      setTasks(todaysTasks)
    } catch (error: unknown) {
      const normalizedError = normalizeError(error)
      const isTimeout = isTimeoutError(normalizedError)
      if (!isTimeout) {
        console.error('Error fetching tasks:', normalizedError)
      }
      const userMessage = isTimeout
        ? 'Network error. Please check your connection and try again.'
        : normalizedError.message || 'Failed to load your tasks. Please try again.'
      setError(userMessage)
      toast.error(userMessage)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to show all pending and today's completed tasks
  const filterTasksByToday = (tasks: Task[]) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today

    return tasks.filter(task => {
      const taskStatus = task.status?.toUpperCase()

      // Show all pending tasks (not completed or cancelled)
      if (taskStatus === 'TODO' || taskStatus === 'IN_PROGRESS') {
        return true
      }

      // For completed/cancelled tasks, only show if completed today
      if (taskStatus === 'COMPLETED' || taskStatus === 'CANCELLED') {
        const completedDate = task.completedAt
          ? new Date(task.completedAt)
          : (task.updatedAt ? new Date(task.updatedAt) : new Date(task.createdAt))
        completedDate.setHours(0, 0, 0, 0)
        return completedDate.getTime() === today.getTime()
      }

      return true
    })
  }

  const fetchDailyQuote = async () => {
    try {
      // Check cache first
      const cachedQuote = clientCache.get(`daily_quote:${userCacheKey}`)
      if (cachedQuote) {
        setDailyQuote(cachedQuote)
        return
      }

      const data = await retryApiCall(async () => {
        const response = await optimizedFetch('/api/quotes/daily', {
          timeout: 15000, // Increased to 15 seconds for database queries
          retries: 2,
          retryDelay: 1500
        })
        if (response.ok) {
          return await response.json()
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch daily quote')
        }
      })

      const quoteData = data.quote || {
        text: "And Allah is with those who are patient.",
        source: "Quran 2:153"
      }

      // Cache the results for 1 hour
      clientCache.set(`daily_quote:${userCacheKey}`, quoteData, 60 * 60 * 1000)
      setDailyQuote(quoteData)
    } catch (error: any) {
      // Silently use fallback quote, don't log as error (not critical)
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

    // Prevent double submission
    if (isCreatingTask) {
      return
    }

    setIsCreatingTask(true)

    try {
      // Prepare task data with proper formatting
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        urgent: newTask.urgent,
        important: newTask.important,
        status: 'TODO',
        estimatedTime: newTask.estimatedTime ? parseInt(newTask.estimatedTime) : null,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : null,
      }

      const response = await optimizedFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
        timeout: 8000,
        retries: 1
      })

      if (response.ok) {
        const data = await response.json()
        // Optimistic update - add to UI immediately
        setTasks(prev => [data.data, ...prev])
        setNewTask({ title: '', description: '', urgent: false, important: false, estimatedTime: '', dueDate: '' })
        setShowNewTask(false)
        toast.success('Task created successfully!')
        // Clear ALL cache and force immediate refetch
        clientCache.delete(`tasks:${userCacheKey}`)
        clientCache.delete(`user_stats:${userCacheKey}`)
        clientCache.delete(`focus_stats:${userCacheKey}`)
        setStats(null) // Force reload
        // Refetch everything to ensure sync with database
        await Promise.all([
          fetchTasks(),
          fetchUserStats(),
          fetchFocusStats()
        ])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }
    } catch (error: unknown) {
      const normalizedError = normalizeError(error)
      const isTimeout = isTimeoutError(normalizedError)
      if (!isTimeout) {
        console.error('Error creating task:', normalizedError)
      }
      const userMessage = isTimeout
        ? 'Network error. Please check your connection and try again.'
        : normalizedError.message || 'Failed to create task. Please try again.'
      toast.error(userMessage)
    } finally {
      setIsCreatingTask(false)
    }
  }

  const updateTask = async () => {
    if (!editingTask || !editingTask.title.trim()) {
      toast.error('Please enter a task title')
      return
    }

    if (isEditingTask) {
      return
    }

    setIsEditingTask(true)

    try {
      const response = await optimizedFetch('/api/tasks/' + editingTask.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTask.title,
          description: editingTask.description,
          urgent: editingTask.urgent,
          important: editingTask.important,
          estimatedTime: editingTask.estimatedTime || null,
          dueDate: editingTask.dueDate || null,
        }),
        timeout: 8000,
        retries: 1
      })

      if (response.ok) {
        const data = await response.json()
        // Optimistic update - update in UI immediately
        setTasks(prev => prev.map(t => t.id === editingTask.id ? data.data : t))
        setEditingTask(null)
        toast.success('Task updated successfully!')
        // Clear ALL cache and force immediate refetch
        clientCache.delete(`tasks:${userCacheKey}`)
        clientCache.delete(`user_stats:${userCacheKey}`)
        clientCache.delete(`focus_stats:${userCacheKey}`)
        setStats(null) // Force reload
        // Refetch everything to ensure sync with database
        await Promise.all([
          fetchTasks(),
          fetchUserStats(),
          fetchFocusStats()
        ])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }
    } catch (error: unknown) {
      const normalizedError = normalizeError(error)
      const isTimeout = isTimeoutError(normalizedError)
      if (!isTimeout) {
        console.error('Error updating task:', normalizedError)
      }
      const userMessage = isTimeout
        ? 'Network error. Please check your connection and try again.'
        : normalizedError.message || 'Failed to update task. Please try again.'
      toast.error(userMessage)
    } finally {
      setIsEditingTask(false)
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

      const currentStatus = task.status.toUpperCase()
      const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED'

      // Show confirmation for reopening completed tasks
      if (currentStatus === 'COMPLETED') {
        const confirmed = window.confirm('Reopen this task? It will be marked as incomplete.')
        if (!confirmed) return
      }

      // Optimistic update
      const previousTasks = tasks
      setTasks(prev => prev.map(t =>
        t.id === taskId
          ? {
            ...t,
            status: newStatus,
            completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined
          }
          : t
      ))

      try {
        const response = await optimizedFetch('/api/tasks/' + taskId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : null
          }),
          timeout: 8000,
          retries: 1
        })

        if (response.ok) {
          toast.success(newStatus === 'COMPLETED' ? 'Task completed!' : 'Task reopened')
          // Clear ALL cache when task status changes
          clientCache.delete(`tasks:${userCacheKey}`)
          clientCache.delete(`user_stats:${userCacheKey}`)
          clientCache.delete(`focus_stats:${userCacheKey}`)
          // Force immediate refetch of everything (no cache)
          setStats(null) // Clear stats to force reload
          await Promise.all([
            fetchTasks(),
            fetchUserStats(),
            fetchFocusStats()
          ])
        } else {
          // Revert optimistic update on error
          setTasks(previousTasks)
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update task')
        }
      } catch (error: unknown) {
        // Revert optimistic update on error
        setTasks(previousTasks)
        const normalizedError = normalizeError(error)
        const isTimeout = isTimeoutError(normalizedError)
        if (!isTimeout) {
          console.error('Error toggling task:', normalizedError)
        }
        const userMessage = isTimeout
          ? 'Network error. Please check your connection and try again.'
          : normalizedError.message || 'Failed to update task. Please try again.'
        toast.error(userMessage)
      }
    } catch (error: unknown) {
      const normalizedError = normalizeError(error)
      console.error('Toggle task error:', normalizedError)
      toast.error(normalizedError.message || 'Failed to update task')
    }
  }

  const deleteTask = async (taskId: string) => {
    // Open confirmation modal instead of window.confirm
    setTaskToDelete(taskId)
  }

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return

    setIsDeleting(true)
    try {
      const response = await optimizedFetch('/api/tasks/' + taskToDelete, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        timeout: 8000,
        retries: 1
      })

      if (response.ok) {
        // Optimistic update - remove from UI immediately
        setTasks(prev => prev.filter(t => t.id !== taskToDelete))
        toast.success('Task deleted')
        // Clear ALL cache and force immediate refetch
        clientCache.delete(`tasks:${userCacheKey}`)
        clientCache.delete(`user_stats:${userCacheKey}`)
        clientCache.delete(`focus_stats:${userCacheKey}`)
        setStats(null) // Force reload
        // Refetch everything to ensure sync with database
        await Promise.all([
          fetchTasks(),
          fetchUserStats(),
          fetchFocusStats()
        ])
        setTaskToDelete(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }
    } catch (error: unknown) {
      const normalizedError = normalizeError(error)
      const isTimeout = isTimeoutError(normalizedError)
      if (!isTimeout) {
        console.error('Error deleting task:', normalizedError)
      }
      const userMessage = isTimeout
        ? 'Network error. Please check your connection and try again.'
        : normalizedError.message || 'Failed to delete task. Please try again.'
      toast.error(userMessage)
    } finally {
      setIsDeleting(false)
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

    // First apply the main filter
    const taskStatus = task.status.toUpperCase()
    let passesFilter = false

    if (filter === 'all') {
      passesFilter = true
    } else if (filter === 'completed') {
      passesFilter = taskStatus === 'COMPLETED'
    } else if (filter === 'pending') {
      passesFilter = taskStatus !== 'COMPLETED'
    }

    // Then apply show/hide completed toggle (skip when user explicitly filters by completed)
    if (
      passesFilter &&
      filter !== 'completed' &&
      !showCompletedTasks &&
      taskStatus === 'COMPLETED'
    ) {
      return false
    }

    return passesFilter
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage)
  const startIndex = (currentPage - 1) * tasksPerPage
  const endIndex = startIndex + tasksPerPage
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter, showCompletedTasks])

  const totalEstimatedMinutes = tasks.filter(task => task).reduce((total, task) => total + (task.estimatedTime ?? 0), 0)
  const focusHours = totalEstimatedMinutes / 60
  const displayedFocusTime = focusHours > 0 ? `${focusHours.toFixed(1)}h` : '0h'

  const completionRate = stats && stats.totalTasks > 0 ? (stats.tasksCompleted / stats.totalTasks) * 100 : 0
  const goalProgress = stats && stats.weeklyGoals > 0 ? (stats.completedGoals / stats.weeklyGoals) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/80 via-blue-50/30 to-emerald-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/40 to-cyan-100/40 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-100/40 to-teal-100/40 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-full blur-3xl"></div>
      </div>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6 relative z-10">
        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-600/70 rounded-2xl p-4 shadow-lg dark:shadow-red-500/30"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-200 font-medium flex-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    fetchTasks()
                    fetchDailyQuote()
                    fetchUserStats()
                    fetchFocusStats()
                  }}
                  className="text-red-600 dark:text-red-300 border-red-200 dark:border-red-600/70 hover:bg-red-100 dark:hover:bg-red-900/50 dark:hover:border-red-500/70"
                >
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
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
              fetchFocusStats()
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
          <Card className="border-none shadow-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 dark:from-blue-600 dark:via-cyan-600 dark:to-teal-600 text-white relative overflow-hidden shadow-emerald-500/20 dark:shadow-blue-500/30">
            {/* Background patterns */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
              {/* Islamic geometric pattern */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23ffffff' fill-opacity='0.4'/%3E%3C/svg%3E\")", backgroundSize: "30px 30px" }}></div>
            </div>

            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                {/* User Info - Compact */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-white/30 shadow-lg shrink-0">
                    <AvatarImage src={profile?.image || ''} alt={profile?.name || 'User'} />
                    <AvatarFallback className="bg-white/20 backdrop-blur-sm text-white text-lg font-bold">
                      {profile?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold truncate leading-tight">
                      {getGreeting()}, {profile?.name || 'User'}!
                    </h1>
                    <p className="text-white/80 text-xs sm:text-sm truncate">Let's be productive today</p>
                  </div>
                </div>

                {/* Streak Badge - Compact */}
                <div className="flex sm:block justify-start sm:justify-end w-full sm:w-auto">
                  <div className="bg-white/20 backdrop-blur-md rounded-xl px-4 py-2 flex items-center gap-3 border border-white/30 w-full sm:w-auto">
                    <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-300" />
                    <div className="text-left">
                      <div className="text-xl sm:text-2xl font-bold leading-none">{stats?.streak || 0}</div>
                      <div className="text-xs text-white/80">day streak</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Quote - Compact */}
              {dailyQuote && (
                <div className="mt-4 sm:mt-6 bg-white/10 backdrop-blur-md rounded-xl p-3 sm:p-4 border border-white/20">
                  <p className="text-white/95 text-xs sm:text-sm font-medium italic leading-relaxed">
                    "{dailyQuote.text}"
                  </p>
                  <p className="text-white/70 text-[10px] sm:text-xs mt-1.5">-- {dailyQuote.source}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid - Compact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Tasks Completed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border border-blue-100 dark:border-blue-700/70 shadow-lg shadow-blue-100/50 dark:shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-200/60 dark:hover:shadow-blue-500/40 transition-all duration-300 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/80 dark:from-slate-800 dark:via-blue-900/80 dark:to-indigo-900/80 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-300 mb-1">Tasks Done</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">{stats?.tasksCompleted || 0}<span className="text-sm text-blue-500 dark:text-blue-300">/{stats?.totalTasks || 0}</span></p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-100 to-blue-200/80 dark:from-blue-800/70 dark:to-blue-700/70 rounded-xl flex items-center justify-center shadow-inner shadow-blue-300/30 dark:shadow-blue-900/30 ring-1 ring-blue-200/50 dark:ring-blue-600/50">
                    <CheckCircle2 className="h-6 w-6 text-blue-700 dark:text-blue-200 drop-shadow-sm" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="bg-blue-100/80 dark:bg-blue-900/60 rounded-full h-2.5 overflow-hidden shadow-inner ring-1 ring-blue-200/40 dark:ring-blue-700/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionRate}%` }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 h-full rounded-full shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer 2s infinite', backgroundSize: '200% 100%' }}></div>
                    </motion.div>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1.5 text-right font-semibold">{Math.round(completionRate)}%</p>
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
            <Card className="border border-emerald-100 dark:border-emerald-700/70 shadow-lg shadow-emerald-100/50 dark:shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-200/60 dark:hover:shadow-emerald-500/40 transition-all duration-300 bg-gradient-to-br from-white via-emerald-50/60 to-teal-50/80 dark:from-slate-800 dark:via-emerald-900/80 dark:to-teal-900/80 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-300 mb-1">Productivity</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-200">{stats?.productivityScore || 0}%</p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-emerald-100 to-emerald-200/80 dark:from-emerald-800/70 dark:to-emerald-700/70 rounded-xl flex items-center justify-center shadow-inner shadow-emerald-300/30 dark:shadow-emerald-900/30 ring-1 ring-emerald-200/50 dark:ring-emerald-600/50">
                    <TrendingUp className="h-6 w-6 text-emerald-700 dark:text-emerald-200 drop-shadow-sm" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="bg-emerald-100/80 dark:bg-emerald-900/60 rounded-full h-2.5 overflow-hidden shadow-inner ring-1 ring-emerald-200/40 dark:ring-emerald-700/50">
                    <div className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 rounded-full shadow-sm relative overflow-hidden" style={{ width: `${stats?.productivityScore || 0}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer 2s infinite', backgroundSize: '200% 100%' }}></div>
                    </div>
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
            <Card className="border border-purple-100 dark:border-purple-700/70 shadow-lg shadow-purple-100/50 dark:shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-200/60 dark:hover:shadow-purple-500/40 transition-all duration-300 bg-gradient-to-br from-white via-purple-50/60 to-violet-50/80 dark:from-slate-800 dark:via-purple-900/80 dark:to-violet-900/80 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-300 mb-1">Weekly Goals</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-200">{stats?.completedGoals || 0}<span className="text-sm text-purple-500 dark:text-purple-300">/{stats?.weeklyGoals || 0}</span></p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-purple-100 to-purple-200/80 dark:from-purple-800/70 dark:to-purple-700/70 rounded-xl flex items-center justify-center shadow-inner shadow-purple-300/30 dark:shadow-purple-900/30 ring-1 ring-purple-200/50 dark:ring-purple-600/50">
                    <Target className="h-6 w-6 text-purple-700 dark:text-purple-200 drop-shadow-sm" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="bg-purple-100/80 dark:bg-purple-900/60 rounded-full h-2.5 overflow-hidden shadow-inner ring-1 ring-purple-200/40 dark:ring-purple-700/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${goalProgress}%` }}
                      transition={{ delay: 0.4, duration: 0.8 }}
                      className="bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 h-full rounded-full shadow-sm relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer 2s infinite', backgroundSize: '200% 100%' }}></div>
                    </motion.div>
                  </div>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1.5 text-right font-semibold">{Math.round(goalProgress)}%</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Focus Time - Dynamic Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border border-orange-100 dark:border-orange-700/70 shadow-lg shadow-orange-100/50 dark:shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-200/60 dark:hover:shadow-orange-500/40 transition-all duration-300 bg-gradient-to-br from-white via-orange-50/60 to-red-50/80 dark:from-slate-800 dark:via-orange-900/80 dark:to-red-900/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-300 mb-1">Focus Time</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-200">
                      {focusStats ? `${Math.floor(focusStats.todayFocusTime / 60)}h ${focusStats.todayFocusTime % 60}m` : '0h 0m'}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-br from-orange-100 to-orange-200/80 dark:from-orange-800/70 dark:to-orange-700/70 rounded-xl flex items-center justify-center shadow-inner shadow-orange-300/30 dark:shadow-orange-900/30 ring-1 ring-orange-200/50 dark:ring-orange-600/50">
                    <Brain className="h-6 w-6 text-orange-700 dark:text-orange-200 drop-shadow-sm" />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-slate-900 dark:text-white border-none text-xs h-8 shadow-md hover:shadow-lg transition-all"
                  onClick={() => window.location.href = '/focus'}
                >
                  {focusStats && focusStats.todaySessionsCount > 0 ? 'Continue Session' : 'Start First Session'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Tasks Section */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Task Header */}
            <Card className="border-2 border-emerald-200 dark:border-emerald-700/50 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 shadow-xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Today's Tasks</h2>
                        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-800/60 text-emerald-700 dark:text-emerald-200 text-sm font-semibold shadow-sm">
                          {filteredTasks.length}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
                        {filteredTasks.length > tasksPerPage ? (
                          <>Showing {startIndex + 1}-{Math.min(endIndex, filteredTasks.length)} of {filteredTasks.length} tasks</>
                        ) : (
                          <>Focus on what truly matters - Tasks reset daily</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="border-2 border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-white dark:hover:bg-slate-700 shadow-sm"
                      aria-label={viewMode === 'grid' ? "Switch to list view" : "Switch to grid view"}
                    >
                      {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid3X3 className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={filter === 'completed'}
                      onClick={() => {
                        if (filter === 'completed') return
                        setShowCompletedTasks(prev => !prev)
                      }}
                      className="border-2 border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-white dark:hover:bg-slate-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={
                        filter === 'completed'
                          ? "Show/hide toggle disabled while viewing completed tasks"
                          : showCompletedTasks
                            ? "Hide completed tasks"
                            : "Show completed tasks"
                      }
                    >
                      {showCompletedTasks ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                    <Button
                      onClick={() => setShowNewTask(true)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-900 dark:text-white shadow-lg border-none"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Filters */}
            <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
              <CardContent className="p-5">
                <div className="flex flex-col gap-4">
                  {/* Filter Buttons */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-700/80 rounded-xl ring-2 ring-slate-200 dark:ring-slate-600 shadow-sm">
                      <Filter className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filter:</span>
                    </div>
                    {['all', 'pending', 'completed'].map((filterOption) => (
                      <Button
                        key={filterOption}
                        variant={filter === filterOption ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter(filterOption as 'all' | 'pending' | 'completed')}
                        className={filter === filterOption
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-900 dark:text-white shadow-lg shadow-emerald-300/50 dark:shadow-emerald-500/30 ring-2 ring-emerald-400/40 dark:ring-emerald-500/40 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 border-2 border-slate-200 dark:border-slate-600 hover:border-emerald-200 dark:hover:border-emerald-600/50 hover:shadow-md font-medium'
                        }
                        aria-pressed={filter === filterOption}
                      >
                        {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                        {filter === filterOption && (
                          <span className="ml-2 bg-white/30 dark:bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold shadow-inner">
                            {filteredTasks.length}
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
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
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4' : 'space-y-2 sm:space-y-3'}>
                  <AnimatePresence mode="popLayout">
                    {paginatedTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={'group transition-all duration-300 rounded-2xl overflow-hidden ' +
                          (task.status.toUpperCase() === 'COMPLETED'
                            ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20 border-2 border-emerald-300 dark:border-emerald-600/50 shadow-lg shadow-emerald-200/40 dark:shadow-emerald-500/20'
                            : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/60 dark:shadow-slate-500/20 hover:shadow-2xl hover:shadow-emerald-300/40 dark:hover:shadow-emerald-500/30 hover:border-emerald-300 dark:hover:border-emerald-500/70 hover:-translate-y-1 hover:scale-[1.02]'
                          )
                        }>
                          <CardContent className="p-3 sm:p-4 md:p-6">
                            <div className="flex items-start gap-2 sm:gap-3 md:gap-5">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleTask(task.id)}
                                disabled={task.status.toUpperCase() === 'COMPLETED'}
                                className={'h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full flex-shrink-0 transition-all ring-2 shadow-md ' +
                                  (task.status.toUpperCase() === 'COMPLETED'
                                    ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-800/60 ring-emerald-400 dark:ring-emerald-500/50 shadow-emerald-300/60 dark:shadow-emerald-500/40 cursor-not-allowed opacity-70'
                                    : 'text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 ring-slate-300 dark:ring-slate-600 hover:ring-emerald-400 dark:hover:ring-emerald-500/50 shadow-slate-300/40 cursor-pointer'
                                  )
                                }
                                aria-label={task.status.toUpperCase() === 'COMPLETED' ? "Task completed" : "Mark task as complete"}
                              >
                                {task.status.toUpperCase() === 'COMPLETED' ? (
                                  <CheckCircle2 className="h-6 w-6" />
                                ) : (
                                  <Circle className="h-6 w-6" />
                                )}
                              </Button>

                              <div className="flex-1 min-w-0">
                                <h3 className={'text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 ' +
                                  (task.status.toUpperCase() === 'COMPLETED'
                                    ? 'line-through text-slate-500 dark:text-slate-400'
                                    : 'text-slate-900 dark:text-slate-100'
                                  )
                                }>
                                  {task.title}
                                </h3>
                                {task.description && (
                                  <p className={'text-xs sm:text-sm mb-2 sm:mb-3 md:mb-4 leading-relaxed ' +
                                    (task.status.toUpperCase() === 'COMPLETED'
                                      ? 'line-through text-slate-400 dark:text-slate-500'
                                      : 'text-slate-600 dark:text-slate-300'
                                    )
                                  }>
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 flex-wrap">
                                  {task.urgent && (
                                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200 text-[10px] sm:text-xs md:text-sm font-semibold border border-red-200 dark:border-red-700/50 shadow-sm">
                                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                                      Urgent
                                    </span>
                                  )}
                                  {task.important && (
                                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-200 text-[10px] sm:text-xs md:text-sm font-semibold border border-amber-200 dark:border-amber-700/50 shadow-sm">
                                      <Flag className="h-3 w-3 sm:h-4 sm:w-4" />
                                      Important
                                    </span>
                                  )}
                                  {task.estimatedTime && (
                                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-200 text-[10px] sm:text-xs md:text-sm font-semibold border border-blue-200 dark:border-blue-700/50 shadow-sm">
                                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                      {task.estimatedTime}m
                                    </span>
                                  )}
                                  {task.dueDate && (
                                    <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200 text-[10px] sm:text-xs md:text-sm font-semibold border border-indigo-200 dark:border-indigo-700/50 shadow-sm">
                                      <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all self-start sm:self-center mt-1 sm:mt-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingTask(task)}
                                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all flex-shrink-0"
                                  aria-label="Edit task"
                                >
                                  <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteTask(task.id)}
                                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40 transition-all flex-shrink-0"
                                  aria-label="Delete task"
                                >
                                  <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Button>
                              </div>
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
                    className="text-center py-20"
                  >
                    <Card className="border-dashed border-2 border-emerald-200 dark:border-emerald-700/50 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10 shadow-xl">
                      <CardContent className="p-16">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
                          {filter === 'completed' ? (
                            <CheckCircle2 className="h-12 w-12 text-white" />
                          ) : (
                            <Target className="h-12 w-12 text-white" />
                          )}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                          {filter === 'completed' ? 'No completed tasks yet' : 'No tasks found'}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto text-lg">
                          {filter === 'completed'
                            ? 'Complete some tasks to see them here and celebrate your progress!'
                            : 'Create your first task and start building productive habits today.'
                          }
                        </p>
                        <Button
                          onClick={() => setShowNewTask(true)}
                          size="lg"
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-900 dark:text-white shadow-lg"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Create Your First Task
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Pagination */}
                {filteredTasks.length > tasksPerPage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 pt-8"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-600 disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Show first page, last page, current page, and pages around current
                        const showPage = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
                        const showEllipsis = (page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2)

                        if (!showPage && !showEllipsis) return null

                        if (showEllipsis) {
                          return (
                            <span key={`ellipsis-${page}`} className="px-2 text-slate-500 dark:text-slate-400">
                              ...
                            </span>
                          )
                        }

                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page
                              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 dark:text-white shadow-md hover:from-emerald-600 hover:to-teal-600 min-w-[2.5rem]"
                              : "text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-600 min-w-[2.5rem]"
                            }
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-600 disabled:opacity-40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-300/70 dark:shadow-slate-500/30 bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start group/btn hover:bg-emerald-50/80 dark:hover:bg-emerald-900/30 hover:border-emerald-200 dark:hover:border-emerald-700/70 border border-slate-100 dark:border-slate-700 hover:shadow-md hover:shadow-emerald-100/50 dark:hover:shadow-emerald-500/30 transition-all rounded-xl hover:-translate-x-1"
                  onClick={() => window.location.href = '/prayers'}
                >
                  <Activity className="h-4 w-4 mr-3 text-emerald-600 dark:text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                  <span className="flex-1 text-left font-medium text-slate-700 dark:text-slate-200 group-hover/btn:text-emerald-700 dark:group-hover/btn:text-emerald-300">Prayer Times</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-400 group-hover/btn:text-emerald-600 dark:group-hover/btn:text-emerald-300 group-hover/btn:translate-x-1 transition-all" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start group/btn hover:bg-orange-50/80 dark:hover:bg-orange-900/30 hover:border-orange-200 dark:hover:border-orange-700/70 border border-slate-100 dark:border-slate-700 hover:shadow-md hover:shadow-orange-100/50 dark:hover:shadow-orange-500/30 transition-all rounded-xl hover:-translate-x-1"
                  onClick={() => window.location.href = '/focus'}
                >
                  <Brain className="h-4 w-4 mr-3 text-orange-600 dark:text-orange-400 group-hover/btn:scale-110 transition-transform" />
                  <span className="flex-1 text-left font-medium text-slate-700 dark:text-slate-200 group-hover/btn:text-orange-700 dark:group-hover/btn:text-orange-300">Focus Session</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-400 group-hover/btn:text-orange-600 dark:group-hover/btn:text-orange-300 group-hover/btn:translate-x-1 transition-all" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start group/btn hover:bg-purple-50/80 dark:hover:bg-purple-900/30 hover:border-purple-200 dark:hover:border-purple-700/70 border border-slate-100 dark:border-slate-700 hover:shadow-md hover:shadow-purple-100/50 dark:hover:shadow-purple-500/30 transition-all rounded-xl hover:-translate-x-1"
                  onClick={() => window.location.href = '/journal'}
                >
                  <BookOpen className="h-4 w-4 mr-3 text-purple-600 dark:text-purple-400 group-hover/btn:scale-110 transition-transform" />
                  <span className="flex-1 text-left font-medium text-slate-700 dark:text-slate-200 group-hover/btn:text-purple-700 dark:group-hover/btn:text-purple-300">Journal</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-400 group-hover/btn:text-purple-600 dark:group-hover/btn:text-purple-300 group-hover/btn:translate-x-1 transition-all" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start group/btn hover:bg-blue-50/80 dark:hover:bg-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700/70 border border-slate-100 dark:border-slate-700 hover:shadow-md hover:shadow-blue-100/50 dark:hover:shadow-blue-500/30 transition-all rounded-xl hover:-translate-x-1"
                  onClick={() => window.location.href = '/goals'}
                >
                  <Target className="h-4 w-4 mr-3 text-blue-600 dark:text-blue-400 group-hover/btn:scale-110 transition-transform" />
                  <span className="flex-1 text-left font-medium text-slate-700 dark:text-slate-200 group-hover/btn:text-blue-700 dark:group-hover/btn:text-blue-300">Goals</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-400 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-300 group-hover/btn:translate-x-1 transition-all" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start group/btn hover:bg-indigo-50/80 dark:hover:bg-indigo-900/30 hover:border-indigo-200 dark:hover:border-indigo-700/70 border border-slate-100 dark:border-slate-700 hover:shadow-md hover:shadow-indigo-100/50 dark:hover:shadow-indigo-500/30 transition-all rounded-xl hover:-translate-x-1"
                  onClick={() => window.location.href = '/analytics'}
                >
                  <BarChart3 className="h-4 w-4 mr-3 text-indigo-600 dark:text-indigo-400 group-hover/btn:scale-110 transition-transform" />
                  <span className="flex-1 text-left font-medium text-slate-700 dark:text-slate-200 group-hover/btn:text-indigo-700 dark:group-hover/btn:text-indigo-300">Analytics</span>
                  <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-400 group-hover/btn:text-indigo-600 dark:group-hover/btn:text-indigo-300 group-hover/btn:translate-x-1 transition-all" />
                </Button>
              </CardContent>
            </Card>
            {/* Prayer Times Widget */}
            <PrayerTimesWidget />
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
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl border-2 border-slate-200 dark:border-slate-700"
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

                <div className="space-y-4">
                  <div>
                    <Input
                      id="task-title"
                      label="Task Title"
                      required
                      value={newTask.title}
                      onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="What needs to be done?"
                      className="mt-2 h-12 text-base border-2 border-slate-200 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/30 shadow-sm"
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
                      className="mt-2 min-h-[100px] text-base border-2 border-slate-200 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-500 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/30 shadow-sm resize-none"
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
                        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-500 rounded peer-checked:bg-red-500 peer-checked:border-red-500 transition-all"></div>
                        <CheckCircle2 className="absolute inset-0 h-5 w-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
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
                        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-500 rounded peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all"></div>
                        <CheckCircle2 className="absolute inset-0 h-5 w-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        Important
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <Button
                    onClick={createTask}
                    disabled={!newTask.title.trim() || isCreatingTask}
                    className="flex-1 h-12 text-base bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-900 dark:text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingTask ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Create Task
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewTask(false)}
                    className="border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Task Modal */}
        <AnimatePresence>
          {editingTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setEditingTask(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl border-2 border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Edit Task</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingTask(null)}
                    className="rounded-full"
                    aria-label="Close edit task form"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Input
                      id="edit-task-title"
                      label="Task Title"
                      required
                      value={editingTask.title}
                      onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                      placeholder="What needs to be done?"
                      className="mt-2 h-12 text-base border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/30 shadow-sm"
                      autoFocus
                      description="Enter a clear and specific task title"
                    />
                  </div>

                  <div>
                    <Textarea
                      id="edit-task-description"
                      label="Description"
                      value={editingTask.description || ''}
                      onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                      placeholder="Add details about your task..."
                      className="mt-2 min-h-[100px] text-base border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-500 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900/30 shadow-sm resize-none"
                      rows={4}
                      description="Optional: Add details about your task"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-estimated-time">Estimated Time (minutes)</Label>
                      <Input
                        id="edit-estimated-time"
                        type="number"
                        min="0"
                        value={editingTask.estimatedTime || ''}
                        onChange={(e) => setEditingTask(prev => prev ? { ...prev, estimatedTime: e.target.value ? parseInt(e.target.value) : undefined } : null)}
                        placeholder="30"
                        className="mt-2 h-10 border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-due-date">Due Date</Label>
                      <Input
                        id="edit-due-date"
                        type="date"
                        value={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setEditingTask(prev => prev ? { ...prev, dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined } : null)}
                        className="mt-2 h-10 border-2 border-slate-200 dark:border-slate-600 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={editingTask.urgent}
                          onChange={(e) => setEditingTask(prev => prev ? { ...prev, urgent: e.target.checked } : null)}
                          className="sr-only peer"
                          aria-label="Mark as urgent"
                        />
                        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-500 rounded peer-checked:bg-red-500 peer-checked:border-red-500 transition-all"></div>
                        <CheckCircle2 className="absolute inset-0 h-5 w-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        Urgent
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={editingTask.important}
                          onChange={(e) => setEditingTask(prev => prev ? { ...prev, important: e.target.checked } : null)}
                          className="sr-only peer"
                          aria-label="Mark as important"
                        />
                        <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-500 rounded peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all"></div>
                        <CheckCircle2 className="absolute inset-0 h-5 w-5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        Important
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-6">
                  <Button
                    onClick={updateTask}
                    disabled={!editingTask.title.trim() || isEditingTask}
                    className="flex-1 h-12 text-base bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEditingTask ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Update Task
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingTask(null)}
                    className="border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!taskToDelete}
          onClose={() => setTaskToDelete(null)}
          onConfirm={confirmDeleteTask}
          title="Delete Task"
          description="Are you sure you want to delete this task? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    </div>
  )
}



