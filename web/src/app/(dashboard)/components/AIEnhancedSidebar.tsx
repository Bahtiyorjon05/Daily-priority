'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Home,
  Activity,
  Sparkles,
  Timer,
  Calendar,
  Target,
  BookHeart,
  BarChart3,
  Brain,
  Zap,
  ChevronRight,
  Star,
  TrendingUp,
  Lightbulb,
  Compass
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getGreeting } from '@/lib/utils'

interface AIEnhancedSidebarProps {
  session: any
  sidebarCollapsed: boolean
  sidebarOpen: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  onNavigate: (path: string) => void
  pathname: string
}

export default function AIEnhancedSidebar({
  session,
  sidebarCollapsed,
  sidebarOpen,
  setSidebarCollapsed,
  onNavigate,
  pathname
}: AIEnhancedSidebarProps) {
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // AI-powered navigation suggestions
  useEffect(() => {
    const fetchAISuggestions = async () => {
      if (!session?.user?.id) return
      
      setLoadingSuggestions(true)
      try {
        // In a real implementation, this would call the AI service
        // For now, we'll simulate AI suggestions
        const mockSuggestions = [
          {
            id: 'focus-suggestion',
            title: 'Enhance Focus',
            description: 'Based on your productivity patterns',
            icon: Zap,
            path: '/focus',
            priority: 'high',
            reason: 'You\'ve been most productive during focus sessions'
          },
          {
            id: 'goal-suggestion',
            title: 'Track Goals',
            description: 'Update your progress',
            icon: Target,
            path: '/goals',
            priority: 'medium',
            reason: 'You have 3 active goals that need attention'
          },
          {
            id: 'analytics-suggestion',
            title: 'View Insights',
            description: 'See your productivity trends',
            icon: BarChart3,
            path: '/analytics',
            priority: 'low',
            reason: 'Your productivity score increased by 12% this week'
          }
        ]
        
        // Only show top 2 suggestions
        setAiSuggestions(mockSuggestions.slice(0, 2))
      } catch (error) {
        console.error('Failed to fetch AI suggestions:', error)
      } finally {
        setLoadingSuggestions(false)
      }
    }

    fetchAISuggestions()
  }, [session?.user?.id])

  const mainNavigationItems = [
    { 
      path: '/dashboard', 
      icon: Home, 
      label: 'Dashboard',
      description: 'Overview & stats',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      path: '/prayers', 
      icon: Activity, 
      label: 'Prayers',
      description: 'Prayer times & tracking',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      path: '/adhkar', 
      icon: Sparkles, 
      label: 'Adhkar',
      description: 'Daily remembrance',
      color: 'from-purple-500 to-violet-500'
    },
    { 
      path: '/focus', 
      icon: Timer, 
      label: 'Focus',
      description: 'Pomodoro & deep work',
      color: 'from-orange-500 to-red-500'
    },
    { 
      path: '/calendar', 
      icon: Calendar, 
      label: 'Calendar',
      description: 'Schedule & events',
      color: 'from-teal-500 to-cyan-500'
    },
    { 
      path: '/goals', 
      icon: Target, 
      label: 'Goals',
      description: 'Track your progress',
      color: 'from-amber-500 to-yellow-500'
    },
    { 
      path: '/journal', 
      icon: BookHeart, 
      label: 'Journal',
      description: 'Reflect & grow',
      color: 'from-pink-500 to-rose-500'
    },
    { 
      path: '/analytics', 
      icon: BarChart3, 
      label: 'Analytics',
      description: 'Insights & reports',
      color: 'from-gray-500 to-slate-500'
    },
  ]

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{
        x: sidebarOpen ? 0 : -300,
        width: sidebarCollapsed ? '80px' : '280px'
      }}
      transition={{ type: "spring", damping: 25, stiffness: 400 }}
      className="fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-2xl z-50 flex flex-col w-full md:w-auto max-w-xs md:max-w-none"
      id="sidebar-navigation"
      role="navigation"
      aria-label="Main navigation"
      aria-hidden={!sidebarOpen}
    >
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-emerald-50/30 dark:from-gray-800 dark:to-gray-800">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Daily Priority AI
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Smart Productivity Hub
                </p>
              </div>
            </motion.div>
          )}
          {sidebarCollapsed && (
            <div className="flex justify-center w-full">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-9 w-9 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ChevronRight className={'h-4 w-4 transition-transform duration-300 ' + (sidebarCollapsed ? 'rotate-180' : '')} />
          </Button>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Button
            variant="ghost"
            className={'w-full p-3 h-auto justify-start hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl ' + (sidebarCollapsed ? 'px-3' : '')}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-emerald-200 dark:border-emerald-800">
                  <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {getGreeting()} 👋
                  </p>
                </div>
              )}
            </div>
          </Button>
        </div>
      </div>

      {/* AI-Powered Smart Suggestions */}
      {!sidebarCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">AI Suggestions</h3>
          </div>
          
          {loadingSuggestions ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse">
                  <div className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
                  <div className="flex-1">
                    <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {aiSuggestions.map((suggestion) => {
                const Icon = suggestion.icon
                return (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => onNavigate(suggestion.path)}
                      className="w-full justify-start p-3 h-auto rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 group-hover:from-purple-200 group-hover:to-pink-200 dark:group-hover:from-purple-800/30 dark:group-hover:to-pink-800/30">
                          <Icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">{suggestion.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{suggestion.description}</p>
                        </div>
                        {suggestion.priority === 'high' && (
                          <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <Star className="h-3 w-3 text-amber-500" />
                          </div>
                        )}
                      </div>
                    </Button>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto" role="menu" aria-label="Navigation menu">
        {mainNavigationItems.map((item, index) => {
          const Icon = item.icon
          const isActive = pathname === item.path
          
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="ghost"
                onClick={() => onNavigate(item.path)}
                className={'w-full justify-start p-4 md:p-3 h-auto min-h-[48px] md:min-h-auto rounded-2xl transition-all duration-300 group relative overflow-hidden ' + (isActive
                    ? 'bg-gradient-to-r text-white shadow-xl shadow-emerald-500/25 ' + item.color
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-lg hover:shadow-gray-200/30 dark:hover:shadow-gray-900/30 text-gray-700 dark:text-gray-300 backdrop-blur-sm') + ' ' + (sidebarCollapsed ? 'px-3' : '')}
                aria-label={'Navigate to ' + (item.label) + ' - ' + (item.description)}
                aria-current={isActive ? 'page' : undefined}
                role="menuitem"
              >
                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <div className="flex items-center gap-3 relative z-10">
                  {/* Enhanced Icon Container */}
                  <div className={'p-2 rounded-xl transition-all duration-300 ' + (isActive 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 group-hover:from-emerald-100 group-hover:to-emerald-200 dark:group-hover:from-emerald-900/50 dark:group-hover:to-emerald-800/50')}>
                    <Icon className={'h-4 w-4 transition-all duration-300 ' + (isActive 
                        ? 'text-white' 
                        : 'text-gray-600 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400')} />
                  </div>
                  
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <p className={'font-semibold text-sm transition-colors duration-300 ' + (isActive 
                          ? 'text-white' 
                          : 'text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400')}>
                        {item.label}
                      </p>
                      <p className={'text-xs transition-colors duration-300 ' + (isActive 
                          ? 'text-white/80' 
                          : 'text-gray-500 dark:text-gray-300 group-hover:text-emerald-500 dark:group-hover:text-emerald-400')}>
                        {item.description}
                      </p>
                    </div>
                  )}
                  
                  {/* Right arrow for active item */}
                  {isActive && !sidebarCollapsed && (
                    <ChevronRight className="h-4 w-4 text-white/80" />
                  )}
                </div>
                
                {/* Subtle glow effect for active item */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r opacity-10 rounded-2xl blur-sm" />
                )}
              </Button>
            </motion.div>
          )
        })}
      </nav>

      {/* Enhanced Sidebar Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!sidebarCollapsed && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                AI-Powered v2.0
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
