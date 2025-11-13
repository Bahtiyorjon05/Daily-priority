'use client'

import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'wave'
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  }

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%')
  }

  return (
    <>
      <div
        className={`
          bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200
          dark:from-gray-700 dark:via-gray-600 dark:to-gray-700
          ${variantClasses[variant]}
          ${animationClasses[animation]}
          ${className}
        `}
        style={style}
      />
      
      {animation === 'wave' && (
        <style jsx global>{`
          @keyframes shimmer {
            0% {
              background-position: -1000px 0;
            }
            100% {
              background-position: 1000px 0;
            }
          }
          
          .animate-shimmer {
            animation: shimmer 2s infinite linear;
            background: linear-gradient(
              90deg,
              #e5e7eb 0%,
              #d1d5db 20%,
              #e5e7eb 40%,
              #e5e7eb 100%
            );
            background-size: 1000px 100%;
          }
          
          .dark .animate-shimmer {
            background: linear-gradient(
              90deg,
              #374151 0%,
              #4b5563 20%,
              #374151 40%,
              #374151 100%
            );
            background-size: 1000px 100%;
          }
        `}</style>
      )}
    </>
  )
}

// Pre-built skeleton components for common use cases

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height="1rem"
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height="1rem" />
          <Skeleton variant="text" width="40%" height="0.75rem" />
        </div>
      </div>
      <Skeleton variant="rounded" height={120} />
      <SkeletonText lines={2} />
    </div>
  )
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" height="1.5rem" className="flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" height="1rem" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizes = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80
  }

  return (
    <Skeleton
      variant="circular"
      width={sizes[size]}
      height={sizes[size]}
      className={className}
    />
  )
}

export function SkeletonButton({ className = '' }: { className?: string }) {
  return (
    <Skeleton
      variant="rounded"
      height={40}
      className={`px-6 ${className}`}
    />
  )
}

export function SkeletonDashboard({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
            <Skeleton variant="text" width="60%" height="0.875rem" />
            <Skeleton variant="text" width="40%" height="1.5rem" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton variant="rounded" height={300} />
          <SkeletonCard />
        </div>
        <div className="space-y-4">
          <Skeleton variant="rounded" height={200} />
          <SkeletonCard />
        </div>
      </div>
    </div>
  )
}

export function SkeletonAuthForm({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-4 ${className}`}>
      <Skeleton variant="text" height="2rem" width="60%" className="mx-auto" />
      <Skeleton variant="text" height="1rem" width="80%" className="mx-auto" />
      
      <div className="space-y-3 pt-4">
        <div className="space-y-2">
          <Skeleton variant="text" height="0.875rem" width="30%" />
          <Skeleton variant="rounded" height={40} />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" height="0.875rem" width="30%" />
          <Skeleton variant="rounded" height={40} />
        </div>
        <Skeleton variant="rounded" height={44} className="mt-6" />
      </div>
    </div>
  )
}
