/**
 * QuickActions Component
 * Quick action buttons for common tasks
 */

'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Target,
  BookOpen,
  BarChart3,
  Zap,
  Brain,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CARD_STYLES } from '@/constants/styles'
import { GRADIENT_COLORS } from '@/constants/colors'

interface QuickAction {
  id: string
  label: string
  icon: typeof Plus
  color: keyof typeof GRADIENT_COLORS
  onClick: () => void
}

interface QuickActionsProps {
  actions?: QuickAction[]
  onNewTask?: () => void
  onNewGoal?: () => void
  onNewJournal?: () => void
  onViewAnalytics?: () => void
  onAISuggestions?: () => void
  className?: string
}

const QuickActions = memo<QuickActionsProps>(({
  actions: customActions,
  onNewTask,
  onNewGoal,
  onNewJournal,
  onViewAnalytics,
  onAISuggestions,
  className,
}) => {
  const defaultActions: QuickAction[] = [
    {
      id: 'new-task',
      label: 'New Task',
      icon: Plus,
      color: 'blue',
      onClick: onNewTask || (() => {}),
    },
    {
      id: 'new-goal',
      label: 'New Goal',
      icon: Target,
      color: 'purple',
      onClick: onNewGoal || (() => {}),
    },
    {
      id: 'journal',
      label: 'Journal',
      icon: BookOpen,
      color: 'amber',
      onClick: onNewJournal || (() => {}),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      color: 'emerald',
      onClick: onViewAnalytics || (() => {}),
    },
    {
      id: 'ai-suggestions',
      label: 'AI Insights',
      icon: Brain,
      color: 'rose',
      onClick: onAISuggestions || (() => {}),
    },
  ]

  const actions = customActions || defaultActions

  return (
    <div className={cn(CARD_STYLES.base, 'p-6', className)}>
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon

          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Button
                variant="outline"
                className={cn(
                  'w-full h-auto flex-col gap-2 p-4 hover:shadow-md transition-all',
                  'group relative overflow-hidden'
                )}
                onClick={action.onClick}
              >
                {/* Gradient background on hover */}
                <div
                  className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity',
                    GRADIENT_COLORS[action.color]
                  )}
                />

                {/* Icon */}
                <div
                  className={cn(
                    'relative h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-sm',
                    GRADIENT_COLORS[action.color]
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Label */}
                <span className="relative text-xs font-medium">
                  {action.label}
                </span>
              </Button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
})

QuickActions.displayName = 'QuickActions'

export default QuickActions
