'use client'

import { useT } from '@/lib/i18n/client'

import { motion } from 'framer-motion'
import { Plus, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title?: string
  message?: string
  onAction?: () => void
  actionLabel?: string
  icon?: React.ComponentType<{ className?: string }>
}

export default function EmptyState({
  title,
  message,
  onAction,
  actionLabel,
  icon: Icon = Target
}: EmptyStateProps) {
  const { t } = useT()

  // Defaults live in the body, not in the parameter list: a default value is
  // evaluated before the component body runs, which is no place for a hook.
  const heading = title ?? t('ui.noItemsFound')
  const body = message ?? t('ui.thereAreNoItemsToDisplayRightNow')
  const action = actionLabel ?? t('ui.addItem')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="h-12 w-12 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {heading}
      </h3>
      
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
        {body}
      </p>
      
      {onAction && (
        <Button 
          onClick={onAction}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          {action}
        </Button>
      )}
    </motion.div>
  )
}