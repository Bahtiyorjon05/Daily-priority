import React from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingViewProps {
  message?: string
  className?: string
}

export function LoadingView({ message = 'Loading...', className = '' }: LoadingViewProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  )
}
