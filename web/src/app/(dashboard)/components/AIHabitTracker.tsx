'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Award,
  Flame,
  Clock,
  Zap,
  Activity,
  Brain,
  Filter,
  Search,
  X,
  Edit3,
  Trash2,
  BarChart3,
  RefreshCw,
  Bell,
  BellOff,
  Sticker
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { generateTaskSuggestions } from '@/lib/ai'
import { toast } from 'sonner'

interface Habit {
  id: string
  title: string
  description?: string
  category: string
  frequency: 'daily' | 'weekly' | 'custom'
  target: number
  current: number
  streak: number
  longestStreak: number
  lastCompleted?: string
  createdAt: string
  color: string
  aiSuggested?: boolean
  aiReason?: string
  tags?: string[]
  reminderEnabled?: boolean
  reminderTime?: string
  targetDays?: number
  completions: {
    id: string
    date: string
    note?: string
  }[]
}

interface HabitStats {
  totalHabits: number
  completedToday: number
  currentStreak: number
  longestStreak: number
  completionRate: number
}

type HabitFrequencyUI = 'daily' | 'weekly' | 'custom'

const toUiFrequency = (value: string | null | undefined): HabitFrequencyUI => {
  const normalized = (value || 'DAILY').toString().toUpperCase()
  switch (normalized) {
    case 'WEEKLY':
      return 'weekly'
    case 'CUSTOM':
      return 'custom'
    default:
      return 'daily'
  }
}

const toApiFrequency = (value: string | null | undefined): 'DAILY' | 'WEEKLY' | 'CUSTOM' => {
  const normalized = (value || 'daily').toString().toLowerCase()
  switch (normalized) {
    case 'weekly':
      return 'WEEKLY'
    case 'custom':
      return 'CUSTOM'
    default:
      return 'DAILY'
  }
}

