/**
 * TaskCard Component
 * THE canonical task card - single source of truth
 * Clean, performant, and feature-complete
 */

'use client'

import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  MoreVertical,
  Zap,
  Calendar,
  Tag as TagIcon,
  Sparkles,
  Trash2,
  Edit3,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { TaskCardProps } from '@/types/components'
import { TaskStatus, Priority, EnergyLevel } from '@/types/models'
import {
  PRIORITY_TEXT_COLORS,
  PRIORITY_BG_COLORS,
  PRIORITY_BORDER_COLORS,
  STATUS_BG_COLORS,
  ENERGY_COLORS,
  TEXT_COLORS,
  BG_LIGHT_COLORS,
} from '@/constants/colors'
import { CARD_STYLES, BADGE_STYLES, TRANSITION_STYLES } from '@/constants/styles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const TaskCard = memo<TaskCardProps>(({
  task,
  viewMode = 'grid',
  onEdit,
  onDelete,
  onToggleComplete,
  onToggleUrgent,
  onToggleImportant,
  showCategory = true,
  showActions = true,
  isSelected = false,
  onSelect,
  className,
}) => {
  // Memoized handlers
  const handleToggleComplete = useCallback(() => {
    onToggleComplete?.(task.id)
  }, [task.id, onToggleComplete])

  const handleEdit = useCallback(() => {
    onEdit?.(task)
  }, [task, onEdit])

  const handleDelete = useCallback(() => {
    onDelete?.(task.id)
  }, [task.id, onDelete])

  const handleToggleUrgent = useCallback(() => {
    onToggleUrgent?.(task.id)
  }, [task.id, onToggleUrgent])

  const handleToggleImportant = useCallback(() => {
    onToggleImportant?.(task.id)
  }, [task.id, onToggleImportant])

  const handleSelect = useCallback(() => {
    onSelect?.(task.id)
  }, [task.id, onSelect])

  // Computed values
  const isCompleted = task.status === TaskStatus.COMPLETED
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted

  // Priority icon
  const PriorityIcon = Flag

  // Energy level display
  const energyLevelConfig = task.energyLevel ? {
    LOW: { icon: '🔋', label: 'Low Energy', color: ENERGY_COLORS.LOW },
    MEDIUM: { icon: '⚡', label: 'Medium Energy', color: ENERGY_COLORS.MEDIUM },
    HIGH: { icon: '✨', label: 'High Energy', color: ENERGY_COLORS.HIGH },
  }[task.energyLevel] : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        CARD_STYLES.base,
        CARD_STYLES.hover,
        TRANSITION_STYLES.base,
        'group relative overflow-hidden',
        viewMode === 'grid' ? 'h-full' : 'flex flex-row items-start gap-4',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isCompleted && 'opacity-75',
        className
      )}
    >
      {/* Selection checkbox */}
      {onSelect && (
        <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelect}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
        </div>
      )}

      {/* Priority accent bar */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          `bg-gradient-to-b ${PRIORITY_BORDER_COLORS[task.priority]}`
        )}
      />

      <div className={cn('flex-1 p-4', viewMode === 'list' && 'flex items-start gap-4')}>
        {/* Completion checkbox */}
        <button
          onClick={handleToggleComplete}
          className={cn(
            'flex-shrink-0 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full',
            isCompleted && 'text-emerald-600 dark:text-emerald-400'
          )}
          aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {/* Task content */}
        <div className={cn('flex-1', viewMode === 'grid' && 'mt-3')}>
          {/* Title */}
          <h3
            className={cn(
              'font-semibold text-base leading-snug mb-2',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className={cn(
              'text-sm text-muted-foreground mb-3 line-clamp-2',
              isCompleted && 'line-through'
            )}>
              {task.description}
            </p>
          )}

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Priority */}
            <Badge
              variant="outline"
              className={cn(
                'gap-1 text-xs',
                PRIORITY_BG_COLORS[task.priority],
                PRIORITY_TEXT_COLORS[task.priority]
              )}
            >
              <PriorityIcon className="h-3 w-3" />
              {task.priority}
            </Badge>

            {/* Urgent flag */}
            {task.urgent && (
              <Badge variant="destructive" className="gap-1 text-xs">
                <Zap className="h-3 w-3" />
                Urgent
              </Badge>
            )}

            {/* Important flag */}
            {task.important && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Flag className="h-3 w-3" />
                Important
              </Badge>
            )}

            {/* Category */}
            {showCategory && task.category && (
              <Badge
                variant="outline"
                className="gap-1 text-xs"
                style={{
                  borderColor: task.category.color,
                  color: task.category.color,
                }}
              >
                <TagIcon className="h-3 w-3" />
                {task.category.name}
              </Badge>
            )}

            {/* Energy level */}
            {energyLevelConfig && (
              <Badge
                variant="outline"
                className={cn(
                  'gap-1 text-xs',
                  BG_LIGHT_COLORS[energyLevelConfig.color],
                  TEXT_COLORS[energyLevelConfig.color]
                )}
              >
                <span>{energyLevelConfig.icon}</span>
                {energyLevelConfig.label}
              </Badge>
            )}
          </div>

          {/* Bottom info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              {/* Estimated time */}
              {task.estimatedTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{task.estimatedTime}m</span>
                </div>
              )}

              {/* Due date */}
              {task.dueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1',
                    isOverdue && 'text-red-600 dark:text-red-400 font-medium'
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(task.dueDate), 'MMM d')}</span>
                  {isOverdue && <span className="ml-1">(Overdue)</span>}
                </div>
              )}

              {/* Subtasks count */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="flex items-center gap-1">
                  <span>
                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleUrgent}>
                    <Zap className="mr-2 h-4 w-4" />
                    {task.urgent ? 'Remove urgent' : 'Mark as urgent'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleToggleImportant}>
                    <Flag className="mr-2 h-4 w-4" />
                    {task.important ? 'Remove important' : 'Mark as important'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
})

TaskCard.displayName = 'TaskCard'

export default TaskCard