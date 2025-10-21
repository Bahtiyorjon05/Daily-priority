'use client'

import { useState, useEffect } from 'react'
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
  Flame,
  Award,
  Trophy,
  Filter,
  Search,
  Grid3X3,
  List,
  User,
  Settings,
  Bell,
  Menu,
  Home,
  ChevronDown,
  Edit3,
  X,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import TaskCard from './TaskCard'
import StatCardEnhanced from './StatCardEnhanced'
import PrayerTimesSectionEnhanced from './PrayerTimesSectionEnhanced'
import NewTaskModalEnhanced from './NewTaskModalEnhanced'
import AISuggestionsModalEnhanced from './AISuggestionsModalEnhanced'
import LoadingState from './LoadingState'
import ErrorState from './ErrorState'
import EmptyState from './EmptyState'

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

interface PrayerTime {
  name: string
  arabicName: string
  time: string
  passed: boolean
  nextPrayerIn?: string
}

export default function DashboardEnhanced({ session }: { session: any }) {
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
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([])
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
  const [aiInsights, setAiInsights] = useState<any[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState(3)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
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
  }, [])

  const filteredTasks = tasks.filter(task => {
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

  const completionRate = stats.totalTasks > 0 ? (stats.tasksCompleted / stats.totalTasks) * 100 : 0
  const goalProgress = stats.weeklyGoals > 0 ? (stats.completedGoals / stats.weeklyGoals) * 100 : 0

  const handleCreateTask = (task: any) => {
    const newTask = {
      ...task,
      id: 'task-' + (Date.now()),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    }
    setTasks(prev => [newTask, ...prev])
    setShowNewTask(false)
    toast.success('Task created successfully!')
  }

  const handleAcceptSuggestion = (suggestion: Task) => {
    setTasks(prev => [suggestion, ...prev])
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
    toast.success('AI suggestion added as task!')
  }

  const handleAcceptAllSuggestions = (suggestions: Task[]) => {
    setTasks(prev => [...suggestions, ...prev])
    setAiSuggestions([])
    setShowAiSuggestions(false)
    toast.success('Added ' + (suggestions.length) + ' AI suggestions as tasks!')
  }

  const handleDismissSuggestion = (id: string) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== id))
  }

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED',
            completedAt: task.status === 'COMPLETED' ? undefined : new Date().toISOString()
          } 
        : task
    ))
    toast.success('Task updated!')
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
    toast.success('Task deleted!')
  }

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(filteredTasks.map(task => task.id)))
    }
  }

  const handleBulkComplete = () => {
    setTasks(prev => prev.map(task => 
      selectedTasks.has(task.id) 
        ? { ...task, status: 'COMPLETED', completedAt: new Date().toISOString() }
        : task
    ))
    setSelectedTasks(new Set())
    setBulkMode(false)
    toast.success((selectedTasks.size) + ' tasks completed!')
  }

  const handleBulkDelete = () => {
    if (!confirm('Are you sure you want to delete ' + (selectedTasks.size) + ' tasks?')) return
    
    setTasks(prev => prev.filter(task => !selectedTasks.has(task.id)))
    setSelectedTasks(new Set())
    setBulkMode(false)
    toast.success((selectedTasks.size) + ' tasks deleted!')
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <LoadingState message="Loading your dashboard..." size="lg" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Daily Priority
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>
              
              <div className="relative">
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profileImage || (session?.user as any)?.image || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4" />
                </Button>
                
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{session?.user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
                    </div>
                    <Button variant="ghost" className="w-full justify-start px-4 py-2 text-sm">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    <Button variant="ghost" className="w-full justify-start px-4 py-2 text-sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button variant="ghost" className="w-full justify-start px-4 py-2 text-sm text-red-600 dark:text-red-400">
                      <span>Sign Out</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Enhanced Sidebar */}
        <aside className={(sidebarOpen ? 'translate-x-0' : '-translate-x-full') + ' lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out'}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profileImage || (session?.user as any)?.image || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{session?.user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{getGreeting()}</p>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {[
                { path: '/dashboard', icon: Home, label: 'Dashboard', description: 'Overview & stats' },
                { path: '/prayers', icon: Target, label: 'Prayers', description: 'Prayer times & tracking' },
                { path: '/adhkar', icon: Target, label: 'Adhkar', description: 'Daily remembrance' },
                { path: '/focus', icon: Target, label: 'Focus', description: 'Pomodoro & deep work' },
                { path: '/calendar', icon: Target, label: 'Calendar', description: 'Schedule & events' },
                { path: '/goals', icon: Target, label: 'Goals', description: 'Track your progress' },
                { path: '/journal', icon: Target, label: 'Journal', description: 'Reflect & grow' },
                { path: '/analytics', icon: Target, label: 'Analytics', description: 'Insights & reports' },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="w-full justify-start px-3 py-2.5 h-auto rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
                        <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{item.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </nav>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Enhanced Welcome Header */}
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
                            <AvatarImage src={profileImage || (session?.user as any)?.image || ''} />
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
                          <p className="text-white/90">
                            Ready to make today productive? ✨
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

              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCardEnhanced 
                  title="Tasks Completed" 
                  value={stats.tasksCompleted} 
                  subtitle={'of ' + (stats.totalTasks) + ' total'} 
                  icon={CheckCircle2} 
                  color="blue"
                  progress={completionRate}
                  trend="up"
                  trendValue="+12%"
                />
                <StatCardEnhanced 
                  title="Productivity Score" 
                  value={(stats.productivityScore) + '%'} 
                  subtitle="Weekly average" 
                  icon={TrendingUp} 
                  color="emerald"
                  trend="up"
                  trendValue="+5%"
                />
                <StatCardEnhanced 
                  title="Weekly Goals" 
                  value={(stats.completedGoals) + '/' + (stats.weeklyGoals)} 
                  subtitle={(Math.round(goalProgress)) + '% complete'} 
                  icon={Target} 
                  color="purple"
                  trend="neutral"
                />
                <StatCardEnhanced 
                  title="Focus Time" 
                  value="3.2h" 
                  subtitle="Today's session" 
                  icon={Clock} 
                  color="amber"
                  trend="up"
                  trendValue="+0.5h"
                />
              </div>

              {/* Prayer Times Section */}
              <PrayerTimesSectionEnhanced
                prayerTimes={prayerTimes}
                nextPrayer={nextPrayer}
                location={location}
                locationLoading={locationLoading}
                locationError={locationError}
                qiblaDirection={qiblaDirection}
                onRefresh={() => {
                  setLocationLoading(true)
                  setTimeout(() => {
                    setLocationLoading(false)
                    toast.success('Prayer times refreshed!')
                  }, 1000)
                }}
              />

              {/* Quick Actions & Tasks */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Tasks Section */}
                <div className="xl:col-span-2 space-y-6">
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
                            onClick={() => setAiLoading(true)}
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
                            onClick={handleSelectAll}
                            className="hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            {selectedTasks.size === filteredTasks.length ? 'Deselect All' : 'Select All'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkComplete}
                            disabled={selectedTasks.size === 0}
                            className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Complete ({selectedTasks.size})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={selectedTasks.size === 0}
                            className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete ({selectedTasks.size})
                          </Button>
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
                          ].map((filterOption) => (
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
                              <filterOption.icon className="h-3 w-3 mr-1" />
                              {filterOption.label}
                            </Button>
                          ))}
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
                    <AnimatePresence>
                      {filteredTasks.length > 0 ? (
                        filteredTasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={handleToggleTask}
                            onDelete={handleDeleteTask}
                            onSelect={handleToggleTaskSelection}
                            isSelected={selectedTasks.has(task.id)}
                            bulkMode={bulkMode}
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
                    </AnimatePresence>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Target className="h-4 w-4 mr-2 text-green-600" />
                        Start Prayer Time
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Clock className="h-4 w-4 mr-2 text-orange-600" />
                        Begin Focus Session
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
                        View Analytics
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Recent Achievements */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Achievements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                        <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                          <Star className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-amber-900 dark:text-amber-100">First Week Streak!</p>
                          <p className="text-sm text-amber-700 dark:text-amber-300">7 days of consistent progress</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                        <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                          <Target className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-emerald-900 dark:text-emerald-100">Goal Achiever</p>
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">Completed 3 weekly goals</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Advanced Analytics */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Analytics Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Productivity Trend */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Weekly Productivity</span>
                          <span className="text-sm text-blue-600 dark:text-blue-400">+12%</span>
                        </div>
                        <div className="w-full bg-blue-200 dark:bg-blue-900/30 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: (stats.productivityScore) + '%' }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                          <span>Mon</span>
                          <span>Tue</span>
                          <span>Wed</span>
                          <span>Thu</span>
                          <span>Fri</span>
                          <span>Sat</span>
                          <span>Sun</span>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-blue-900/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                            {Math.round(completionRate)}%
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">Completion Rate</div>
                        </div>
                        <div className="bg-white dark:bg-blue-900/20 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                            {Math.round((stats.tasksCompleted / Math.max(1, stats.streak)) * 10) / 10}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400">Tasks/Day</div>
                        </div>
                      </div>

                      {/* Quick Chart Visualization */}
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">This Week</span>
                        <div className="flex items-end gap-1 h-16">
                          {[3, 5, 2, 7, 4, 6, 3].map((value, index) => (
                            <div key={index} className="flex-1 bg-gradient-to-t from-blue-500 to-indigo-500 rounded-t opacity-70 hover:opacity-100 transition-opacity" style={{ height: ((value / 7) * 100) + '%' }} />
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                          <span>M</span>
                          <span>T</span>
                          <span>W</span>
                          <span>T</span>
                          <span>F</span>
                          <span>S</span>
                          <span>S</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <NewTaskModalEnhanced
        isOpen={showNewTask}
        onClose={() => setShowNewTask(false)}
        onCreateTask={handleCreateTask}
      />
      
      <AISuggestionsModalEnhanced
        isOpen={showAiSuggestions}
        onClose={() => setShowAiSuggestions(false)}
        suggestions={aiSuggestions}
        onAcceptSuggestion={handleAcceptSuggestion}
        onAcceptAll={handleAcceptAllSuggestions}
        onDismissSuggestion={handleDismissSuggestion}
      />
    </div>
  )
}
