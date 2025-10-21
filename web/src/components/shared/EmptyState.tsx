/**
 * EmptyState Component
 * Reusable empty state display
 */

'use client'

import { memo } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { EmptyStateProps } from '@/types/components'

const EmptyState = memo<EmptyStateProps>(({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="flex flex-col items-center text-center max-w-md space-y-4">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
          {typeof Icon === 'function' ? (
            <Icon className="h-10 w-10 text-muted-foreground" />
          ) : (
            Icon
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {action && (
          <Button onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
})

EmptyState.displayName = 'EmptyState'

export default EmptyState
