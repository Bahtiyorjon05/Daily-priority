'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  Trash2,
  BarChart3,
  Brain,
  Filter,
  Search,
  Grid3X3,
  List,
  AlertCircle,
  Star,
  Activity,
  BookOpen,
  Users,
  Lightbulb,
  Rocket,
  Shield,
  Gift,
  X,
  Tag,
  User,
  Settings,
  Bell,
  Menu,
  Home,
  ChevronDown,
  Edit3,
  Sun,
  Moon,
  Sparkles,
  Compass,
  TrendingDown,
  TrendingUp as TrendingUpIcon,
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Flag,
  Timer,
  Award,
  Flame
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { generateTaskSuggestions, analyzeProductivity } from '@/lib/ai'

interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'
  urgent: boolean
  important: boolean
  estimatedTime?: number
  energyLevel?: 'LOW' | 'MEDIUM' | 'HIGH'
  aiSuggested: boolean
  aiReason?: string
  aiPriorityScore?: number
  createdAt: string
  completedAt?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate?: string
  category?: {
    name: string
    color: string
  }
  tags?: string[]
}

interface Stats {
  streak: number
  productivityScore: number
  tasksCompleted: number
  totalTasks: number
  weeklyGoals: number
  completedGoals: number
}

interface AIInsight {
  type: 'success' | 'improvement' | 'celebration' | 'suggestion'
  title: string
  message: string
  action: string
  priority: 'high' | 'medium' | 'low'
}