export default function AIHabitTracker({ session }: { session: any }) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [stats, setStats] = useState<HabitStats>({
    totalHabits: 0,
    completedToday: 0,
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [showNewHabit, setShowNewHabit] = useState(false)
  const [newHabit, setNewHabit] = useState<{
    title: string
    description: string
    frequency: HabitFrequencyUI
    target: number
  }>({
    title: '',
    description: '',
    frequency: 'daily',
    target: 1,
  })
  const [creatingHabit, setCreatingHabit] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<Habit[]>([])
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [savingSuggestions, setSavingSuggestions] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | HabitFrequencyUI>('all')
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [error, setError] = useState<string | null>(null)

  const frequencyFilters: Array<{ key: HabitFrequencyUI | 'all'; label: string; icon: any }> = [
    { key: 'all', label: 'All', icon: Target },
    { key: 'daily', label: 'Daily', icon: Calendar },
    { key: 'weekly', label: 'Weekly', icon: Clock },
    { key: 'custom', label: 'Custom', icon: Sticker }
  ]

  // Fetch habits from API
  useEffect(() => {
    fetchHabits()
  }, [])

  const transformHabit = (habit: any): Habit => {
    const completions = Array.isArray(habit?.completions) ? habit.completions : []
    const frequency = toUiFrequency(habit?.frequency)
    const target =
      typeof habit?.target === 'number'
        ? habit.target
        : typeof habit?.targetDays === 'number'
          ? habit.targetDays
          : frequency === 'weekly'
            ? 7
            : 1
    const tags = Array.isArray(habit?.tags)
      ? habit.tags
          .map((tag: any) => (typeof tag === 'string' ? tag : tag?.name))
          .filter(Boolean)
      : []

    return {
      id: habit.id,
      title: habit.title,
      description: habit.description ?? undefined,
      category: habit.category || 'General',
      frequency,
      target,
      current: completions.length,
      streak: habit.streak ?? 0,
      longestStreak: habit.longestStreak ?? 0,
      lastCompleted: completions[0]?.date,
      createdAt: habit.createdAt,
      color: habit.color || '#0ea5e9',
      aiSuggested: habit.aiSuggested ?? false,
      aiReason: habit.aiReason,
      tags,
      reminderEnabled: habit.reminderEnabled ?? false,
      reminderTime: habit.reminderTime,
      targetDays: habit.targetDays,
      completions,
    }
  }

  const fetchHabits = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/habits')
      
      if (!response.ok) {
        throw new Error('Failed to fetch habits')
      }
      
      const data = await response.json()
      
      const payload = Array.isArray(data) ? data : []
      const transformedHabits = payload.map(transformHabit)
      
      setHabits(transformedHabits)
      updateStats(transformedHabits)
    } catch (error: any) {
      console.error('Error fetching habits:', error)
      setError(error.message || 'Failed to load habits')
      toast.error('Failed to load habits')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHabit = async () => {
    if (!newHabit.title.trim()) {
      toast.error('Please enter a habit title')
      return
    }

    const targetValue = Number(newHabit.target)
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      toast.error('Target must be at least 1')
      return
    }

    try {
      setCreatingHabit(true)
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newHabit.title.trim(),
          description: newHabit.description.trim() || undefined,
          frequency: toApiFrequency(newHabit.frequency),
          targetDays: Math.max(1, Math.round(targetValue))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create habit')
      }

      const createdHabit = await response.json()
      const transformed = transformHabit(createdHabit)

      setHabits(prev => {
        const updated = [transformed, ...prev]
        updateStats(updated)
        return updated
      })

      setNewHabit({
        title: '',
        description: '',
        frequency: 'daily',
        target: 1
      })
      setShowNewHabit(false)
      toast.success('Habit created!')
    } catch (error: any) {
      console.error('Error creating habit:', error)
      toast.error(error.message || 'Failed to create habit')
    } finally {
      setCreatingHabit(false)
    }
  }

  // Filtered habits
  const filteredHabits = habits.filter(habit => {
    if (!habit || typeof habit !== 'object') return false
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        habit.title?.toLowerCase().includes(searchLower) ||
        habit.description?.toLowerCase().includes(searchLower) ||
        habit.category?.toLowerCase().includes(searchLower) ||
        habit.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      if (!matchesSearch) return false
    }
    
    // Frequency filter
    if (filter !== 'all') {
      return habit.frequency === filter
    }
    
    return true
  })

  // Toggle habit completion
  const toggleHabit = async (habitId: string) => {
    try {
      const response = await fetch(`/api/habits/${habitId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update habit')
      }
      
      const result = await response.json()
      
      // Refresh habits to get updated data
      fetchHabits()
      
      toast.success(result.completed ? 'Habit completed!' : 'Habit completion removed')
    } catch (error: any) {
      console.error('Error toggling habit:', error)
      toast.error('Failed to update habit')
    }
  }

  // Update stats
  const updateStats = (habitsData: Habit[] = habits) => {
    const today = new Date().toISOString().split('T')[0]
    const completedToday = habitsData.filter(habit => 
      habit.lastCompleted?.split('T')[0] === today
    ).length
    
    const currentStreak = Math.max(...habitsData.map(h => h.streak), 0)
    const longestStreak = Math.max(...habitsData.map(h => h.longestStreak), 0)
    const totalCompletions = habitsData.reduce((sum, habit) => sum + habit.current, 0)
    const totalTargets = habitsData.reduce((sum, habit) => sum + habit.target, 0)
    const completionRate = totalTargets > 0 ? Math.round((totalCompletions / totalTargets) * 100) : 0
    
    setStats({
      totalHabits: habitsData.length,
      completedToday,
      currentStreak,
      longestStreak,
      completionRate
    })
  }

  // Delete habit
  const deleteHabit = async (habitId: string) => {
    try {
      const response = await fetch(`/api/habits/${habitId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete habit')
      }
      
      // Remove habit from state
      setHabits(prev => {
        const updated = prev.filter(habit => habit.id !== habitId)
        updateStats(updated)
        return updated
      })
      toast.success('Habit deleted')
    } catch (error: any) {
      console.error('Error deleting habit:', error)
      toast.error('Failed to delete habit')
    }
  }

  // AI-powered habit suggestions
  const getAIHabitSuggestions = async () => {
    try {
      setAiLoading(true)
      
      // Get user context for AI suggestions
      const userContext = {
        completedTasks: habits.filter(h => h.lastCompleted).map(h => h.title),
        currentTime: new Date().toLocaleTimeString(),
        userGoals: 'Improve spiritual growth and wellness',
        energyLevel: 'MEDIUM',
        userId: session?.user?.id
      }
      
      const suggestions = await generateTaskSuggestions(userContext)
      
      // Transform AI suggestions into habit format
      const formattedSuggestions = suggestions.tasks.slice(0, 3).map((suggestion: any, index: number) => {
        const frequency = suggestion.frequency ? toUiFrequency(suggestion.frequency) : 'daily'
        return {
          id: 'ai-habit-' + Date.now() + '-' + index,
          title: suggestion.title,
          description: suggestion.description,
          category: suggestion.category || 'Personal Development',
          frequency: frequency as HabitFrequencyUI,
          target: typeof suggestion.target === 'number' ? suggestion.target : 1,
          current: 0,
          streak: 0,
          longestStreak: 0,
          createdAt: new Date().toISOString(),
          color: '#8B5CF6',
          aiSuggested: true,
          aiReason: suggestion.reason,
          tags: suggestion.tags || ['ai', 'suggestion'],
          reminderEnabled: false,
          completions: []
        }
      })
      
      setAiSuggestions(formattedSuggestions)
      setShowAiSuggestions(true)
    } catch (error) {
      console.error('Error getting AI habit suggestions:', error)
      toast.error('Failed to get AI suggestions')
    } finally {
      setAiLoading(false)
    }
  }

  const createHabitFromSuggestion = async (suggestion: Habit): Promise<Habit> => {
    const response = await fetch('/api/habits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: suggestion.title,
        description: suggestion.description,
        frequency: toApiFrequency(suggestion.frequency),
        targetDays: suggestion.target ?? 1
      })
    })

    if (!response.ok) {
      throw new Error('Failed to create habit')
    }

    const createdHabit = await response.json()
    return transformHabit(createdHabit)
  }

  // Accept AI suggestion as new habit
  const acceptAIHabit = async (suggestion: Habit) => {
    try {
      setSavingSuggestions(true)
      const newHabit = await createHabitFromSuggestion(suggestion)

      setHabits(prev => {
        const updated = [...prev, newHabit]
        updateStats(updated)
        return updated
      })

      setAiSuggestions(prev => {
        const remaining = prev.filter(s => s.id !== suggestion.id)
        if (remaining.length === 0) {
          setShowAiSuggestions(false)
        }
        return remaining
      })

      toast.success('Habit created!')
    } catch (error: any) {
      console.error('Error accepting AI habit:', error)
      toast.error('Failed to create habit')
    } finally {
      setSavingSuggestions(false)
    }
  }

  // Accept all AI suggestions
  const acceptAllAIHabits = async () => {
    try {
      if (!aiSuggestions.length) return

      setSavingSuggestions(true)

      const createdHabits: Habit[] = []
      for (const suggestion of aiSuggestions) {
        const habit = await createHabitFromSuggestion(suggestion)
        createdHabits.push(habit)
      }

      setHabits(prev => {
        const updated = [...prev, ...createdHabits]
        updateStats(updated)
        return updated
      })

      setAiSuggestions([])
      setShowAiSuggestions(false)
      toast.success('All habits created!')
    } catch (error: any) {
      console.error('Error accepting all AI habits:', error)
      toast.error('Failed to create some habits')
    } finally {
      setSavingSuggestions(false)
    }
  }

  // Toggle habit reminder
  const toggleHabitReminder = async (habitId: string) => {
    try {
      const habit = habits.find(h => h.id === habitId)
      if (!habit) return
      
      // Update habit with reminder toggle
      const updatedHabits = habits.map(h => 
        h.id === habitId 
          ? { ...h, reminderEnabled: !h.reminderEnabled } 
          : h
      )
      
      setHabits(updatedHabits)
      
      // In a real implementation, you would update the backend here
      toast.success(`Reminder ${habit.reminderEnabled ? 'disabled' : 'enabled'}`)
    } catch (error: any) {
      console.error('Error toggling reminder:', error)
      toast.error('Failed to update reminder')
    }
  }

  // Get frequency label
  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily'
      case 'weekly': return 'Weekly'
      case 'custom': return 'Custom'
      default: return 'Daily'
    }
  }

  // Get progress percentage
  const getProgressPercentage = (habit: Habit) => {
    return habit.target > 0 ? Math.round((habit.current / habit.target) * 100) : 0
  }

  // Render streak visualization
  const renderStreakVisualization = (habit: Habit) => {
    // Show last 7 days of completions
    const days = 7
    const today = new Date()
    const completionDates = habit.completions.map(c => 
      new Date(c.date).toISOString().split('T')[0]
    )
    
    return (
      <div className="flex items-center gap-1 mt-2">
        {Array.from({ length: days }).map((_, index) => {
          const date = new Date(today)
          date.setDate(today.getDate() - (days - 1 - index))
          const dateStr = date.toISOString().split('T')[0]
          const completed = completionDates.includes(dateStr)
          
          return (
            <div 
              key={index}
              className={`w-3 h-3 rounded-full border ${
                completed 
                  ? 'bg-emerald-500 border-emerald-500' 
                  : 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
              }`}
              title={dateStr}
            />
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading habit tracker...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <X className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300 font-medium flex-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHabits}
                className="text-red-600 border-red-200 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950/30"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Target className="h-6 w-6 text-white" />
              </div>
              AI Habit Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Build positive habits with AI-powered guidance
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={getAIHabitSuggestions}
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
              onClick={() => setShowNewHabit(true)} 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Habit
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <AnimatePresence>
          {showNewHabit && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="bg-white dark:bg-gray-800 border border-emerald-200/50 dark:border-emerald-800/50 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-emerald-700 dark:text-emerald-300">
                    Create New Habit
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="habit-title">Habit title</Label>
                      <Input
                        id="habit-title"
                        placeholder="e.g., Morning Quran Reading"
                        value={newHabit.title}
                        onChange={(e) => setNewHabit(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="habit-target">Target per cycle</Label>
                      <Input
                        id="habit-target"
                        type="number"
                        min={1}
                        value={newHabit.target}
                        onChange={(e) => setNewHabit(prev => ({ ...prev, target: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="habit-description">Description (optional)</Label>
                      <Textarea
                        id="habit-description"
                        placeholder="Add any notes or intention for this habit"
                        value={newHabit.description}
                        onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Frequency</Label>
                      <div className="flex flex-wrap gap-2">
                        {(['daily', 'weekly', 'custom'] as HabitFrequencyUI[]).map(option => (
                          <Button
                            key={option}
                            type="button"
                            variant={newHabit.frequency === option ? 'default' : 'outline'}
                            className={newHabit.frequency === option
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                            onClick={() => setNewHabit(prev => ({ ...prev, frequency: option }))}
                          >
                            {option === 'daily' ? 'Daily' : option === 'weekly' ? 'Weekly' : 'Custom'}
                          </Button>
                        ))}
                      </div>
                      {newHabit.frequency === 'custom' && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Create the habit now, then track completions according to your own schedule.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewHabit(false)
                        setNewHabit({
                          title: '',
                          description: '',
                          frequency: 'daily',
                          target: 1
                        })
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateHabit}
                      disabled={creatingHabit}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {creatingHabit ? 'Saving…' : 'Create Habit'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Total Habits</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalHabits}</p>
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
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Completed Today</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.completedToday}</p>
                </div>
                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">Current Streak</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Flame className="h-5 w-5 text-amber-500" />
                    {stats.currentStreak}
                  </p>
                </div>
                <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50 dark:border-purple-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Longest Streak</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.longestStreak}</p>
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
                  <p className="text-cyan-600 dark:text-cyan-400 text-sm font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{stats.completionRate}%</p>
                </div>
                <div className="h-10 w-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search habits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-400"
                />
              </div>
              
              {/* Frequency Filters */}
              <div className="flex flex-wrap gap-2">
                {frequencyFilters.map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant={filter === key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(key)}
                    className={filter === key
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Habits List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHabits.length > 0 ? (
            filteredHabits.map((habit) => (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {habit.title}
                        </h3>
                        {habit.aiSuggested && (
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-purple-500" />
                            <span className="text-xs text-purple-600 dark:text-purple-400">AI</span>
                          </div>
                        )}
                      </div>
                      
                      {habit.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {habit.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <span 
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: (habit.color) + '20',
                            color: habit.color
                          }}
                        >
                          {habit.category}
                        </span>
                        
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {getFrequencyLabel(habit.frequency)}
                        </span>
                        
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                          <Flame className="h-3 w-3" />
                          {habit.streak}
                        </div>
                      </div>
                      
                      {habit.tags && habit.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {habit.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleHabit(habit.id)}
                      className={'h-8 w-8 ' + (habit.lastCompleted?.split('T')[0] === new Date().toISOString().split('T')[0]
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                          : 'border border-gray-300 dark:border-gray-600 hover:border-emerald-500')}
                    >
                      {habit.lastCompleted?.split('T')[0] === new Date().toISOString().split('T')[0] ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Streak Visualization */}
                  {renderStreakVisualization(habit)}
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Progress: {habit.current}/{habit.target}
                      </span>
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        {getProgressPercentage(habit)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: habit.color }}
                        initial={{ width: 0 }}
                        animate={{ width: (getProgressPercentage(habit)) + '%' }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                  
                  {/* Habit Stats */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Longest streak: {habit.longestStreak}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-blue-500"
                        onClick={() => toggleHabitReminder(habit.id)}
                        aria-label={habit.reminderEnabled ? "Disable reminder" : "Enable reminder"}
                      >
                        {habit.reminderEnabled ? (
                          <Bell className="h-4 w-4 text-blue-500" />
                        ) : (
                          <BellOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-blue-500"
                        onClick={() => setEditingHabit(habit)}
                        aria-label="Edit habit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-red-500"
                        onClick={() => deleteHabit(habit.id)}
                        aria-label="Delete habit"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {habit.aiSuggested && habit.aiReason && (
                    <div className="mt-3 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/50">
                      <div className="flex items-center gap-1 mb-1">
                        <Lightbulb className="h-3 w-3 text-purple-500" />
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                          AI Recommendation
                        </span>
                      </div>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        {habit.aiReason}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto max-w-md">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No habits found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm || filter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Create your first habit to get started!'}
                </p>
                <Button 
                  onClick={() => setShowNewHabit(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Habit
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
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Habit Suggestions</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Personalized recommendations for building positive habits
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
                            onClick={() => acceptAIHabit(suggestion)}
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
                    onClick={acceptAllAIHabits}
                    disabled={savingSuggestions}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {savingSuggestions ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Saving...
                      </span>
                    ) : (
                      'Add All Suggestions'
                    )}
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



