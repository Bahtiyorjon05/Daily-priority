/**
 * StatsGrid Component
 * Grid layout for stat cards with responsive design
 */

'use client'

import { memo, useCallback } from 'react'
import { TrendingUp, CheckCircle, Clock, Flame } from 'lucide-react'
import StatCard, { StatCardSkeleton } from './StatCard'
import type { StatsGridProps } from '@/types/components'
import { getGridCols } from '@/constants/styles'

const StatsGrid = memo<StatsGridProps>(({
  stats,
  isLoading = false,
  onStatClick,
  className,
}) => {
  // Memoized click handlers
  const handleTotalClick = useCallback(() => {
    onStatClick?.('total')
  }, [onStatClick])

  const handleCompletedClick = useCallback(() => {
    onStatClick?.('completed')
  }, [onStatClick])

  const handlePendingClick = useCallback(() => {
    onStatClick?.('pending')
  }, [onStatClick])

  const handleStreakClick = useCallback(() => {
    onStatClick?.('streak')
  }, [onStatClick])

  if (isLoading) {
    return (
      <div className={getGridCols(4) + ' ' + className}>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  // Calculate completion rate trend
  const completionTrend = stats.trend ? {
    direction: stats.trend.direction,
    percentage: stats.trend.percentage,
    label: stats.trend.label || `${stats.trend.direction === 'up' ? 'Up' : 'Down'} from last week`,
  } : undefined

  return (
    <div className={getGridCols(4) + ' ' + className}>
      {/* Total Tasks */}
      <StatCard
        title="Total Tasks"
        value={stats.totalTasks}
        icon={<TrendingUp className="h-6 w-6" />}
        color="blue"
        subtitle={`${stats.pendingTasks} pending`}
        onClick={handleTotalClick}
      />

      {/* Completed Tasks */}
      <StatCard
        title="Completed"
        value={stats.completedTasks}
        icon={<CheckCircle className="h-6 w-6" />}
        color="emerald"
        progress={stats.completionRate}
        trend={completionTrend}
        subtitle={`${stats.completionRate}% completion rate`}
        onClick={handleCompletedClick}
      />

      {/* Pending Tasks */}
      <StatCard
        title="In Progress"
        value={stats.pendingTasks}
        icon={<Clock className="h-6 w-6" />}
        color="amber"
        subtitle={`${stats.urgentTasks} urgent`}
        onClick={handlePendingClick}
      />

      {/* Current Streak */}
      <StatCard
        title="Current Streak"
        value={`${stats.currentStreak} days`}
        icon={<Flame className="h-6 w-6" />}
        color="rose"
        subtitle={`Best: ${stats.longestStreak} days`}
        onClick={handleStreakClick}
      />
    </div>
  )
})

StatsGrid.displayName = 'StatsGrid'

export default StatsGrid
