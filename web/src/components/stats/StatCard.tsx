/**
 * StatCard Component
 * THE canonical stat card - single source of truth
 * Consolidates 5 duplicate versions into one beautiful component
 */

'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatCardProps } from '@/types/components'
import { GRADIENT_COLORS, TREND_COLORS, TREND_BG_COLORS, type GradientColor } from '@/constants/colors'
import { CARD_STYLES, TRANSITION_STYLES } from '@/constants/styles'

const StatCard = memo<StatCardProps>(({
  title,
  value,
  icon,
  color = 'blue',
  trend,
  progress,
  subtitle,
  onClick,
  isLoading = false,
  className,
}) => {
  // Trend icon
  const TrendIcon = trend?.direction === 'up'
    ? TrendingUp
    : trend?.direction === 'down'
    ? TrendingDown
    : Minus

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { y: -4, scale: 1.02 } : undefined}
      className={cn(
        CARD_STYLES.base,
        TRANSITION_STYLES.base,
        'group relative overflow-hidden',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {/* Gradient background overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-5 dark:opacity-10',
          GRADIENT_COLORS[color]
        )}
      />

      {/* Decorative circle */}
      <div
        className={cn(
          'absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl',
          GRADIENT_COLORS[color]
        )}
      />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>

            {isLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight">
                  {value}
                </h3>

                {/* Trend indicator */}
                {trend && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full',
                      TREND_COLORS[trend.direction],
                      TREND_BG_COLORS[trend.direction]
                    )}
                  >
                    <TrendIcon className="h-3 w-3" />
                    <span>{trend.percentage}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Icon */}
          <div
            className={cn(
              'flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br shadow-lg',
              GRADIENT_COLORS[color],
              'text-white'
            )}
          >
            {icon}
          </div>
        </div>

        {/* Progress bar */}
        {progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={cn(
                  'h-full bg-gradient-to-r rounded-full',
                  GRADIENT_COLORS[color]
                )}
              />
            </div>
          </div>
        )}

        {/* Trend label */}
        {trend?.label && (
          <p className="mt-3 text-xs text-muted-foreground">
            {trend.label}
          </p>
        )}

        {/* Hover effect indicator */}
        {onClick && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </div>
        )}
      </div>
    </motion.div>
  )
})

StatCard.displayName = 'StatCard'

export default StatCard

// Skeleton loading component
export const StatCardSkeleton = memo(() => (
  <div className={cn(CARD_STYLES.base, 'p-6')}>
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1 space-y-3">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
        <div className="h-8 w-32 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-12 w-12 bg-muted animate-pulse rounded-xl" />
    </div>
  </div>
))

StatCardSkeleton.displayName = 'StatCardSkeleton'
