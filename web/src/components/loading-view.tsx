import React from 'react'
import { LoadingSpinner } from './ui/loading-spinner'

interface LoadingViewProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function LoadingView({ 
  message = 'Loading...', 
  className = '',
  size = 'lg'
}: LoadingViewProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
      <LoadingSpinner size={size} message={message} />
    </div>
  )
}