export default function AITaskManager({ session }: { session: any }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [stats, setStats] = useState<Stats>({
    streak: 0,
    productivityScore: 0,
    tasksCompleted: 0,
    totalTasks: 0,
    weeklyGoals: 0,
    completedGoals: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'urgent' | 'ai'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<Task[]>([])
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt' | 'aiScore'>('priority')
  const [showCompleted, setShowCompleted] = useState(false)
  const [taskView, setTaskView] = useState<'all' | 'today' | 'week'>('today')

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setTasks([
        {
          id: '1',
          title: 'Complete project proposal',
          description: 'Finish the quarterly project proposal document',
          status: 'TODO',
          urgent: true,
          important: true,
          estimatedTime: 120,
          energyLevel: 'HIGH',
          aiSuggested: false,
          aiPriorityScore: 95,
          createdAt: new Date().toISOString(),
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          category: { name: 'Work', color: '#3B82F6' },
          tags: ['project', 'deadline']
        },
        {
          id: '2',
          title: 'Morning prayer',
          description: 'Perform Fajr prayer on time',
          status: 'COMPLETED',
          urgent: false,
          important: true,
          estimatedTime: 15,
          energyLevel: 'LOW',
          aiSuggested: true,
          aiReason: 'Recommended based on your prayer history',
          aiPriorityScore: 90,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          priority: 'HIGH',
          category: { name: 'Spiritual', color: '#10B981' },
          tags: ['prayer', 'daily']
        },
        {
          id: '3',
          title: 'Review team progress',
          description: 'Check in with team members on their tasks',
          status: 'IN_PROGRESS',
          urgent: false,
          important: true,
          estimatedTime: 45,
          energyLevel: 'MEDIUM',
          aiSuggested: false,
          aiPriorityScore: 80,
          createdAt: new Date().toISOString(),
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          category: { name: 'Management', color: '#8B5CF6' },
          tags: ['team', 'review']
        },
        {
          id: '4',
          title: 'Read 10 pages of Quran',
          description: 'Complete daily Quran reading goal',
          status: 'TODO',
          urgent: false,
          important: true,
          estimatedTime: 30,
          energyLevel: 'LOW',
          aiSuggested: true,
          aiReason: 'Based on your spiritual growth pattern',
          aiPriorityScore: 85,
          createdAt: new Date().toISOString(),
          priority: 'HIGH',
          category: { name: 'Spiritual', color: '#10B981' },
          tags: ['quran', 'daily']
        },
        {
          id: '5',
          title: 'Schedule dentist appointment',
          description: 'Call dentist office to schedule checkup',
          status: 'TODO',
          urgent: false,
          important: false,
          estimatedTime: 10,
          energyLevel: 'LOW',
          aiSuggested: false,
          aiPriorityScore: 30,
          createdAt: new Date().toISOString(),
          priority: 'LOW',
          category: { name: 'Health', color: '#EC4899' },
          tags: ['health', 'appointment']
        }
      ])
      
      setStats({
        streak: 7,
        productivityScore: 85,
        tasksCompleted: 12,
        totalTasks: 18,
        weeklyGoals: 5,
        completedGoals: 3
      })
      
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  // Memoized filtered and sorted tasks
  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter(task => {
        if (!task || typeof task !== 'object') return false
        
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          const matchesSearch = 
            task.title?.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower) ||
            task.category?.name?.toLowerCase().includes(searchLower) ||
            task.tags?.some(tag => tag.toLowerCase().includes(searchLower))
          if (!matchesSearch) return false
        }
        
        // Status filter
        if (filter === 'completed') return task.status === 'COMPLETED'
        if (filter === 'pending') return task.status !== 'COMPLETED'
        if (filter === 'urgent') return task.urgent
        if (filter === 'ai') return task.aiSuggested
        
        // Task view filter
        if (taskView === 'today') {
          // Show today's tasks and overdue tasks
          if (task.status === 'COMPLETED') return false
          if (!task.dueDate) return true
          const dueDate = new Date(task.dueDate)
          const today = new Date()
          return dueDate.toDateString() === today.toDateString() || dueDate < today
        }
        
        if (taskView === 'week') {
          // Show this week's tasks
          if (task.status === 'COMPLETED') return false
          if (!task.dueDate) return true
          const dueDate = new Date(task.dueDate)
          const today = new Date()
          const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          return dueDate >= today && dueDate <= oneWeekFromNow
        }
        
        return true
      })
      .sort((a, b) => {
        // Sort by selected criteria
        if (sortBy === 'priority') {
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 }
          return priorityOrder[b.priority || 'LOW'] - priorityOrder[a.priority || 'LOW']
        }
        
        if (sortBy === 'dueDate') {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        }
        
        if (sortBy === 'aiScore') {
          return (b.aiPriorityScore || 0) - (a.aiPriorityScore || 0)
        }
        
        // Default sort by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [tasks, searchTerm, filter, sortBy, taskView])

  const completionRate = useMemo(() => 
    stats.totalTasks > 0 ? (stats.tasksCompleted / stats.totalTasks) * 100 : 0, 
    [stats.tasksCompleted, stats.totalTasks]
  )
  
  const goalProgress = useMemo(() => 
    stats.weeklyGoals > 0 ? (stats.completedGoals / stats.weeklyGoals) * 100 : 0, 
    [stats.completedGoals, stats.weeklyGoals]
  )

  // AI-powered task suggestions
  const getAISuggestions = async () => {
    try {
      setAiLoading(true)
      
      // Get user context for AI suggestions
      const userContext = {
        completedTasks: tasks.filter(t => t.status === 'COMPLETED').map(t => t.title),
        currentTime: new Date().toLocaleTimeString(),
        userGoals: 'Improve productivity and spiritual growth',
        energyLevel: 'MEDIUM',
        userId: session?.user?.id
      }
      
      const suggestions = await generateTaskSuggestions(userContext)
      
      // Transform AI suggestions into task format
      const formattedSuggestions = suggestions.tasks.map((suggestion: any, index: number) => ({
        id: 'ai-' + (Date.now()) + '-' + (index),
        title: suggestion.title,
        description: suggestion.description,
        status: 'TODO',
        urgent: suggestion.urgent,
        important: suggestion.important,
        estimatedTime: suggestion.estimatedTime,
        energyLevel: suggestion.energyLevel?.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH',
        aiSuggested: true,
        aiReason: suggestion.reason,
        aiPriorityScore: suggestion.priority === 'HIGH' ? 90 : suggestion.priority === 'MEDIUM' ? 70 : 50,
        priority: suggestion.priority as 'LOW' | 'MEDIUM' | 'HIGH',
        createdAt: new Date().toISOString(),
        category: { name: 'AI Suggestion', color: '#8B5CF6' },
        tags: ['ai', 'suggestion']
      }))
      
      setAiSuggestions(formattedSuggestions)
      setShowAiSuggestions(true)
      toast.success('Generated ' + (formattedSuggestions.length) + ' AI suggestions!')
    } catch (error) {
      console.error('Error getting AI suggestions:', error)
      toast.error('Failed to get AI suggestions')
    } finally {
      setAiLoading(false)
    }
  }

  // Accept AI suggestion as new task
  const acceptAISuggestion = (suggestion: Task) => {
    setTasks(prev => [...prev, { ...suggestion, id: 'task-' + (Date.now()) }])
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
    toast.success('AI suggestion added as task!')
  }

  // Accept all AI suggestions
  const acceptAllAISuggestions = () => {
    setTasks(prev => [...prev, ...aiSuggestions.map(s => ({ ...s, id: 'task-' + (Date.now()) + '-' + (Math.random()) }))])
    setAiSuggestions([])
    setShowAiSuggestions(false)
    toast.success('Added ' + (aiSuggestions.length) + ' AI suggestions as tasks!')
  }

  // Toggle task completion
  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
        return {
          ...task,
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined
        }
      }
      return task
    }))
    
    // Update stats
    setStats(prev => ({
      ...prev,
      tasksCompleted: tasks.filter(t => t.id === taskId)[0].status === 'COMPLETED' 
        ? prev.tasksCompleted - 1 
        : prev.tasksCompleted + 1
    }))
    
    toast.success(tasks.filter(t => t.id === taskId)[0].status === 'COMPLETED' 
      ? 'Task reopened!' 
      : 'Task completed!')
  }

  // Delete task
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
    toast.success('Task deleted!')
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  // Get energy level indicator
  const getEnergyLevelIndicator = (energyLevel: string) => {
    switch (energyLevel) {
      case 'HIGH': return <Zap className="h-4 w-4 text-red-500" />
      case 'MEDIUM': return <Activity className="h-4 w-4 text-yellow-500" />
      case 'LOW': return <Moon className="h-4 w-4 text-green-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading AI-powered task manager...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Failed to load tasks</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <Target className="h-6 w-6 text-white" />
              </div>
              AI Task Manager
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Smart task prioritization powered by AI
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={getAISuggestions}
              disabled={aiLoading}
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
              onClick={() => setShowNewTask(true)} 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Tasks Completed</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.tasksCompleted}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Completion Rate</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{Math.round(completionRate)}%</p>
                </div>
                <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">Streak</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                    <Flame className="h-5 w-5 text-amber-500" />
                    {stats.streak}
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
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">AI Suggestions</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{aiSuggestions.length}</p>
                </div>
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks, categories, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-400"
                />
              </div>
              
              {/* View Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All Tasks', icon: Grid3X3 },
                  { key: 'today', label: 'Today', icon: Calendar },
                  { key: 'week', label: 'This Week', icon: Clock }
                ].map((viewOption) => {
                  const Icon = viewOption.icon
                  return (
                    <Button
                      key={viewOption.key}
                      variant={taskView === viewOption.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTaskView(viewOption.key as any)}
                      className={taskView === viewOption.key 
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {viewOption.label}
                    </Button>
                  )
                })}
              </div>
              
              {/* Status Filters */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All', icon: Circle },
                  { key: 'pending', label: 'Pending', icon: Clock },
                  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
                  { key: 'urgent', label: 'Urgent', icon: Flag },
                  { key: 'ai', label: 'AI', icon: Sparkles }
                ].map((filterOption) => {
                  const Icon = filterOption.icon
                  return (
                    <Button
                      key={filterOption.key}
                      variant={filter === filterOption.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(filterOption.key as 'all' | 'pending' | 'completed')}
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
              
              {/* Sort Options */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'priority' | 'dueDate' | 'createdAt' | 'aiScore')}
                  className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="priority">Sort by Priority</option>
                  <option value="dueDate">Sort by Due Date</option>
                  <option value="createdAt">Sort by Created</option>
                  <option value="aiScore">Sort by AI Score</option>
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                >
                  {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Task Count */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{filteredAndSortedTasks.length} task{filteredAndSortedTasks.length !== 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{filteredAndSortedTasks.filter(t => t.status === 'COMPLETED').length} completed</span>
                {filteredAndSortedTasks.filter(t => t.aiSuggested).length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      {filteredAndSortedTasks.filter(t => t.aiSuggested).length} AI suggested
                    </span>
                  </>
                )}
              </div>
              
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className={'grid gap-4 ' + (viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')}>
          {filteredAndSortedTasks.length > 0 ? (
            filteredAndSortedTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleTask(task.id)}
                      className={'h-6 w-6 p-0 mt-0.5 ' + (task.status === 'COMPLETED' 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                          : 'border border-gray-300 dark:border-gray-600 hover:border-emerald-500')}
                    >
                      {task.status === 'COMPLETED' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className={'font-medium ' + (task.status === 'COMPLETED' 
                            ? 'text-gray-500 dark:text-gray-400 line-through' 
                            : 'text-gray-900 dark:text-gray-100')}>
                          {task.title}
                        </h3>
                        {task.aiSuggested && (
                          <div className="flex items-center gap-1 ml-2">
                            <Sparkles className="h-3 w-3 text-purple-500" />
                            <span className="text-xs text-purple-600 dark:text-purple-400">AI</span>
                          </div>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className={'text-sm mt-1 ' + (task.status === 'COMPLETED' 
                            ? 'text-gray-400 dark:text-gray-500' 
                            : 'text-gray-600 dark:text-gray-400')}>
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {task.category && (
                          <div 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: (task.category.color) + '20',
                              color: task.category.color
                            }}
                          >
                            {task.category.name}
                          </div>
                        )}
                        
                        <div className={'px-2 py-1 rounded-full text-xs font-medium ' + (getPriorityColor(task.priority || 'LOW'))}>
                          {task.priority || 'LOW'} PRIORITY
                        </div>
                        
                        {task.estimatedTime && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            <Timer className="h-3 w-3" />
                            {task.estimatedTime}m
                          </div>
                        )}
                        
                        {task.energyLevel && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {getEnergyLevelIndicator(task.energyLevel)}
                            {task.energyLevel}
                          </div>
                        )}
                        
                        {task.dueDate && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-0.5 rounded-full text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {task.aiSuggested && task.aiReason && (
                        <div className="mt-3 p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/50">
                          <div className="flex items-center gap-1 mb-1">
                            <Lightbulb className="h-3 w-3 text-purple-500" />
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                              AI Recommendation
                            </span>
                          </div>
                          <p className="text-xs text-purple-600 dark:text-purple-400">
                            {task.aiReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Created {new Date(task.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-red-500"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto max-w-md">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {filter === 'completed' ? 'No completed tasks yet' : 'No tasks found'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {filter === 'completed' 
                    ? 'Complete some tasks to see them here.' 
                    : 'Create your first task to get started!'}
                </p>
                <Button 
                  onClick={() => setShowNewTask(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Task
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
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Task Suggestions</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Personalized recommendations for your productivity
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
                            onClick={() => acceptAISuggestion(suggestion)}
                          >
                            Add
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
                    onClick={acceptAllAISuggestions}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    Add All Suggestions
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