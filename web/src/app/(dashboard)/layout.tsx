'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
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
  Palette,
  CheckCircle2,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { signOut } from 'next-auth/react'
import { getGreeting } from '@/lib/utils'
import { useTheme } from '@/components/theme-provider'
import { getThemeClass } from '@/lib/theme-config'
import Logo from '@/components/shared/Logo'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useUserProfile } from '@/hooks/useUserProfile'

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const { profile } = useUserProfile()
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
  const previousIsMobileRef = useRef<boolean>(false)
  const isCollapsed = sidebarCollapsed && !isMobile
  const effectiveSidebarOpen = isMobile ? sidebarOpen : true
  const sidebarX = (() => {
    if (isMobile) {
      return effectiveSidebarOpen ? 0 : -300
    }
    if (isCollapsed) {
      return -280
    }
    return 0
  })()
  const isSidebarVisible = isMobile ? effectiveSidebarOpen : true

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
      previousIsMobileRef.current = isMobileView

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
      const previousIsMobile = previousIsMobileRef.current

      // Handle transition between mobile and desktop
      if (isMobileView !== previousIsMobile) {
        setIsMobile(isMobileView)

        if (isMobileView) {
          // Transitioning to mobile - close sidebar
          setSidebarOpen(false)
        } else {
          // Transitioning to desktop - open sidebar (restore state or default to open)
          const saved = localStorage.getItem('sidebar-open')
          if (saved !== null) {
            setSidebarOpen(JSON.parse(saved))
          } else {
            setSidebarOpen(true) // Default to open on desktop
          }
        }
        previousIsMobileRef.current = isMobileView
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
      // Escape to close dropdowns
      if (e.key === 'Escape') {
        setShowProfileDropdown(false)
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [isMobile, sidebarOpen])

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-dropdown]')) {
        setShowProfileDropdown(false)
      }
    }

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileDropdown])

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
        <LoadingSpinner size="xl" message="Loading your dashboard..." />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const navigationItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'Overview & stats',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      path: '/analytics',
      icon: TrendingUp,
      label: 'Analytics',
      description: 'Insights & reports',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      path: '/prayers',
      icon: Heart,
      label: 'Prayers',
      description: 'Prayer times & tracking',
      color: 'from-emerald-500 to-teal-500'
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
      icon: Zap,
      label: 'Focus',
      description: 'Pomodoro & deep work',
      color: 'from-orange-500 to-amber-500'
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
      icon: CheckCircle2,
      label: 'Habits',
      description: 'Build positive habits',
      color: 'from-green-500 to-emerald-500'
    },
    {
      path: '/journal',
      icon: BookHeart,
      label: 'Journal',
      description: 'Reflect & grow',
      color: 'from-pink-500 to-rose-500'
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
    { icon: Settings, label: 'Preferences', action: () => router.push('/settings?tab=appearance') },
    { icon: Shield, label: 'Privacy & Security', action: () => router.push('/settings?tab=security') },
  ]

  // Get theme-specific colors for each page
  const getPageTheme = (path: string) => {
    const themes: Record<string, { bg: string, bgDark: string, hover: string, hoverDark: string, text: string, textDark: string, border: string, borderDark: string, shadow: string }> = {
      '/dashboard': {
        bg: 'bg-blue-50/50',
        bgDark: 'dark:bg-blue-950/20',
        hover: 'hover:bg-blue-100/70',
        hoverDark: 'dark:hover:bg-blue-950/30',
        text: 'text-blue-700',
        textDark: 'dark:text-blue-300',
        border: 'border-l-blue-500',
        borderDark: 'dark:border-l-blue-400',
        shadow: 'shadow-blue-500/20'
      },
      '/prayers': {
        bg: 'bg-emerald-50/50',
        bgDark: 'dark:bg-emerald-950/20',
        hover: 'hover:bg-emerald-100/70',
        hoverDark: 'dark:hover:bg-emerald-950/30',
        text: 'text-emerald-700',
        textDark: 'dark:text-emerald-300',
        border: 'border-l-emerald-500',
        borderDark: 'dark:border-l-emerald-400',
        shadow: 'shadow-emerald-500/20'
      },
      '/adhkar': {
        bg: 'bg-purple-50/50',
        bgDark: 'dark:bg-purple-950/20',
        hover: 'hover:bg-purple-100/70',
        hoverDark: 'dark:hover:bg-purple-950/30',
        text: 'text-purple-700',
        textDark: 'dark:text-purple-300',
        border: 'border-l-purple-500',
        borderDark: 'dark:border-l-purple-400',
        shadow: 'shadow-purple-500/20'
      },
      '/focus': {
        bg: 'bg-orange-50/50',
        bgDark: 'dark:bg-orange-950/20',
        hover: 'hover:bg-orange-100/70',
        hoverDark: 'dark:hover:bg-orange-950/30',
        text: 'text-orange-700',
        textDark: 'dark:text-orange-300',
        border: 'border-l-orange-500',
        borderDark: 'dark:border-l-orange-400',
        shadow: 'shadow-orange-500/20'
      },
      '/calendar': {
        bg: 'bg-teal-50/50',
        bgDark: 'dark:bg-teal-950/20',
        hover: 'hover:bg-teal-100/70',
        hoverDark: 'dark:hover:bg-teal-950/30',
        text: 'text-teal-700',
        textDark: 'dark:text-teal-300',
        border: 'border-l-teal-500',
        borderDark: 'dark:border-l-teal-400',
        shadow: 'shadow-teal-500/20'
      },
      '/goals': {
        bg: 'bg-amber-50/50',
        bgDark: 'dark:bg-amber-950/20',
        hover: 'hover:bg-amber-100/70',
        hoverDark: 'dark:hover:bg-amber-950/30',
        text: 'text-amber-700',
        textDark: 'dark:text-amber-300',
        border: 'border-l-amber-500',
        borderDark: 'dark:border-l-amber-400',
        shadow: 'shadow-amber-500/20'
      },
      '/habits': {
        bg: 'bg-green-50/50',
        bgDark: 'dark:bg-green-950/20',
        hover: 'hover:bg-green-100/70',
        hoverDark: 'dark:hover:bg-green-950/30',
        text: 'text-green-700',
        textDark: 'dark:text-green-300',
        border: 'border-l-green-500',
        borderDark: 'dark:border-l-green-400',
        shadow: 'shadow-green-500/20'
      },
      '/journal': {
        bg: 'bg-pink-50/50',
        bgDark: 'dark:bg-pink-950/20',
        hover: 'hover:bg-pink-100/70',
        hoverDark: 'dark:hover:bg-pink-950/30',
        text: 'text-pink-700',
        textDark: 'dark:text-pink-300',
        border: 'border-l-pink-500',
        borderDark: 'dark:border-l-pink-400',
        shadow: 'shadow-pink-500/20'
      },
      '/analytics': {
        bg: 'bg-gray-50/50',
        bgDark: 'dark:bg-gray-800/20',
        hover: 'hover:bg-gray-100/70',
        hoverDark: 'dark:hover:bg-gray-800/30',
        text: 'text-gray-700',
        textDark: 'dark:text-gray-300',
        border: 'border-l-gray-500',
        borderDark: 'dark:border-l-gray-400',
        shadow: 'shadow-gray-500/20'
      },
      '/settings': {
        bg: 'bg-slate-50/50',
        bgDark: 'dark:bg-slate-950/20',
        hover: 'hover:bg-slate-100/70',
        hoverDark: 'dark:hover:bg-slate-950/30',
        text: 'text-slate-700',
        textDark: 'dark:text-slate-300',
        border: 'border-l-slate-500',
        borderDark: 'dark:border-l-slate-400',
        shadow: 'shadow-slate-500/20'
      },
    }
    return themes[path] || themes['/dashboard']
  }

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
          x: sidebarX,
        }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
        className="fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r-2 border-gray-200 dark:border-gray-700 shadow-xl shadow-gray-200/60 dark:shadow-black/20 text-foreground z-50 flex flex-col w-[280px]"
        id="sidebar-navigation"
        role="navigation"
        aria-label="Main navigation"
        aria-hidden={!isSidebarVisible}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b-2 border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-emerald-50/50 dark:from-gray-800 dark:to-emerald-900/20">
          <div className="flex items-center justify-between">
            {!isCollapsed ? (
              <Logo size="lg" showText={true} showSubtext={true} animate={true} />
            ) : (
              <div className="flex justify-center w-full">
                <Logo size="md" showText={false} animate={true} />
              </div>
            )}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-9 w-9 hover:bg-accent rounded-xl transition-all duration-200 hover:scale-105 hover:rotate-90"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
              </Button>
            )}
          </div>
        </div>


        {/* Enhanced Navigation Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" role="menu" aria-label="Navigation menu">
          {navigationItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            const pageTheme = getPageTheme(item.path)

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
                  className={`w-full justify-start p-4 md:p-3 h-auto min-h-[48px] md:min-h-auto rounded-2xl transition-all duration-300 group relative overflow-hidden ui-element ${pageTheme.bg} ${pageTheme.bgDark} ${pageTheme.hover} ${pageTheme.hoverDark} ${pageTheme.border} ${pageTheme.borderDark} shadow-md ${
                    isActive ? 'border-l-4' : 'border-l-2 hover:border-l-4'
                  } ${isCollapsed ? 'px-3' : ''}`}
                  aria-label={`Navigate to ${item.label} - ${item.description}`}
                  aria-current={isActive ? 'page' : undefined}
                  role="menuitem"
                >

                  <div className="flex items-center gap-3 relative z-10">
                    {/* Enhanced Icon Container */}
                    <div className={`p-2 rounded-xl transition-all duration-300 shadow-md bg-gradient-to-br ${item.color}`}>
                      <Icon className="h-4 w-4 transition-all duration-300 text-white" />
                    </div>

                    {!isCollapsed && (
                      <div className="flex-1 text-left">
                        <p className={`font-semibold text-sm transition-colors duration-300 ${pageTheme.text} ${pageTheme.textDark}`}>
                          {item.label}
                        </p>
                        <p className={`text-xs transition-colors duration-300 ${pageTheme.text} ${pageTheme.textDark} opacity-80`}>
                          {item.description}
                        </p>
                      </div>
                    )}

                    {/* Active page indicator */}
                    {isActive && !isCollapsed && (
                      <ChevronRight className={`h-4 w-4 ${pageTheme.text} ${pageTheme.textDark}`} />
                    )}
                  </div>

                </Button>
              </motion.div>
            )
          })}
        </nav>

        {/* Enhanced Sidebar Footer */}
        <div className="p-4 border-t-2 border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
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
        className="fixed top-3 left-3 z-50 lg:hidden bg-white dark:bg-gray-900 backdrop-blur-xl shadow-xl shadow-gray-900/10 dark:shadow-gray-950/20 rounded-xl hover:scale-105 transition-all duration-200 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600"
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

      {/* Desktop Sidebar Toggle (visible when collapsed) */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed left-4 top-4 z-50"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(false)}
              className="bg-white dark:bg-gray-900 backdrop-blur-xl shadow-xl shadow-gray-900/10 dark:shadow-gray-950/20 rounded-xl hover:scale-105 transition-all duration-200 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 w-12 h-12"
              aria-label="Expand sidebar"
              title="Expand sidebar (Ctrl+B)"
            >
              <motion.div
                initial={false}
                animate={{ rotate: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className={`transition-all duration-500 ease-in-out ${
        isMobile
          ? 'ml-0'
          : isCollapsed
            ? 'ml-0'
            : effectiveSidebarOpen
              ? 'ml-[300px]'
              : 'ml-0'
      }`}>
        {/* Enhanced Top Bar */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b-2 border-gray-200 dark:border-gray-800 shadow-md shadow-gray-900/5 dark:shadow-gray-950/20">
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md h-11 w-11 min-h-[44px] min-w-[44px] shrink-0"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300 transition-transform duration-200 hover:rotate-12" />
                ) : (
                  <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300 transition-transform duration-200 hover:rotate-12" />
                )}
              </Button>

              {/* User Profile Dropdown */}
              <div className="relative" data-dropdown>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="relative bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all duration-200 hover:scale-105 p-1 h-11 w-11 min-h-[44px] min-w-[44px] shrink-0"
                >
                  <Avatar className="h-8 w-8 border-2 border-emerald-200 dark:border-emerald-800">
                    <AvatarImage src={profile?.image || ''} alt={profile?.name || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-semibold">
                      {profile?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                </Button>

                {/* Profile Dropdown */}
                <AnimatePresence>
                  {showProfileDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                    >
                      {/* User Info Header */}
                      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-b-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 ring-2 ring-emerald-200 dark:ring-emerald-800">
                            <AvatarImage src={profile?.image || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-semibold">
                              {profile?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                              {profile?.name || 'User'}
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                              {getGreeting()} 👋
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
                                  setShowProfileDropdown(false)
                                }}
                                className="w-full justify-start px-3 py-2.5 h-auto hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-all duration-200 group ui-element"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-all duration-200">
                                    <Icon className="h-4 w-4 text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                                  </div>
                                  <span className="font-medium text-sm">{item.label}</span>
                                </div>
                              </Button>
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Sign Out Button */}
                      <div className="p-2 border-t-2 border-gray-200 dark:border-gray-700">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            signOut({ callbackUrl: '/' })
                            setShowProfileDropdown(false)
                          }}
                          className="w-full justify-start px-3 py-2.5 h-auto hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all duration-200 group ui-element"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-red-100 dark:group-hover:bg-red-900/50 transition-all duration-200">
                              <LogOut className="h-4 w-4 text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400" />
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
          </div>
        </header>

        {/* Enhanced Main Content */}
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-3 sm:p-4 md:p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Enhanced Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
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

// Wrap the layout with ErrorBoundary
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ErrorBoundary>
  )
}
