/**
 * ErrorState Component
 * Reusable error display
 */

'use client'

import { memo } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ErrorStateProps } from '@/types/components'

const ErrorState = memo<ErrorStateProps>(({
  title = 'Something went wrong',
  message,
  onRetry,
  retryText = 'Try again',
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      <div className="flex flex-col items-center text-center max-w-md space-y-4">
        <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            {retryText}
          </Button>
        )}
      </div>
    </div>
  )
})

ErrorState.displayName = 'ErrorState'

export default ErrorState
