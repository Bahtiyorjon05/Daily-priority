'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Clock,
  Target,
  Zap,
  Brain,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Award,
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  Filter,
  Search,
  X,
  Edit3,
  Trash2,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  Square,
  Timer,
  Flag,
  Tag,
  User,
  Settings,
  Bell,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { generateTaskSuggestions } from '@/lib/ai'
import { toast } from 'sonner'

interface TimeBlock {
  id: string
  taskId?: string
  title: string
  description?: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  duration: number // in minutes
  category: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  color: string
  startDate?: string
  endDate?: string
  aiSuggested?: boolean
  aiReason?: string
  tags?: string[]
  estimatedProductivity?: number // 1-10 scale
}

interface TimeStats {
  totalPlanned: number
  totalTime: number
  completedTime: number
  productivityScore: number
  focusStreak: number
  longestFocusSession: number
}

const toHHMM = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

const mapTaskPriority = (priority: string | null | undefined, urgent: boolean): 'LOW' | 'MEDIUM' | 'HIGH' => {
  if (urgent) return 'HIGH'
  const normalized = (priority || '').toUpperCase()
  switch (normalized) {
    case 'LOW':
      return 'LOW'
    case 'MEDIUM':
      return 'MEDIUM'
    case 'URGENT':
    case 'HIGH':
      return 'HIGH'
    default:
      return 'MEDIUM'
  }
}

const priorityColorMap: Record<'LOW' | 'MEDIUM' | 'HIGH', string> = {
  LOW: '#10B981',
  MEDIUM: '#3B82F6',
  HIGH: '#F97316',
}

const mapTaskStatus = (status: string | null | undefined): TimeBlock['status'] => {
  const normalized = (status || 'PLANNED').toUpperCase()
  switch (normalized) {
    case 'TODO':
    case 'PLANNED':
      return 'PLANNED'
    case 'COMPLETED':
      return 'COMPLETED'
    case 'IN_PROGRESS':
      return 'IN_PROGRESS'
    case 'CANCELLED':
    case 'ARCHIVED':
      return 'CANCELLED'
    default:
      return 'PLANNED'
  }
}

const mapBlockStatusToTaskStatus = (
  status: TimeBlock['status']
): 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' => {
  switch (status) {
    case 'IN_PROGRESS':
      return 'IN_PROGRESS'
    case 'COMPLETED':
      return 'COMPLETED'
    case 'CANCELLED':
      return 'CANCELLED'
    default:
      return 'TODO'
  }
}

const energyToProductivity = (energyLevel?: string | null): number | undefined => {
  if (!energyLevel) return undefined
  switch (energyLevel.toUpperCase()) {
    case 'HIGH':
      return 9
    case 'MEDIUM':
      return 6
    case 'LOW':
      return 4
    default:
      return undefined
  }
}

const isFocusCategory = (category: string) => {
  const normalized = category.toLowerCase()
  return normalized.includes('work') || normalized.includes('focus') || normalized.includes('deep')
}

const deriveTaskStartDate = (task: any) => {
  if (task?.dueDate) return new Date(task.dueDate)
  if (task?.completedAt) return new Date(task.completedAt)
  if (task?.createdAt) return new Date(task.createdAt)
  return new Date()
}

