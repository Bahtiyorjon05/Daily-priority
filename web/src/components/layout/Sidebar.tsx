'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Target, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavigationMenu, SidebarFooter } from './index'

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  isMobile: boolean
  onToggle: () => void
  onCollapse: () => void
  session: any
}

export default function Sidebar({
  isOpen,
  isCollapsed,
  isMobile,
  onToggle,
  onCollapse,
  session
}: SidebarProps) {
  const pathname = usePathname()

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{
        x: isOpen ? 0 : -300,
        width: isCollapsed ? '80px' : '288px'
      }}
      transition={{ type: "spring", damping: 25, stiffness: 400 }}
      className={`
        fixed left-0 top-0 h-full z-50 flex flex-col
        bg-gradient-to-b from-slate-50 via-white to-slate-50 
        dark:from-slate-950 dark:via-slate-900 dark:to-slate-950
        backdrop-blur-2xl border-r border-slate-200/80 dark:border-slate-700/80
        shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.24)]
        ${isMobile ? 'w-72' : isCollapsed ? 'w-20' : 'w-72'}
      `}
      role="complementary"
      aria-label="Primary sidebar"
      aria-hidden={!isMobile && !isOpen}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4"
            >
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-xl"
              >
                <Target className="h-6 w-6 text-white" />
                <div className="absolute inset-0 rounded-2xl bg-white/20 blur-xl"></div>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Daily Priority
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Productivity Dashboard
                </p>
              </div>
            </motion.div>
          )}

          {isCollapsed && (
            <div className="flex justify-center w-full">
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"
              >
                <Target className="h-5 w-5 text-white" />
              </motion.div>
            </div>
          )}

          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onCollapse}
              className="h-8 w-8 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all duration-200 hover:scale-105"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-pressed={isCollapsed}
            >
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </motion.div>
            </Button>
          )}
        </div>
      </div>

      {/* Spacer where user profile used to be to keep rhythm */}
      <div className="px-4 py-2" aria-hidden />

      {/* Navigation */}
      <NavigationMenu
        pathname={pathname}
        isCollapsed={isCollapsed}
      />

      {/* Footer */}
      <SidebarFooter isCollapsed={isCollapsed} />
    </motion.aside>
  )
}
