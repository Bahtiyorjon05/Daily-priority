'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Sidebar, 
  TopBar, 
  MobileOverlay, 
  LoadingScreen 
} from './index'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true'
    }
    return false
  })
  const [isMobile, setIsMobile] = useState(false)

  // Auth redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  // Mobile detection and responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 1024
      const wasDesktop = !isMobile && window.innerWidth >= 1024
      
      setIsMobile(isMobileView)
      
      if (isMobileView) {
        setSidebarOpen(false)
        setSidebarCollapsed(false) // Don't collapse on mobile
      } else if (wasDesktop) {
        // On desktop, default to open sidebar
        setSidebarOpen(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isMobile])

  // Persist sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', sidebarCollapsed.toString())
    }
  }, [sidebarCollapsed])

  if (status === 'loading') {
    return <LoadingScreen />
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        isMobile={isMobile}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        session={session}
      />

      {/* Mobile Overlay */}
      <MobileOverlay
        isVisible={sidebarOpen && isMobile}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out ${
        isMobile 
          ? 'ml-0' 
          : sidebarOpen 
            ? sidebarCollapsed ? 'ml-20' : 'ml-72' 
            : 'ml-0'
      } min-h-screen`}>
        {/* Top Bar */}
        <TopBar
          session={session}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
        />

        {/* Page Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-screen pt-16 pb-6 px-4 sm:px-6 lg:px-8 max-w-full overflow-x-hidden"
        >
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  )
}
