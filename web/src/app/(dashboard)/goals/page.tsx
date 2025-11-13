'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  TrendingUp,
  CheckCircle2,
  Clock,
  Calendar,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { GoalsStats } from './components/GoalsStats'
import { GoalsFilters } from './components/GoalsFilters'

interface Goal {
  id: string
  title: string
  description?: string
  goalType: 'DUNYA' | 'AKHIRAH'
  category: string
  progress: number
  target: number
  deadline?: string
  status: string
  completed: boolean
  milestones?: any
  createdAt: string
  updatedAt: string
}

interface GoalsStats {
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

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [stats, setStats] = useState<GoalsStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'DUNYA' | 'AKHIRAH' | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'IBADAH' | 'KNOWLEDGE' | 'FAMILY' | 'WORK' | 'HEALTH' | 'COMMUNITY' | 'PERSONAL'>('ALL')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'OVERDUE'>('ALL')
  const [sortBy, setSortBy] = useState<'date' | 'progress' | 'deadline' | 'category'>('date')

  // Pagination states
  const [currentDunyaPage, setCurrentDunyaPage] = useState(1)
  const [currentAkhirahPage, setCurrentAkhirahPage] = useState(1)
  const ITEMS_PER_PAGE = 10
  
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    goalType: 'DUNYA' as 'DUNYA' | 'AKHIRAH',
    category: 'PERSONAL',
    progress: 0,
    target: 100,
    deadline: ''
  })

  useEffect(() => {
    fetchGoals()
    
    // Cleanup: clear all pending timers when component unmounts
    return () => {
      Object.values(progressUpdateTimers.current).forEach(timer => {
        clearTimeout(timer)
      })
    }
  }, [])

  async function fetchGoals() {
    try {
      setLoading(true)
      const response = await fetch('/api/goals')
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals || [])
        setStats(data.stats || null)
      } else {
        const error = await response.json()
        console.error('API error:', error)
        toast.error('Failed to load goals')
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  async function createGoal() {
    // Validate required fields
    if (!newGoal.title.trim()) {
      toast.error('Please enter a goal title')
      return
    }

    if (!newGoal.category) {
      toast.error('Please select a category')
      return
    }

    if (!newGoal.deadline) {
      toast.error('Please select a deadline')
      return
    }

    // Validate deadline is in the future
    const deadlineDate = new Date(newGoal.deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (deadlineDate < today) {
      toast.error('Deadline must be in the future')
      return
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      })

      if (response.ok) {
        const createdGoal = await response.json()
        setGoals(prev => [createdGoal, ...prev])
        setNewGoal({
          title: '',
          description: '',
          goalType: 'DUNYA',
          category: 'PERSONAL',
          progress: 0,
          target: 100,
          deadline: ''
        })
        setShowNewGoal(false)
        setSelectedType(null)
        toast.success('🎯 Goal created successfully!')
        // Refresh stats only
        const statsResponse = await fetch('/api/goals')
        if (statsResponse.ok) {
          const data = await statsResponse.json()
          setStats(data.stats || null)
        }
      } else {
        const error = await response.json()
        console.error('API error:', error)
        toast.error(error.error || 'Failed to create goal')
      }
    } catch (error) {
      console.error('Error creating goal:', error)
      toast.error('Failed to create goal')
    }
  }

  // Debounce timer for progress updates
  const progressUpdateTimers = useRef<{ [key: string]: NodeJS.Timeout }>({})

  async function updateGoalProgress(goalId: string, progress: number, immediate = false) {
    try {
      // Optimistically update the UI immediately
      setGoals(prev => prev.map(g => 
        g.id === goalId 
          ? { ...g, progress, completed: progress >= 100 }
          : g
      ))

      // Clear existing timer for this goal
      if (progressUpdateTimers.current[goalId]) {
        clearTimeout(progressUpdateTimers.current[goalId])
      }

      // Function to actually make the API call
      const makeApiCall = async () => {
        const response = await fetch(`/api/goals/${goalId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            progress,
            completed: progress >= 100
          })
        })

        if (response.ok) {
          const updatedGoal = await response.json()
          
          // Silent sync: Only update if server sent different data
          // This prevents re-renders when progress matches optimistic update
          setGoals(prev => {
            const currentGoal = prev.find(g => g.id === goalId)
            
            // Skip update if progress and completed status are already correct
            if (currentGoal && 
                currentGoal.progress === updatedGoal.progress && 
                currentGoal.completed === updatedGoal.completed) {
              return prev // No change = no re-render
            }
            
            // Only update if there are actual differences
            return prev.map(g => g.id === goalId ? updatedGoal : g)
          })
          
          if (progress >= 100) {
            // Switch to 'ALL' filter so user can see the completed goal
            if (filterStatus === 'ACTIVE') {
              setFilterStatus('ALL')
            }
            toast.success('🎉 Goal completed! May Allah reward your efforts!')
            // Refresh stats only on completion
            const statsResponse = await fetch('/api/goals')
            if (statsResponse.ok) {
              const data = await statsResponse.json()
              setStats(data.stats || null)
            }
          }
        } else {
          // Revert optimistic update on error
          await fetchGoals()
          toast.error('Failed to update progress')
        }
      }

      // If immediate (button click), call right away
      // If not immediate (typing), debounce it
      if (immediate) {
        await makeApiCall()
      } else {
        // Debounce: wait 800ms after user stops typing
        progressUpdateTimers.current[goalId] = setTimeout(async () => {
          await makeApiCall()
        }, 800)
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      // Revert optimistic update on error
      await fetchGoals()
      toast.error('Failed to update progress')
    }
  }

  async function confirmDeleteGoal() {
    if (!deletingGoal) return

    try {
      const response = await fetch(`/api/goals/${deletingGoal.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Remove from state immediately
        setGoals(prev => prev.filter(g => g.id !== deletingGoal.id))
        toast.success('Goal deleted successfully')
        setDeletingGoal(null)
        
        // Refresh stats after delete
        const statsResponse = await fetch('/api/goals')
        if (statsResponse.ok) {
          const data = await statsResponse.json()
          setStats(data.stats || null)
        }
      } else {
        toast.error('Failed to delete goal')
        setDeletingGoal(null)
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      toast.error('Failed to delete goal')
      setDeletingGoal(null)
    }
  }

  // Filter and sort goals with memoization to prevent unnecessary recalculations
  const filteredAndSortedGoals = useMemo(() => (goals || [])
    .filter(goal => {
      // Safety check
      if (!goal || !goal.goalType) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!goal.title?.toLowerCase().includes(query) && 
            !goal.description?.toLowerCase().includes(query)) {
          return false
        }
      }

      // Category filter (more useful than type filter since goals are already separated)
      if (filterCategory !== 'ALL' && goal.category !== filterCategory) {
        return false
      }

      // Status filter
      const isGoalCompleted = goal.completed || goal.progress >= 100
      if (filterStatus === 'ACTIVE' && isGoalCompleted) return false
      if (filterStatus === 'COMPLETED' && !isGoalCompleted) return false
      if (filterStatus === 'OVERDUE') {
        if (!goal.deadline || isGoalCompleted) return false
        const isOverdue = new Date(goal.deadline) < new Date() && !isGoalCompleted
        if (!isOverdue) return false
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return (b.progress || 0) - (a.progress || 0)
        case 'deadline':
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        case 'category':
          return (a.category || '').localeCompare(b.category || '')
        case 'date':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      }
    }), [goals, searchQuery, filterCategory, filterStatus, sortBy])

  const dunyaGoals = filteredAndSortedGoals.filter(g => g?.goalType === 'DUNYA')
  const akhirahGoals = filteredAndSortedGoals.filter(g => g?.goalType === 'AKHIRAH')

  const dunyaCompletion = dunyaGoals.length > 0
    ? (dunyaGoals.filter(g => g.completed || g.progress >= 100).length / dunyaGoals.length) * 100
    : 0

  const akhirahCompletion = akhirahGoals.length > 0
    ? (akhirahGoals.filter(g => g.completed || g.progress >= 100).length / akhirahGoals.length) * 100
    : 0

  // Pagination logic
  const totalDunyaPages = Math.ceil(dunyaGoals.length / ITEMS_PER_PAGE)
  const totalAkhirahPages = Math.ceil(akhirahGoals.length / ITEMS_PER_PAGE)

  const paginatedDunyaGoals = dunyaGoals.slice(
    (currentDunyaPage - 1) * ITEMS_PER_PAGE,
    currentDunyaPage * ITEMS_PER_PAGE
  )

  const paginatedAkhirahGoals = akhirahGoals.slice(
    (currentAkhirahPage - 1) * ITEMS_PER_PAGE,
    currentAkhirahPage * ITEMS_PER_PAGE
  )

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentDunyaPage(1)
    setCurrentAkhirahPage(1)
  }, [searchQuery, filterCategory, filterStatus, sortBy])

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const isDunya = goal.goalType === 'DUNYA'
    // Use both completed flag AND progress check for safety
    const isCompleted = goal.completed || goal.progress >= 100
    
    // Local state for input field to prevent constant API calls
    const [localProgress, setLocalProgress] = useState(goal.progress)
    const [isEditing, setIsEditing] = useState(false)

    // Update local progress when goal.progress changes from outside
    useEffect(() => {
      if (!isEditing) {
        setLocalProgress(goal.progress)
      }
    }, [goal.progress, isEditing])

    const handleProgressChange = (value: number) => {
      setLocalProgress(value)
      setIsEditing(true)
      // Call API with debounce
      updateGoalProgress(goal.id, value, false)
    }

    const handleProgressBlur = () => {
      setIsEditing(false)
      // Ensure final sync
      if (localProgress !== goal.progress) {
        updateGoalProgress(goal.id, localProgress, true)
      }
    }

    const quickIncrement = (amount: number) => {
      const newProgress = Math.min(100, Math.max(0, goal.progress + amount))
      setLocalProgress(newProgress)
      updateGoalProgress(goal.id, newProgress, true)
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <Card className={`group hover:shadow-lg transition-all relative overflow-hidden ${
          isDunya
            ? 'border-amber-200 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30'
            : 'border-purple-200 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30'
        } ${isCompleted ? 'ring-2 ring-green-500 dark:ring-green-400' : ''}`}>
          {/* Completion Badge */}
          {isCompleted && (
            <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              COMPLETED
            </div>
          )}
          
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-20">
                  <h3 className={`text-xl font-bold ${
                    isDunya ? 'text-amber-800 dark:text-amber-300' : 'text-purple-800 dark:text-purple-300'
                  } ${isCompleted ? 'line-through decoration-2 decoration-green-500' : ''}`}>
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {goal.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {goal.deadline && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Award className="h-4 w-4" />
                      {goal.category}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingGoal(goal)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-medium ${
                    isDunya ? 'text-amber-700 dark:text-amber-400' : 'text-purple-700 dark:text-purple-400'
                  }`}>
                    Progress
                  </span>
                  <span className={`font-bold ${isCompleted ? 'text-green-600 dark:text-green-400' : ''}`}>
                    {goal.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      isCompleted
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : isDunya
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                        : 'bg-gradient-to-r from-purple-500 to-violet-500'
                    }`}
                    style={{ width: `${goal.progress}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  />
                </div>
                {isCompleted ? (
                  /* Completed State - Show celebration message */
                  <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border-2 border-green-500 dark:border-green-400">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Goal Achieved! May Allah reward your efforts! 🎉
                    </span>
                  </div>
                ) : (
                  /* Active State - Allow progress updates */
                  <div className="space-y-2">
                    {/* Input Field */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Set:</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={localProgress}
                        onChange={(e) => {
                          const value = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                          handleProgressChange(value)
                        }}
                        onBlur={handleProgressBlur}
                        onFocus={() => setIsEditing(true)}
                        className="h-7 w-16 text-sm font-semibold bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        placeholder="0"
                      />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">%</span>
                    </div>
                    
                    {/* Quick Increment Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => quickIncrement(1)}
                        className="flex-1 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors border border-gray-300 dark:border-gray-600"
                      >
                        +1%
                      </button>
                      <button
                        onClick={() => quickIncrement(5)}
                        className="flex-1 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-colors border border-gray-300 dark:border-gray-600"
                      >
                        +5%
                      </button>
                      <button
                        onClick={() => quickIncrement(10)}
                        style={{
                          background: isDunya
                            ? 'linear-gradient(to right, rgb(245, 158, 11), rgb(234, 179, 8))'
                            : 'linear-gradient(to right, rgb(168, 85, 247), rgb(139, 92, 246))',
                          border: 'none',
                          outline: 'none'
                        }}
                        className="flex-1 h-8 rounded-lg text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200 hover:opacity-90"
                      >
                        +10%
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-amber-950/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your goals...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-amber-950/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-none shadow-xl bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 dark:from-amber-600 dark:via-yellow-600 dark:to-orange-600 text-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Target className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold">Goals</h1>
                    <p className="text-white/90">Balance your worldly and spiritual aspirations</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setSelectedType(null) // Allow user to choose type
                    setNewGoal({
                      title: '',
                      description: '',
                      goalType: 'DUNYA',
                      category: 'PERSONAL',
                      progress: 0,
                      target: 100,
                      deadline: ''
                    })
                    setShowNewGoal(true)
                  }}
                  size="lg"
                  className="bg-white text-amber-600 hover:bg-white/90"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Goal
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        {stats && <GoalsStats stats={stats} />}

        {/* Filters */}
        <GoalsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={filterCategory}
          onCategoryChange={setFilterCategory}
          selectedStatus={filterStatus}
          onStatusChange={setFilterStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dunya Goals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                Dunya (Worldly)
              </h2>
              <button
                onClick={() => {
                  setSelectedType('DUNYA')
                  setNewGoal(prev => ({ ...prev, goalType: 'DUNYA' }))
                  setShowNewGoal(true)
                }}
                style={{
                  background: 'linear-gradient(to right, rgb(245, 158, 11), rgb(234, 179, 8))',
                  border: 'none',
                  outline: 'none'
                }}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </button>
            </div>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {paginatedDunyaGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </AnimatePresence>
              {dunyaGoals.length === 0 && (
                <Card className="border-dashed border-2 border-amber-200 dark:border-amber-800/50 bg-amber-50/30 dark:bg-amber-950/10">
                  <CardContent className="p-12 text-center">
                    <Target className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                    <p className="text-amber-600 dark:text-amber-400">No Dunya goals yet</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Set goals for career, health, skills, and relationships
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Pagination for Dunya Goals */}
              {totalDunyaPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDunyaPage(prev => Math.max(1, prev - 1))}
                    disabled={currentDunyaPage === 1}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalDunyaPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentDunyaPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentDunyaPage(page)}
                        className={`h-9 w-9 p-0 ${currentDunyaPage === page ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDunyaPage(prev => Math.min(totalDunyaPages, prev + 1))}
                    disabled={currentDunyaPage === totalDunyaPages}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {dunyaGoals.length} goals
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Akhirah Goals */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300">
                Akhirah (Hereafter)
              </h2>
              <button
                onClick={() => {
                  setSelectedType('AKHIRAH')
                  setNewGoal(prev => ({ ...prev, goalType: 'AKHIRAH' }))
                  setShowNewGoal(true)
                }}
                style={{
                  background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(139, 92, 246))',
                  border: 'none',
                  outline: 'none'
                }}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </button>
            </div>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {paginatedAkhirahGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </AnimatePresence>
              {akhirahGoals.length === 0 && (
                <Card className="border-dashed border-2 border-purple-200 dark:border-purple-800/50 bg-purple-50/30 dark:bg-purple-950/10">
                  <CardContent className="p-12 text-center">
                    <Award className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-purple-600 dark:text-purple-400">No Akhirah goals yet</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Set goals for Quran, prayers, charity, and good deeds
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Pagination for Akhirah Goals */}
              {totalAkhirahPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentAkhirahPage(prev => Math.max(1, prev - 1))}
                    disabled={currentAkhirahPage === 1}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalAkhirahPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentAkhirahPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentAkhirahPage(page)}
                        className={`h-9 w-9 p-0 ${currentAkhirahPage === page ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentAkhirahPage(prev => Math.min(totalAkhirahPages, prev + 1))}
                    disabled={currentAkhirahPage === totalAkhirahPages}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {akhirahGoals.length} goals
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Goal Modal */}
        <AnimatePresence>
          {showNewGoal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowNewGoal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border-4 ${
                  newGoal.goalType === 'DUNYA' 
                    ? 'border-amber-400 dark:border-amber-600' 
                    : 'border-purple-400 dark:border-purple-600'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Goal</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {newGoal.goalType === 'DUNYA' ? '🌍 Creating Dunya goal' : '🕌 Creating Akhirah goal'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowNewGoal(false)
                      setSelectedType(null)
                    }}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Goal Type Selector - Show only when user clicked main "New Goal" button */}
                  {selectedType === null ? (
                    <div>
                      <label className="text-sm font-semibold mb-3 block text-gray-700 dark:text-gray-300 uppercase tracking-wide">Goal Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        {['DUNYA', 'AKHIRAH'].map((type) => {
                          const isSelected = newGoal.goalType === type
                          const isDunya = type === 'DUNYA'
                          
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setNewGoal(prev => ({ ...prev, goalType: type as 'DUNYA' | 'AKHIRAH' }))}
                              style={isSelected ? {
                                background: isDunya
                                  ? 'linear-gradient(to right, rgb(245, 158, 11), rgb(234, 179, 8))'
                                  : 'linear-gradient(to right, rgb(168, 85, 247), rgb(139, 92, 246))',
                                border: 'none',
                                outline: 'none'
                              } : undefined}
                              className={`h-14 font-semibold text-sm transition-all rounded-lg inline-flex items-center justify-center ${
                                isSelected
                                  ? 'text-white shadow-lg scale-105'
                                  : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 shadow-sm'
                              }`}
                            >
                              {type === 'DUNYA' ? '🌍 Dunya (Worldly)' : '🕌 Akhirah (Hereafter)'}
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {newGoal.goalType === 'DUNYA' 
                          ? '💼 Worldly goals: Career, health, skills, finances' 
                          : '🤲 Spiritual goals: Quran, prayers, charity, good deeds'}
                      </p>
                    </div>
                  ) : (
                    /* Goal Type Fixed - Show when user clicked section-specific Add button */
                    <div className={`p-4 rounded-xl border-2 ${
                      newGoal.goalType === 'DUNYA'
                        ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-400 dark:border-amber-600'
                        : 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-400 dark:border-purple-600'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          newGoal.goalType === 'DUNYA'
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                            : 'bg-gradient-to-r from-purple-500 to-violet-500'
                        }`}>
                          {newGoal.goalType === 'DUNYA' ? '🌍' : '🕌'}
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold ${
                            newGoal.goalType === 'DUNYA'
                              ? 'text-amber-800 dark:text-amber-300'
                              : 'text-purple-800 dark:text-purple-300'
                          }`}>
                            {newGoal.goalType === 'DUNYA' ? 'Dunya (Worldly) Goal' : 'Akhirah (Hereafter) Goal'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {newGoal.goalType === 'DUNYA' 
                              ? '💼 Career, health, skills, finances' 
                              : '🤲 Quran, prayers, charity, good deeds'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={newGoal.title}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Complete Quran memorization"
                      className="h-12 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                      Description <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <Textarea
                      value={newGoal.description}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your goal in detail..."
                      className="min-h-[100px] bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newGoal.category}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full h-12 px-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:border-emerald-500"
                      required
                    >
                      <option value="IBADAH">🤲 Ibadah (Worship)</option>
                      <option value="KNOWLEDGE">📚 Knowledge (Learning)</option>
                      <option value="FAMILY">👨‍👩‍👧‍👦 Family</option>
                      <option value="WORK">💼 Work (Career)</option>
                      <option value="HEALTH">💪 Health (Fitness)</option>
                      <option value="COMMUNITY">🤝 Community (Service)</option>
                      <option value="PERSONAL">⭐ Personal (Development)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block text-gray-700 dark:text-gray-300">
                      Deadline <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={newGoal.deadline}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="h-12 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-emerald-500 dark:focus:border-emerald-500"
                      required
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      📅 Choose when you want to complete this goal
                    </p>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={createGoal}
                      disabled={!newGoal.title.trim() || !newGoal.category || !newGoal.deadline}
                      style={{
                        background: 'linear-gradient(to right, rgb(16, 185, 129), rgb(20, 184, 166))',
                        border: 'none',
                        outline: 'none'
                      }}
                      className="flex-1 h-12 rounded-lg text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                    >
                      Create Goal
                    </button>
                    <button
                      onClick={() => {
                        setShowNewGoal(false)
                        setSelectedType(null)
                      }}
                      className="h-12 px-6 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 border-0 font-medium transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deletingGoal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setDeletingGoal(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border-4 border-red-400 dark:border-red-600"
              >
                {/* Warning Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                    <Trash2 className="h-10 w-10 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Delete Goal?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete{' '}
                    <span className="font-semibold text-gray-900 dark:text-white">
                      "{deletingGoal.title}"
                    </span>
                    ?
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    ⚠️ This action cannot be undone!
                  </p>

                  {/* Goal Info */}
                  <div className={`p-4 rounded-xl border-2 ${
                    deletingGoal.goalType === 'DUNYA'
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                      : 'bg-purple-50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700'
                  }`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <span className={`font-semibold ${
                        deletingGoal.goalType === 'DUNYA'
                          ? 'text-amber-700 dark:text-amber-400'
                          : 'text-purple-700 dark:text-purple-400'
                      }`}>
                        {deletingGoal.goalType === 'DUNYA' ? '🌍 Dunya' : '🕌 Akhirah'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600 dark:text-gray-400">Progress:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {deletingGoal.progress}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setDeletingGoal(null)}
                    className="flex-1 h-12 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteGoal}
                    style={{
                      background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(220, 38, 38))',
                      border: 'none',
                      outline: 'none'
                    }}
                    className="flex-1 h-12 rounded-lg text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:opacity-90 inline-flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Goal
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
