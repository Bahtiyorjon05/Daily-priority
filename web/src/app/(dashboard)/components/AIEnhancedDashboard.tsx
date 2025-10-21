'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
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
  Flame,
  Award,
  Trophy,
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
  TrendingUp as TrendingUpIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { generateTaskSuggestions, analyzeProductivity } from '@/lib/ai'
import TaskCard from '@/app/(dashboard)/dashboard/components/TaskCard'
import StatCard from '@/app/(dashboard)/dashboard/components/StatCard'
import PrayerTimeCard from '@/app/(dashboard)/dashboard/components/PrayerTimeCard'
import LoadingState from '@/app/(dashboard)/dashboard/components/LoadingState'
import ErrorState from '@/app/(dashboard)/dashboard/components/ErrorState'
import EmptyState from '@/app/(dashboard)/dashboard/components/EmptyState'

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
}

export default function AIEnhancedDashboard({ session }: { session: any }) {
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
  const [dailyInspiration, setDailyInspiration] = useState<{ text: string; source: string; type: string; arabic?: string } | null>(null)
  const [prayerTimes, setPrayerTimes] = useState<any[]>([])
  const [nextPrayer, setNextPrayer] = useState<any>(null)
  const [location, setLocation] = useState<{ city: string; country: string } | null>(null)
  const [qiblaDirection, setQiblaDirection] = useState<number>(0)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [aiSuggestions, setAiSuggestions] = useState<Task[]>([])
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [productivityAnalysis, setProductivityAnalysis] = useState<any>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setTasks([
        {
          id: '1',
          title: 'Complete project proposal',
          description: 'Finish the quarterly project proposal document',
          status: 'PENDING',
          urgent: true,
          important: true,
          estimatedTime: 120,
          energyLevel: 'high',
          aiSuggested: false,
          createdAt: new Date().toISOString(),
          category: { name: 'Work', color: '#3B82F6' }
        },
        {
          id: '2',
          title: 'Morning prayer',
          description: 'Perform Fajr prayer on time',
          status: 'COMPLETED',
          urgent: false,
          important: true,
          estimatedTime: 15,
          energyLevel: 'low',
          aiSuggested: true,
          aiReason: 'Recommended based on your prayer history',
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          category: { name: 'Spiritual', color: '#10B981' }
        },
        {
          id: '3',
          title: 'Review team progress',
          description: 'Check in with team members on their tasks',
          status: 'PENDING',
          urgent: false,
          important: true,
          estimatedTime: 45,
          energyLevel: 'medium',
          aiSuggested: false,
          createdAt: new Date().toISOString(),
          category: { name: 'Management', color: '#8B5CF6' }
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
      
      setPrayerTimes([
        { name: 'Fajr', arabicName: 'الفجر', time: '05:30', passed: true },
        { name: 'Dhuhr', arabicName: 'الظهر', time: '12:15', passed: true },
        { name: 'Asr', arabicName: 'العصر', time: '15:30', passed: false, nextPrayerIn: '2h 15m' },
        { name: 'Maghrib', arabicName: 'المغرب', time: '18:20', passed: false },
        { name: 'Isha', arabicName: 'العشاء', time: '19:45', passed: false }
      ])
      
      setNextPrayer({ name: 'Asr', time: '15:30', timeUntil: '2h 15m' })
      setLocation({ city: 'New York', country: 'USA' })
      setQiblaDirection(55)
      
      setDailyInspiration({
        text: "And whoever relies upon Allah - then He is sufficient for him.",
        source: "Quran 65:3",
        type: "quran",
        arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ"
      })
      
      setLoading(false)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])

  // Memoized filtered tasks to prevent unnecessary re-renders
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task || typeof task !== 'object') return false
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch = 
          task.title?.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.category?.name?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }
      
      // Status filter
      if (filter === 'completed') return task.status === 'COMPLETED'
      if (filter === 'pending') return task.status !== 'COMPLETED'
      return true
    }).sort((a, b) => {
      if (a.aiSuggested && !b.aiSuggested) return -1
      if (!a.aiSuggested && b.aiSuggested) return 1
      if (a.urgent && !b.urgent) return -1
      if (!a.urgent && b.urgent) return 1
      if (a.important && !b.important) return -1
      if (!a.important && b.important) return 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }, [tasks, searchTerm, filter])

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
        status: 'PENDING',
        urgent: suggestion.urgent,
        important: suggestion.important,
        estimatedTime: suggestion.estimatedTime,
        energyLevel: suggestion.energyLevel,
        aiSuggested: true,
        aiReason: suggestion.reason,
        priority: suggestion.priority,
        createdAt: new Date().toISOString(),
        category: { name: 'AI Suggestion', color: '#8B5CF6' }
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

  // AI-powered productivity analysis
  const getProductivityAnalysis = async () => {
    try {
      setAnalysisLoading(true)
      
      const analysisData = {
        completedTasks: stats.tasksCompleted,
        totalTasks: stats.totalTasks,
        focusTime: 120, // minutes
        completionRate: completionRate
      }
      
      const analysis = await analyzeProductivity(analysisData)
      setProductivityAnalysis(analysis)
      
      // Generate AI insights based on analysis
      const insights: AIInsight[] = [
        {
          type: 'success',
          title: 'Great Progress!',
          message: analysis.analysis,
          action: analysis.recommendations[0] || 'Keep up the good work!'
        },
        {
          type: 'suggestion',
          title: 'Productivity Tip',
          message: 'Based on your patterns, morning tasks have the highest completion rate',
          action: 'Try scheduling important tasks in the morning'
        }
      ]
      
      if (completionRate > 80) {
        insights.push({
          type: 'celebration',
          title: 'Outstanding Performance!',
          message: "You're completing " + Math.round(completionRate) + "% of your tasks. That's exceptional!",
          action: 'Consider taking on more challenging goals'
        })
      } else if (completionRate < 50) {
        insights.push({
          type: 'improvement',
          title: 'Opportunity for Growth',
          message: "Your completion rate is " + Math.round(completionRate) + "%. Let's work on this together.",
          action: 'Try breaking tasks into smaller chunks'
        })
      }
      
      setAiInsights(insights)
    } catch (error) {
      console.error('Error getting productivity analysis:', error)
      setAiInsights([
        {
          type: 'suggestion',
          title: 'Productivity Tip',
          message: 'Based on your patterns, morning tasks have the highest completion rate',
          action: 'Try scheduling important tasks in the morning'
        }
      ])
    } finally {
      setAnalysisLoading(false)
    }
  }

  // Get productivity analysis when stats change
  useEffect(() => {
    if (stats.tasksCompleted > 0) {
      getProductivityAnalysis()
    }
  }, [stats])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <LoadingState message="Loading your AI-enhanced dashboard..." size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <ErrorState 
          title="Failed to load dashboard" 
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Welcome Header with AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-lg"
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <div className="relative group">
                    <Avatar className="h-14 w-14 border-4 border-white/30">
                      <AvatarImage src={profileImage || session?.user?.image || ''} />
                      <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
                        {session?.user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Edit3 className="h-5 w-5 text-white" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setUploadingImage(true)
                          // Simulate upload
                          setTimeout(() => {
                            setProfileImage(URL.createObjectURL(e.target.files![0]))
                            setUploadingImage(false)
                            toast.success('Profile image updated!')
                          }, 1000)
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={uploadingImage}
                      aria-label="Upload profile image"
                    />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold mb-1">
                      {getGreeting()}, {session?.user?.name || 'User'}!
                    </h1>
                    <p className="text-white/90 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      AI-Powered Productivity Dashboard
                    </p>
                  </div>
                </motion.div>
                
                {dailyInspiration && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 max-w-2xl"
                  >
                    {dailyInspiration.arabic && (
                      <p className="text-white/95 text-lg font-arabic text-right mb-3 leading-relaxed">
                        {dailyInspiration.arabic}
                      </p>
                    )}
                    <p className="text-white/95 font-medium mb-2 leading-relaxed">
                      "{dailyInspiration.text}"
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={'px-2 py-1 rounded-full text-xs font-medium ' + (dailyInspiration.type === 'quran' ? 'bg-emerald-500/30 text-emerald-100' :
                        dailyInspiration.type === 'hadith' ? 'bg-blue-500/30 text-blue-100' :
                        'bg-purple-500/30 text-purple-100')}>
                        {dailyInspiration.type === 'quran' ? '📖 Quran' : 
                         dailyInspiration.type === 'hadith' ? '🤲 Hadith' : '💎 Wisdom'}
                      </div>
                      <p className="text-white/80 text-xs font-medium">— {dailyInspiration.source}</p>
                    </div>
                  </motion.div>
                )}
              </div>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white/20 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-5 w-5 text-orange-300" />
                  <span className="text-xl font-bold">{stats.streak}</span>
                </div>
                <p className="text-white/80 text-xs text-center">Day Streak</p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Stats Cards with AI Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Tasks Completed" 
            value={stats.tasksCompleted} 
            subtitle={'of ' + (stats.totalTasks) + ' total'} 
            icon={CheckCircle2} 
            color="blue"
            progress={completionRate}
          />
          <StatCard 
            title="Productivity Score" 
            value={(stats.productivityScore) + '%'} 
            subtitle="Weekly average" 
            icon={TrendingUp} 
            color="emerald"
          />
          <StatCard 
            title="Weekly Goals" 
            value={(stats.completedGoals) + '/' + (stats.weeklyGoals)} 
            subtitle={(Math.round(goalProgress)) + '% complete'} 
            icon={Target} 
            color="purple"
          />
          <StatCard 
            title="Focus Time" 
            value="3.2h" 
            subtitle="Today's session" 
            icon={Clock} 
            color="amber"
          />
        </div>

        {/* AI-Powered Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Today's Tasks</h2>
                <p className="text-gray-600 dark:text-gray-400">Focus on what matters most</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {!bulkMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {viewMode === 'grid' ? <List className="h-4 w-4 mr-2" /> : <Grid3X3 className="h-4 w-4 mr-2" />}
                      {viewMode === 'grid' ? 'List' : 'Grid'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkMode(true)}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Select
                    </Button>
                    <Button 
                      onClick={getAISuggestions}
                      disabled={aiLoading}
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800 hover:from-purple-100 dark:hover:from-purple-900/30"
                    >
                      {aiLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent mr-2" />
                      ) : (
                        <Brain className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                      )}
                      AI Suggest
                    </Button>
                    <Button 
                      onClick={() => setShowNewTask(true)} 
                      size="sm"
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBulkMode(false)
                        setSelectedTasks(new Set())
                      }}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Enhanced Search and Filters */}
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tasks, categories, or descriptions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-emerald-500 dark:focus:border-emerald-400"
                    />
                  </div>
                  
                  {/* Status Filters */}
                  <div className="flex items-center gap-2">
                    {[
                      { key: 'all', label: 'All', icon: Circle },
                      { key: 'pending', label: 'Pending', icon: Clock },
                      { key: 'completed', label: 'Completed', icon: CheckCircle2 }
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
                
                {/* Task Count and Quick Stats */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{filteredTasks.filter(t => t.status === 'COMPLETED').length} completed</span>
                    {filteredTasks.filter(t => t.aiSuggested).length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                          {filteredTasks.filter(t => t.aiSuggested).length} AI suggested
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
            <div className={'grid gap-4 ' + (viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')}>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => {}}
                    onDelete={() => {}}
                    viewMode={viewMode}
                  />
                ))
              ) : (
                <div className="col-span-full">
                  <EmptyState 
                    title={filter === 'completed' ? 'No completed tasks yet' : 'No tasks found'}
                    message={filter === 'completed' 
                      ? 'Complete some tasks to see them here.' 
                      : 'Create your first task to get started!'}
                    onAction={() => setShowNewTask(true)}
                    actionLabel="Add Task"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI-Powered Productivity Insights */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysisLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/50 dark:bg-white/10 animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : productivityAnalysis ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-white/50 dark:bg-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUpIcon className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">Productivity Score: {productivityAnalysis.score}/100</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{productivityAnalysis.analysis}</p>
                    </div>
                    
                    {productivityAnalysis.recommendations?.map((rec: string, index: number) => (
                      <div key={index} className="p-3 rounded-lg bg-white/50 dark:bg-white/10">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Recommendation</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{rec}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Brain className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm text-blue-600 dark:text-blue-400">AI insights will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI-Powered Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={getAISuggestions}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                  Generate AI Suggestions
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={getProductivityAnalysis}
                  disabled={analysisLoading}
                >
                  {analysisLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent mr-2" />
                  ) : (
                    <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
                  )}
                  Analyze Productivity
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Compass className="h-4 w-4 mr-2 text-green-600" />
                  Focus Session
                </Button>
              </CardContent>
            </Card>

            {/* Prayer Times Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">🕌 Prayer Times</h2>
                    {locationLoading ? (
                      <div className="text-white/80 flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        Getting your location...
                      </div>
                    ) : location ? (
                      <p className="text-white/80">📍 {location.city}, {location.country}</p>
                    ) : locationError ? (
                      <div className="text-white/80 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{locationError}</span>
                      </div>
                    ) : (
                      <p className="text-white/80">📍 Default Location</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                      <div className="text-xs text-white/80">Qibla</div>
                      <div className="text-lg font-bold text-white">🧭 {qiblaDirection}°</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                {locationLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading prayer times...</p>
                    </div>
                  </div>
                ) : prayerTimes.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {prayerTimes.filter(prayer => prayer.name !== 'Sunrise').map((prayer, index) => (
                      <PrayerTimeCard 
                        key={prayer.name}
                        prayer={prayer}
                        isNext={prayer.name === nextPrayer?.name}
                        timeUntil={prayer.nextPrayerIn}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400 mb-4">
                      <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Unable to load prayer times</p>
                      <p className="text-sm">Check your internet connection and try again</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
