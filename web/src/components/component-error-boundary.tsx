'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  componentName?: string
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Component-level error boundary for graceful error handling
 * Prevents entire page crashes when a single component fails
 */
export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Component Error Boundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // In production, you would send this to an error reporting service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-200 dark:border-red-800">
          <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            {this.props.componentName
              ? `${this.props.componentName} Error`
              : 'Component Error'}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4 text-center max-w-md">
            {process.env.NODE_ENV === 'development'
              ? this.state.error?.message || 'Something went wrong'
              : 'Something went wrong while loading this component'}
          </p>
          <Button
            onClick={this.handleReset}
            variant="outline"
            className="flex items-center gap-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Lightweight error boundary for inline use
 */
export function InlineErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <ComponentErrorBoundary
      fallback={
        fallback || (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">
              Failed to load this section
            </p>
          </div>
        )
      }
    >
      {children}
    </ComponentErrorBoundary>
  )
}
