/**
 * LoadingState Component
 * Reusable loading indicators
 */

'use client'

import { memo } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LoadingStateProps } from '@/types/components'

const LoadingState = memo<LoadingStateProps>(({
  text = 'Loading...',
  size = 'md',
  fullScreen = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
          {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center py-8', className)}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  )
})

LoadingState.displayName = 'LoadingState'

export default LoadingState
