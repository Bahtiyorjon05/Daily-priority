'use client'

import { Component, ReactNode } from 'react'
import { useT } from '@/lib/i18n/client'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { createLogger } from '@/lib/logger'
import { reportError } from '@/components/shared/ErrorReporter'

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
/**
 * The fallback UI, split out of the class.
 *
 * A class component can't call `useT()`, and this is the one screen a user
 * sees when everything else has failed — leaving it English-only would mean the
 * app silently switches language exactly when it's least reassuring.
 */
function ErrorFallback({ error, onReset }: { error?: Error; onReset: () => void }) {
  const { t } = useT()

  return (
    <div className="min-h-[300px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full mb-4 mx-auto">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>

        <h3 className="text-xl font-bold text-red-800 dark:text-red-300 text-center mb-2">
          {t('error.title')}
        </h3>

        <p className="text-red-600 dark:text-red-400 text-sm text-center mb-4">
          {error?.message || t('error.generic')}
        </p>

        {process.env.NODE_ENV === 'development' && error?.stack && (
          <details className="mb-4">
            <summary className="text-xs text-red-700 dark:text-red-500 cursor-pointer hover:underline mb-2">
              {t('ui.viewErrorDetails')}
            </summary>
            <pre className="text-xs bg-red-100 dark:bg-red-950/50 p-3 rounded overflow-auto max-h-32 text-red-800 dark:text-red-400">
              {error.stack}
            </pre>
          </details>
        )}

        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
          {t('ui.tryAgain')}
        </button>

        <p className="text-xs text-red-600/70 dark:text-red-400/70 text-center mt-4">
          {t('ui.ifThisProblemPersistsPleaseContactSupport')}
        </p>
      </div>
    </div>
  )
}

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
    // Send it somewhere we can actually see it (admin console → Errors),
    // rather than only into the browser console on the user's device.
    reportError(error, {
      componentStack: errorInfo?.componentStack?.slice(0, 2000),
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

      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />
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
