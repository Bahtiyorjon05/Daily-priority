'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: ReactNode
  className?: string
}

export default function DashboardLayout({ 
  children, 
  className 
}: DashboardLayoutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

interface DashboardMainProps {
  children: ReactNode
  className?: string
}

export function DashboardMain({ 
  children, 
  className 
}: DashboardMainProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={cn(
        "lg:col-span-2 space-y-6",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

interface DashboardSidebarProps {
  children: ReactNode
  className?: string
}

export function DashboardSidebar({ 
  children, 
  className 
}: DashboardSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        "space-y-6",
        className
      )}
    >
      {children}
    </motion.div>
  )
}

interface DashboardSectionProps {
  title?: string
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function DashboardSection({ 
  title, 
  children, 
  className,
  action
}: DashboardSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && (
            <h2 className="text-2xl font-bold text-foreground">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}