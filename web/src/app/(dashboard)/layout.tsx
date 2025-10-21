'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  LogOut,
  Home,
  Activity,
  Sparkles,
  Timer,
  Calendar,
  BarChart3,
  BookHeart,
  BookOpen,
  Settings,
  User,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  Compass,
  Zap,
  Shield,
  Heart,
  Moon,
  Sun,
  Camera,
  Edit3,
  Globe,
  Palette
} from 'lucide-react'
import AISmartSearch from '@/app/(dashboard)/components/AISmartSearch'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signOut } from 'next-auth/react'
import { getGreeting } from '@/lib/utils'
import { useTheme } from '@/components/theme-provider'
import { getThemeClass } from '@/lib/theme-config'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    }
    return false
  })
  const [isMobile, setIsMobile] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [checkedPassword, setCheckedPassword] = useState(false)
  const [redirectedToSetPassword, setRedirectedToSetPassword] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [notifications, setNotifications] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationsList, setNotificationsList] = useState<Array<{
    id: string
    title: string
    message: string
    timestamp: string
    read: boolean
    type: string
  }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSmartSearch, setShowSmartSearch] = useState(false)

  // Notification functions
  const markNotificationAsRead = (notificationId: string) => {
    setNotificationsList(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
    const notification = notificationsList.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      setNotifications(prev => Math.max(0, prev - 1))
    }
  }

  const markAllNotificationsAsRead = () => {
    setNotificationsList(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    setNotifications(0)
  }

  const deleteNotification = (notificationId: string) => {
    setNotificationsList(prev => 
      prev.filter(notif => notif.id !== notificationId)
    )
    const notification = notificationsList.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      setNotifications(prev => Math.max(0, prev - 1))
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task': return Target
      case 'goal': return Sparkles 
      case 'prayer': return BookHeart
      default: return Bell
    }
  }

  const formatNotificationTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return (diffInMinutes) + 'm ago'
    if (diffInMinutes < 1440) return (Math.floor(diffInMinutes / 60)) + 'h ago'
    return (Math.floor(diffInMinutes / 1440)) + 'd ago'
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    } else if (status === 'authenticated' && session?.user?.email) {
      // Check if user needs to set password (Google signup users)
      const checkUserPassword = async () => {
        try {
          const response = await fetch('/api/auth/check-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: session.user.email }),
          })
          
          const data = await response.json()
          
          // Only redirect to set-password if:
          // 1. User doesn't have a password AND
          // 2. They're not already on the set-password page AND
          // 3. They haven't been redirected to set-password in this session
          if (!data.hasPassword && pathname !== '/set-password' && !redirectedToSetPassword) {
            setRedirectedToSetPassword(true)
            router.push('/set-password')
          } else {
            setCheckedPassword(true)
          }
        } catch (error) {
          console.error('Error checking user password:', error)
          setCheckedPassword(true) // Continue anyway if check fails
        }
      }
      
      checkUserPassword()
    }
  }, [status, router, session, pathname, redirectedToSetPassword])

  // Mobile detection and responsive sidebar handling
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 1024
      setIsMobile(isMobileView)

      // Set initial sidebar state based on saved preference or screen size
      const saved = localStorage.getItem('sidebar-open')
      if (saved !== null) {
        setSidebarOpen(JSON.parse(saved))
      } else {
        setSidebarOpen(!isMobileView) // Open on desktop, closed on mobile
      }
    }

    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024
      setIsMobile(isMobileView)

      // Only auto-close on mobile if transitioning from desktop to mobile
      if (isMobileView && window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Persist sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen))
    }
  }, [sidebarOpen])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [pathname, isMobile])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen((prev: boolean) => !prev)
      }
      // Escape to close sidebar on mobile
      if (e.key === 'Escape' && isMobile && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [isMobile, sidebarOpen])

  // Swipe gesture handlers for mobile sidebar
  const minSwipeDistance = 50
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isMobile) {
      if (isRightSwipe && !sidebarOpen) {
        // Swipe right to open sidebar (only from left edge)
        if (touchStart < 50) {
          setSidebarOpen(true)
        }
      } else if (isLeftSwipe && sidebarOpen) {
        // Swipe left to close sidebar
        setSidebarOpen(false)
      }
    }
  }

  if (status === 'loading' || (status === 'authenticated' && !checkedPassword)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-950 dark:via-emerald-950/20 dark:to-teal-950/20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full"
        />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const navigationItems = [
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
      path: '/habits',
      icon: Target,
      label: 'Habits',
      description: 'Build positive habits',
      color: 'from-emerald-500 to-teal-500'
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
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      description: 'Preferences & profile',
      color: 'from-slate-500 to-gray-500'
    },
  ]

  const userMenuItems = [
    { icon: User, label: 'Profile Settings', action: () => router.push('/settings') },
    { icon: Settings, label: 'Preferences', action: () => router.push('/settings') },
    { icon: Bell, label: 'Notifications', action: () => {} },
    { icon: Shield, label: 'Privacy', action: () => {} },
    { icon: LogOut, label: 'Sign Out', action: () => signOut({ callbackUrl: '/' }) },
  ]

  const themeClass = getThemeClass(pathname)

  return (
    <div 
      className="min-h-screen text-foreground bg-gradient-to-br from-background/80 via-background to-background dark:from-gray-950 dark:via-gray-900 dark:to-gray-900"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Enhanced Animated Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ 
          x: sidebarOpen ? 0 : -300,
          width: sidebarCollapsed ? '80px' : '280px'
        }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
        className="fixed left-0 top-0 h-full glass-panel border-r border-border/50 shadow-2xl text-foreground z-50 flex flex-col w-full md:w-auto max-w-xs md:max-w-none backdrop-blur-xl"
        id="sidebar-navigation"
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!sidebarOpen}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border/60 bg-gradient-to-r from-background/50 to-emerald-50/30 dark:from-gray-800/50 dark:to-gray-700/50">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    Daily Priority
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium">
                    Islamic Productivity Hub
                  </p>
                </div>
              </motion.div>
            )}
            {sidebarCollapsed && (
              <div className="flex justify-center w-full">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-9 w-9 hover:bg-accent rounded-xl transition-colors"
            >
              <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-b border-border/50">
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={`w-full p-3 h-auto justify-start hover:bg-accent rounded-xl ui-element ${sidebarCollapsed ? 'px-3' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-emerald-200 dark:border-emerald-800">
                    <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background dark:border-gray-900"></div>
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground truncate">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getGreeting()} 👋
                    </p>
                  </div>
               )}
              </div>
            </Button>

            {/* Enhanced Profile Dropdown */}
            <AnimatePresence>
              {showProfileDropdown && !sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full left-0 right-0 mt-2 bg-popover backdrop-blur-xl rounded-2xl shadow-2xl border border-border overflow-hidden z-[100]"
                  style={{ zIndex: 100 }}
                >
                  {/* User Info Header */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-emerald-200 dark:ring-emerald-800">
                        <AvatarImage src={session?.user?.image || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-semibold">
                          {session?.user?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {session?.user?.name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session?.user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    {userMenuItems.map((item, index) => {
                      const Icon = item.icon
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Button
                            variant="ghost"
                            onClick={() => {
                              item.action()
                              setShowProfileDropdown(false) // Close dropdown after action
                            }}
                            className="w-full justify-start px-3 py-2.5 h-auto hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-foreground hover:text-emerald-600 dark:hover:text-emerald-300 rounded-xl transition-all duration-200 group ui-element"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent to-muted dark:from-gray-700 dark:to-gray-800 group-hover:from-emerald-100 group-hover:to-emerald-200 dark:group-hover:from-emerald-900/50 dark:group-hover:to-emerald-800/50 transition-all duration-200">
                                <Icon className="h-3.5 w-3.5 text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-300" />
                              </div>
                              <span className="font-medium text-sm">{item.label}</span>
                            </div>
                          </Button>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Sign Out Button */}
                  <div className="p-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        signOut()
                        setShowProfileDropdown(false) // Close dropdown after action
                      }}
                      className="w-full justify-start px-3 py-2.5 h-auto hover:bg-red-50 dark:hover:bg-red-900/20 text-foreground hover:text-red-600 dark:hover:text-red-300 rounded-xl transition-all duration-200 group ui-element"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-accent to-muted dark:from-gray-700 dark:to-gray-800 group-hover:from-red-100 group-hover:to-red-200 dark:group-hover:from-red-900/50 dark:group-hover:to-red-800/50 transition-all duration-200">
                          <LogOut className="h-3.5 w-3.5 text-foreground group-hover:text-red-600 dark:group-hover:text-red-300" />
                        </div>
                        <span className="font-medium text-sm">Sign Out</span>
                      </div>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Enhanced Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" role="menu" aria-label="Navigation menu">
          {navigationItems.map((item, index) => {
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
                  onClick={() => router.push(item.path)}
                  className={`w-full justify-start p-4 md:p-3 h-auto min-h-[48px] md:min-h-auto rounded-2xl transition-all duration-300 group relative overflow-hidden ui-element ${
                    isActive
                      ? `bg-gradient-to-r text-white shadow-xl shadow-emerald-500/25 ${item.color}`
                      : 'hover:bg-accent hover:shadow-lg hover:shadow-gray-200/30 dark:hover:shadow-gray-900/30 text-foreground backdrop-blur-sm'
                  } ${sidebarCollapsed ? 'px-3' : ''}`}
                  aria-label={`Navigate to ${item.label} - ${item.description}`}
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
                    <div className={`p-2 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-white/20 backdrop-blur-sm' 
                        : 'bg-gradient-to-br from-accent to-muted dark:from-gray-700 dark:to-gray-800 group-hover:from-emerald-100 group-hover:to-emerald-200 dark:group-hover:from-emerald-900/50 dark:group-hover:to-emerald-800/50'
                    }`}>
                      <Icon className={`h-4 w-4 transition-all duration-300 ${
                        isActive 
                          ? 'text-white' 
                          : 'text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-300'
                      }`} />
                    </div>
                    
                    {!sidebarCollapsed && (
                      <div className="flex-1 text-left">
                        <p className={`font-semibold text-sm transition-colors duration-300 ${
                          isActive 
                            ? 'text-white' 
                            : 'text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-300'
                        }`}>
                          {item.label}
                        </p>
                        <p className={`text-xs transition-colors duration-300 ${
                          isActive 
                            ? 'text-white/80' 
                            : 'text-muted-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                        }`}>
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
        <div className="p-4 border-t border-border/50">
          {!sidebarCollapsed && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Daily Priority v1.0
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Enhanced Mobile Sidebar Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-popover/95 backdrop-blur-xl shadow-xl shadow-gray-900/10 dark:shadow-gray-950/20 rounded-xl hover:scale-105 transition-all duration-200 border border-border"
        aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={sidebarOpen}
        aria-controls="sidebar-navigation"
      >
        <motion.div
          initial={false}
          animate={{ rotate: sidebarOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {sidebarOpen ? (
            <X className="h-5 w-5 text-foreground" />
          ) : (
            <Menu className="h-5 w-5 text-foreground" />
          )}
        </motion.div>
      </Button>

      {/* Main Content Area */}
      <div className={`transition-all duration-500 ease-in-out ${
        isMobile 
          ? 'ml-0' 
          : sidebarOpen 
            ? sidebarCollapsed ? 'ml-20' : 'ml-[300px]' 
            : 'ml-0'
      }`}>
        {/* Enhanced Top Bar */}
        <header className="sticky top-0 z-30 bg-popover/90 backdrop-blur-xl border-b border-border/40 shadow-md shadow-gray-900/5 dark:shadow-gray-950/20">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSmartSearch(true)}
                  placeholder="Search anything or ask AI for suggestions..."
                  className="pl-10 pr-4 py-2 w-64 sm:w-80 lg:w-96 bg-muted border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-foreground placeholder:text-muted-foreground transition-all duration-200 hover:bg-accent cursor-pointer"
                />
                <AISmartSearch 
                  isOpen={showSmartSearch}
                  onClose={() => setShowSmartSearch(false)}
                  onNavigate={(path) => {
                    router.push(path)
                    setShowSmartSearch(false)
                  }}
                  session={session}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Theme Toggle - Always Visible */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="bg-muted hover:bg-accent rounded-xl transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5 text-foreground transition-transform duration-200 hover:rotate-12" />
                ) : (
                  <Sun className="h-5 w-5 text-foreground transition-transform duration-200 hover:rotate-12" />
                )}
              </Button>

              {/* Notifications */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative hover:bg-accent rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <Bell className="h-5 w-5 text-foreground transition-transform duration-200 hover:rotate-12" />
                  {notifications > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center shadow-lg"
                    >
                      {notifications}
                    </motion.span>
                  )}
                </Button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-popover/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border overflow-hidden z-50"
                    >
                      {/* Header */}
                      <div className="p-4 border-b border-border/50 bg-gradient-to-r from-background/50 to-emerald-50/30 dark:from-gray-800/50 dark:to-gray-700/50">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-foreground">Notifications</h3>
                          <div className="flex items-center gap-2">
                            {notifications > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllNotificationsAsRead}
                                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
                              >
                                Mark all read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowNotifications(false)}
                              className="h-6 w-6"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Notifications List */}
                      <div className="max-h-96 overflow-y-auto">
                        {notificationsList.length > 0 ? (
                          notificationsList.map((notification) => {
                            const IconComponent = getNotificationIcon(notification.type)
                            return (
                              <motion.div
                                key={notification.id}
                                whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
                                className={`p-4 border-b border-border/50 cursor-pointer transition-colors ${!notification.read ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''}`}
                                onClick={() => markNotificationAsRead(notification.id)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-full ${
                                    notification.type === 'task' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                    notification.type === 'goal' ? 'bg-purple-100 dark:bg-purple-900/30' :
                                    notification.type === 'prayer' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                    'bg-muted'
                                  }`}>
                                    <IconComponent className={`h-4 w-4 ${
                                      notification.type === 'task' ? 'text-blue-600 dark:text-blue-400' :
                                      notification.type === 'goal' ? 'text-purple-600 dark:text-purple-400' :
                                      notification.type === 'prayer' ? 'text-emerald-600 dark:text-emerald-400' :
                                      'text-foreground'
                                    }`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className={`text-sm font-medium ${
                                        !notification.read ? 'text-foreground' : 'text-muted-foreground'
                                      }`}>
                                        {notification.title}
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteNotification(notification.id)
                                        }}
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatNotificationTime(notification.timestamp)}
                                    </p>
                                  </div>
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1"></div>
                                  )}
                                </div>
                              </motion.div>
                            )
                          })
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No notifications yet</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Avatar - Mobile */}
              <div className="lg:hidden">
                <Avatar className="h-8 w-8 border-2 border-emerald-200 dark:border-emerald-800">
                  <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || 'User'} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Main Content */}
        <main className="min-h-screen bg-gradient-to-br from-background/30 via-background/30 to-background/30 dark:from-gray-950/30 dark:via-gray-900/30 dark:to-gray-950/30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-4 sm:p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Enhanced Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-gray-900/60 dark:bg-black/70 backdrop-blur-md z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  )
}
