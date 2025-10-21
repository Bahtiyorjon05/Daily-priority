'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    xxl?: number
  }
}

export default function ResponsiveGrid({ 
  children, 
  className,
  cols = { xs: 1, sm: 1, md: 2, lg: 3, xl: 4, xxl: 5 }
}: ResponsiveGridProps) {
  const getGridCols = () => {
    const breakpoints = Object.entries(cols)
      .map(([breakpoint, count]) => `grid-cols-${breakpoint}:${count}`)
      .join(' ')
    
    return breakpoints
  }

  return (
    <div className={cn(
      "grid gap-4 sm:gap-5 lg:gap-6",
      getGridCols(),
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveGridItemProps {
  children: ReactNode
  className?: string
  animate?: boolean
  delay?: number
}

export function ResponsiveGridItem({ 
  children, 
  className,
  animate = true,
  delay = 0
}: ResponsiveGridItemProps) {
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        className={className}
      >
        {children}
      </motion.div>
    )
  }

  return <div className={className}>{children}</div>
}