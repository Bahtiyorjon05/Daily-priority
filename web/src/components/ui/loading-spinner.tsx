'use client'

import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
}

const messageSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
}

export function LoadingSpinner({ size = 'md', message, className = '' }: LoadingSpinnerProps) {
  const spinnerSize = sizeClasses[size]
  const messageSize = messageSizes[size]

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* Gradient spinning circle */}
      <div className="relative">
        <div
          className={`${spinnerSize} rounded-full animate-spin`}
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, #059669 90deg, #047857 180deg, #0f766e 270deg, transparent 360deg)',
            animation: 'spin 1s linear infinite'
          }}
        />
        <div 
          className={`absolute inset-0 m-[3px] rounded-full bg-white dark:bg-gray-900`}
        />
      </div>

      {/* Optional message */}
      {message && (
        <p className={`${messageSize} text-gray-600 dark:text-gray-400 font-medium animate-pulse`}>
          {message}
        </p>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

// Full page loading spinner
export function LoadingSpinnerFullPage({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
      <LoadingSpinner size="xl" message={message} />
    </div>
  )
}

// Inline loading spinner for buttons
export function LoadingSpinnerInline({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-block ${className}`}>
      <div
        className="h-5 w-5 rounded-full animate-spin"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, #ffffff 90deg, #f0fdf4 180deg, #ffffff 270deg, transparent 360deg)',
          animation: 'spin 0.8s linear infinite'
        }}
      />
    </div>
  )
}

// Three dots loading animation
export function LoadingDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div
        className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 animate-bounce"
        style={{ animationDelay: '0ms', animationDuration: '1s' }}
      />
      <div
        className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-700 to-emerald-600 animate-bounce"
        style={{ animationDelay: '150ms', animationDuration: '1s' }}
      />
      <div
        className="h-2 w-2 rounded-full bg-gradient-to-r from-teal-700 to-teal-600 animate-bounce"
        style={{ animationDelay: '300ms', animationDuration: '1s' }}
      />
    </div>
  )
}

// Pulsing gradient circle
export function LoadingPulse({ size = 'md', className = '' }: Pick<LoadingSpinnerProps, 'size' | 'className'>) {
  const pulseSize = sizeClasses[size]

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${pulseSize} rounded-full animate-pulse`}
        style={{
          background: 'linear-gradient(135deg, #059669, #047857, #0f766e)',
          boxShadow: '0 0 20px rgba(5, 150, 105, 0.5)'
        }}
      />
    </div>
  )
}
