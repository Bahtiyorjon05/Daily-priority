'use client'

import { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ErrorBoundary')

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: any
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Component error caught by boundary', error, {
      componentStack: errorInfo?.componentStack,
      errorInfo,
    })
    this.setState({ errorInfo })

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 shadow-lg">
            {/* Error Icon */}
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full mb-4 mx-auto">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>

            {/* Error Title */}
            <h3 className="text-xl font-bold text-red-800 dark:text-red-300 text-center mb-2">
              Something went wrong
            </h3>

            {/* Error Message */}
            <p className="text-red-600 dark:text-red-400 text-sm text-center mb-4">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
              <details className="mb-4">
                <summary className="text-xs text-red-700 dark:text-red-500 cursor-pointer hover:underline mb-2">
                  View error details
                </summary>
                <pre className="text-xs bg-red-100 dark:bg-red-950/50 p-3 rounded overflow-auto max-h-32 text-red-800 dark:text-red-400">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Reset Button */}
            <button
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            {/* Help Text */}
            <p className="text-xs text-red-600/70 dark:text-red-400/70 text-center mt-4">
              If this problem persists, please contact support
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Simple wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