export default function AITimeManager({ session }: { session: any }) {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [stats, setStats] = useState<TimeStats>({
    totalPlanned: 0,
    totalTime: 0,
    completedTime: 0,
    productivityScore: 0,
    focusStreak: 0,
    longestFocusSession: 0
  })
  const [loading, setLoading] = useState(true)
  const [showNewBlock, setShowNewBlock] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<TimeBlock[]>([])
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [savingSuggestions, setSavingSuggestions] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'today' | 'completed' | 'planned'>('today')
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTimer, setActiveTimer] = useState<string | null>(null)
  const [timerSeconds, setTimerSeconds] = useState(0)

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return
    loadTimeBlocks()
  }, [session?.user?.id])

  const mapTaskToTimeBlock = (task: any): TimeBlock => {
    const startDate = deriveTaskStartDate(task)
    const duration =
      typeof task?.estimatedTime === 'number' && !Number.isNaN(task.estimatedTime)
        ? task.estimatedTime
        : 30
    const endDate = new Date(startDate.getTime() + duration * 60000)
    const priority = mapTaskPriority(task?.priority, Boolean(task?.urgent))
    const status = mapTaskStatus(task?.status)
    const color = task?.category?.color || priorityColorMap[priority]
    const tags = Array.isArray(task?.tags)
      ? task.tags
          .map((tag: any) => (typeof tag === 'string' ? tag : tag?.name))
          .filter(Boolean)
      : undefined

    return {
      id: task.id,
      taskId: task.id,
      title: task.title,
      description: task.description || undefined,
      startTime: toHHMM(startDate),
      endTime: toHHMM(endDate),
      duration,
      category: task?.category?.name || 'General',
      priority,
      status,
      color,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      aiSuggested: task?.aiSuggested ?? false,
      aiReason: task?.aiReason || undefined,
      tags,
      estimatedProductivity: energyToProductivity(task?.energyLevel),
    }
  }

  const loadTimeBlocks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks?limit=100')
      if (!response.ok) {
        throw new Error('Failed to fetch time blocks')
      }
      const payload = await response.json()
      const taskList = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.tasks)
          ? payload.tasks
          : []

      const blocks = taskList
        .filter((task: any) => task && typeof task === 'object')
        .map((task: any) => mapTaskToTimeBlock(task))

      setTimeBlocks(blocks)
    } catch (error) {
      console.error('Error loading time blocks:', error)
      toast.error('Failed to load your schedule. Please try refreshing.')
      setTimeBlocks([])
    } finally {
      setLoading(false)
    }
  }

  // Filtered time blocks
  const filteredBlocks = timeBlocks.filter(block => {
    if (!block || typeof block !== 'object') return false
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        block.title?.toLowerCase().includes(searchLower) ||
        block.description?.toLowerCase().includes(searchLower) ||
        block.category?.toLowerCase().includes(searchLower) ||
        block.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      if (!matchesSearch) return false
    }
    
    // Status filter
    if (filter === 'completed') return block.status === 'COMPLETED'
    if (filter === 'planned') return block.status === 'PLANNED'
    if (filter === 'today') {
      if (!block.startDate) return false
      const blockDate = new Date(block.startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return isSameDayDate(blockDate, today)
    }
    
    return true
  })

  // Toggle block status
  const toggleBlockStatus = async (blockId: string) => {
    const targetBlock = timeBlocks.find(block => block.id === blockId)
    if (!targetBlock) return

    const previousStatus = targetBlock.status
    let newStatus: TimeBlock['status'] = 'PLANNED'

    if (targetBlock.status === 'PLANNED') {
      newStatus = 'IN_PROGRESS'
      if (isFocusCategory(targetBlock.category)) {
        setActiveTimer(blockId)
        setTimerSeconds(0)
      }
    } else if (targetBlock.status === 'IN_PROGRESS') {
      newStatus = 'COMPLETED'
      if (activeTimer === blockId) {
        setActiveTimer(null)
      }
    } else if (targetBlock.status === 'COMPLETED') {
      newStatus = 'PLANNED'
    } else {
      newStatus = 'PLANNED'
    }

    setTimeBlocks(prev =>
      prev.map(block => (block.id === blockId ? { ...block, status: newStatus } : block))
    )

    if (newStatus !== 'IN_PROGRESS' && activeTimer === blockId) {
      setActiveTimer(null)
    }

    if (targetBlock.taskId) {
      try {
        const response = await fetch('/api/tasks/' + targetBlock.taskId, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: mapBlockStatusToTaskStatus(newStatus) }),
        })
        if (!response.ok) {
          throw new Error('Failed to persist status update')
        }
      } catch (error) {
        console.error('Error updating task status:', error)
        toast.error('Failed to update task status. Please try again.')
        // revert on failure
        setTimeBlocks(prev =>
          prev.map(block => (block.id === blockId ? { ...block, status: previousStatus } : block))
        )
      }
    }
  }

  const isSameDayDate = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  useEffect(() => {
    recalculateStats(timeBlocks)
  }, [timeBlocks])

  const recalculateStats = (blocks: TimeBlock[]) => {
    if (!blocks || blocks.length === 0) {
      setStats({
        totalPlanned: 0,
        totalTime: 0,
        completedTime: 0,
        productivityScore: 0,
        focusStreak: 0,
        longestFocusSession: 0,
      })
      return
    }

    const totalPlanned = blocks.length
    const totalTime = blocks.reduce((sum, block) => sum + (block.duration || 0), 0)
    const completedBlocks = blocks.filter(block => block.status === 'COMPLETED')
    const completedTime = completedBlocks.reduce((sum, block) => sum + (block.duration || 0), 0)
    const productivityScore = totalTime > 0 ? Math.round((completedTime / totalTime) * 100) : 0
    const focusStreak = calculateFocusStreak(completedBlocks)
    const longestFocusSession = blocks
      .filter(block => isFocusCategory(block.category))
      .reduce((max, block) => Math.max(max, block.duration || 0), 0)

    setStats({
      totalPlanned,
      totalTime,
      completedTime,
      productivityScore,
      focusStreak,
      longestFocusSession,
    })
  }

  const calculateFocusStreak = (completedBlocks: TimeBlock[]) => {
    if (!completedBlocks.length) return 0
    const completionDates = new Set(
      completedBlocks
        .map(block => block.endDate || block.startDate)
        .filter(Boolean)
        .map(date => new Date(date as string).toDateString())
    )

    if (completionDates.size === 0) return 0

    let streak = 0
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)

    while (completionDates.has(cursor.toDateString())) {
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    return streak
  }

  // Delete block
  const deleteBlock = async (blockId: string) => {
    const targetBlock = timeBlocks.find(block => block.id === blockId)
    setTimeBlocks(prev => prev.filter(block => block.id !== blockId))

    if (targetBlock?.taskId) {
      try {
        const response = await fetch('/api/tasks/' + targetBlock.taskId, {
          method: 'DELETE',
        })
        if (!response.ok) {
          throw new Error('Failed to delete task')
        }
      } catch (error) {
        console.error('Error deleting task:', error)
        toast.error('Failed to delete task. Syncing schedule...')
        // Reload from server to stay in sync
        loadTimeBlocks()
      }
    }
  }

  // AI-powered time block suggestions
  const getAITimeSuggestions = async () => {
    try {
      setAiLoading(true)
      
      // Get user context for AI suggestions
      const userContext = {
        completedTasks: timeBlocks.filter(b => b.status === 'COMPLETED').map(b => b.title),
        currentTime: new Date().toLocaleTimeString(),
        userGoals: 'Improve productivity and work-life balance',
        energyLevel: 'MEDIUM',
        userId: session?.user?.id
      }
      
      const suggestions = await generateTaskSuggestions(userContext)
      
      // Transform AI suggestions into time block format
      const formattedSuggestions = suggestions.tasks.slice(0, 3).map((suggestion: any, index: number) => {
        const baseStart = new Date()
        baseStart.setHours(9 + index, 0, 0, 0)
        const duration = suggestion.estimatedTime || 60
        const baseEnd = new Date(baseStart.getTime() + duration * 60000)

        const priority =
          (suggestion.priority as 'LOW' | 'MEDIUM' | 'HIGH') || 'MEDIUM'

        return {
          id: 'ai-block-' + Date.now() + '-' + index,
          title: suggestion.title,
          description: suggestion.description,
          startTime: toHHMM(baseStart),
          endTime: toHHMM(baseEnd),
          duration,
          category: suggestion.category || 'Work',
          priority,
          status: 'PLANNED' as TimeBlock['status'],
          color: priorityColorMap[priority] || '#8B5CF6',
          startDate: baseStart.toISOString(),
          endDate: baseEnd.toISOString(),
          aiSuggested: true,
          aiReason: suggestion.reason,
          tags: suggestion.tags || ['ai', 'suggestion'],
          estimatedProductivity: suggestion.productivityScore || 8,
        } satisfies TimeBlock
      })
      
      setAiSuggestions(formattedSuggestions)
      setShowAiSuggestions(true)
    } catch (error) {
      console.error('Error getting AI time suggestions:', error)
      toast.error('Unable to fetch AI suggestions right now.')
    } finally {
      setAiLoading(false)
    }
  }

  const persistSuggestionAsTask = async (suggestion: TimeBlock) => {
    const start = suggestion.startDate ? new Date(suggestion.startDate) : new Date()
    if (suggestion.startTime) {
      const [hourStr, minuteStr] = suggestion.startTime.split(':')
      const hour = parseInt(hourStr, 10)
      const minute = parseInt(minuteStr, 10)
      if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
        start.setHours(hour, minute, 0, 0)
      }
    }

    const energyLevel =
      suggestion.estimatedProductivity && suggestion.estimatedProductivity >= 8
        ? 'HIGH'
        : suggestion.estimatedProductivity && suggestion.estimatedProductivity <= 4
          ? 'LOW'
          : 'MEDIUM'

    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: suggestion.title,
        description: suggestion.description,
        dueDate: start.toISOString(),
        estimatedTime: suggestion.duration,
        urgent: suggestion.priority === 'HIGH',
        important: suggestion.priority !== 'LOW',
        status: 'TODO',
        aiSuggested: true,
        aiReason: suggestion.aiReason,
        energyLevel,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create task from suggestion')
    }

    const createdTask = await response.json()
    return mapTaskToTimeBlock(createdTask)
  }

  // Accept AI suggestion as new time block
  const acceptAITimeBlock = async (suggestion: TimeBlock) => {
    try {
      setSavingSuggestions(true)
      const persisted = await persistSuggestionAsTask(suggestion)
      setTimeBlocks(prev => [...prev, persisted])
      setAiSuggestions(prev => {
        const remaining = prev.filter(s => s.id !== suggestion.id)
        if (remaining.length === 0) {
          setShowAiSuggestions(false)
        }
        return remaining
      })
      toast.success('Suggestion added to your tasks.')
    } catch (error) {
      console.error('Error saving AI suggestion:', error)
      toast.error('Failed to add AI suggestion. Please try again.')
    } finally {
      setSavingSuggestions(false)
    }
  }

  // Accept all AI suggestions
  const acceptAllAITimeBlocks = async () => {
    if (!aiSuggestions.length) return
    try {
      setSavingSuggestions(true)
      const createdBlocks: TimeBlock[] = []
      for (const suggestion of aiSuggestions) {
        const persisted = await persistSuggestionAsTask(suggestion)
        createdBlocks.push(persisted)
      }
      setTimeBlocks(prev => [...prev, ...createdBlocks])
      setAiSuggestions([])
      setShowAiSuggestions(false)
      toast.success('All AI suggestions added to your tasks.')
    } catch (error) {
      console.error('Error saving AI suggestions:', error)
      toast.error('Failed to save all AI suggestions. Some tasks may be missing.')
    } finally {
      setSavingSuggestions(false)
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return (formattedHour) + ':' + (minutes) + ' ' + (ampm)
  }

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return (minutes) + 'm'
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? (hours) + 'h ' + (remainingMinutes) + 'm' : (hours) + 'h'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading time manager...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-foreground bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Clock className="h-6 w-6 text-white" />
              </div>
              AI Time Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Optimize your schedule with AI-powered time management
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={getAITimeSuggestions}
              disabled={aiLoading || savingSuggestions}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {aiLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              AI Suggestions
            </Button>
            <Button 
              onClick={() => setShowNewBlock(true)} 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Time Block
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Blocks</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalPlanned}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Total Time</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {formatDuration(stats.totalTime)}
                  </p>
                </div>
                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                    {formatDuration(stats.completedTime)}
                  </p>
                </div>
                <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50 dark:border-purple-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Productivity</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {stats.productivityScore}%
                  </p>
                </div>
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200/50 dark:border-cyan-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-600 dark:text-cyan-400 text-sm font-medium">Focus Streak</p>
                  <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1">
                    <Flame className="h-5 w-5 text-cyan-500" />
                    {stats.focusStreak}
                  </p>
                </div>
                <div className="h-10 w-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border-rose-200/50 dark:border-rose-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-600 dark:text-rose-400 text-sm font-medium">Longest Session</p>
                  <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                    {formatDuration(stats.longestFocusSession)}
                  </p>
                </div>
                <div className="h-10 w-10 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Time and Active Timer */}
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Today is {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                <p className="text-emerald-100 text-lg mt-1">
                  Current time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {activeTimer && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-white/30 flex items-center justify-center">
                        <Play className="h-5 w-5 text-white" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-4 border-emerald-300 animate-ping opacity-75"></div>
                    </div>
                    <div>
                      <p className="font-medium">Active Session</p>
                      <p className="text-2xl font-bold">
                        {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search time blocks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-400"
                />
              </div>
              
              {/* Status Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', icon: Target },
                  { key: 'today', label: 'Today', icon: Calendar },
                  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
                  { key: 'planned', label: 'Planned', icon: Clock }
                ].map((filterOption) => {
                  const Icon = filterOption.icon
                  return (
                    <Button
                      key={filterOption.key}
                      variant={filter === filterOption.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(filterOption.key as any)}
                      className={filter === filterOption.key 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {filterOption.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Blocks List */}
        <div className="space-y-4">
          {filteredBlocks.length > 0 ? (
            filteredBlocks.map((block) => (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {block.title}
                        </h3>
                        {block.aiSuggested && (
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-purple-500" />
                            <span className="text-xs text-purple-600 dark:text-purple-400">AI</span>
                          </div>
                        )}
                      </div>
                      
                      {block.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {block.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {formatTime(block.startTime)} - {formatTime(block.endTime)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Timer className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {formatDuration(block.duration)}
                          </span>
                        </div>
                        
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: (block.color) + '20',
                            color: block.color
                          }}
                        >
                          {block.category}
                        </span>
                        
                        <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (getStatusColor(block.status))}>
                          {block.status.replace('_', ' ')}
                        </span>
                        
                        <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (block.priority === 'HIGH' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                            : block.priority === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200')}>
                          {block.priority} Priority
                        </span>
                      </div>
                      
                      {block.tags && block.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {block.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {block.aiSuggested && block.aiReason && (
                        <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/50">
                          <div className="flex items-center gap-1 mb-1">
                            <Lightbulb className="h-3 w-3 text-purple-500" />
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                              AI Recommendation
                            </span>
                          </div>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            {block.aiReason}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-blue-500"
                          onClick={() => setEditingBlock(block)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-500"
                          onClick={() => deleteBlock(block.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleBlockStatus(block.id)}
                        className={(block.status === 'COMPLETED' 
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500' 
                            : block.status === 'IN_PROGRESS'
                            ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-500')}
                      >
                        {block.status === 'COMPLETED' ? (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        ) : block.status === 'IN_PROGRESS' ? (
                          <Square className="h-4 w-4 mr-1" />
                        ) : (
                          <Play className="h-4 w-4 mr-1" />
                        )}
                        {block.status === 'COMPLETED' ? 'Completed' : 
                         block.status === 'IN_PROGRESS' ? 'Stop' : 'Start'}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto max-w-md">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No time blocks found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm || filter !== 'today' 
                    ? 'Try adjusting your search or filters' 
                    : 'Create your first time block to get started!'}
                </p>
                <Button 
                  onClick={() => setShowNewBlock(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Time Block
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* AI Suggestions Modal */}
      <AnimatePresence>
        {showAiSuggestions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Time Block Suggestions</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Personalized recommendations for your schedule
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAiSuggestions(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {aiSuggestions.length > 0 ? (
                  <div className="space-y-4">
                    {aiSuggestions.map((suggestion) => (
                      <div 
                        key={suggestion.id} 
                        className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">{suggestion.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{suggestion.description}</p>
                            <div className="flex items-center gap-1 mt-2">
                              <Lightbulb className="h-3 w-3 text-amber-500" />
                              <span className="text-xs text-amber-600 dark:text-amber-400">
                                {suggestion.aiReason}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => acceptAITimeBlock(suggestion)}
                            disabled={savingSuggestions}
                          >
                            {savingSuggestions ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                            ) : (
                              'Add'
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No AI Suggestions
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Try again later for personalized recommendations
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAiSuggestions(false)}
                >
                  Close
                </Button>
                {aiSuggestions.length > 0 && (
                  <Button
                    onClick={acceptAllAITimeBlocks}
                    disabled={savingSuggestions}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {savingSuggestions ? 'Saving...' : 'Add All Suggestions'}
                  </Button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
