/**
 * Error Tracking Service
 * Centralized error reporting and monitoring
 */

import { Logger } from './logger'

const logger = new Logger('ErrorTracking')

export interface ErrorContext {
  userId?: string
  email?: string
  url?: string
  method?: string
  userAgent?: string
  ip?: string
  timestamp?: string
  [key: string]: any
}

export interface ErrorReport {
  message: string
  stack?: string
  context: ErrorContext
  level: 'error' | 'warning' | 'info'
}

/**
 * Track errors (ready for Sentry/LogRocket integration)
 */
export function trackError(
  error: Error | string,
  context: ErrorContext = {},
  level: 'error' | 'warning' | 'info' = 'error'
) {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorStack = typeof error === 'string' ? undefined : error.stack

  const report: ErrorReport = {
    message: errorMessage,
    stack: errorStack,
    context: {
      ...context,
      timestamp: new Date().toISOString(),
    },
    level,
  }

  // Log to console (replace with Sentry in production)
  if (level === 'error') {
    logger.error(errorMessage, report.context)
  } else if (level === 'warning') {
    logger.warn(errorMessage, report.context)
  } else {
    logger.info(errorMessage, report.context)
  }

  // TODO: Send to error tracking service
  // if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  //   Sentry.captureException(error, {
  //     contexts: { custom: context },
  //     level: level as Sentry.SeverityLevel,
  //   })
  // }

  // Store in database for critical errors
  if (level === 'error' && process.env.NODE_ENV === 'production') {
    storeErrorInDatabase(report).catch(console.error)
  }
}

/**
 * Store error in database for analysis
 */
async function storeErrorInDatabase(report: ErrorReport) {
  try {
    // Optional: store in database for analysis
    // await prisma.errorLog.create({
    //   data: {
    //     message: report.message,
    //     stack: report.stack,
    //     context: JSON.stringify(report.context),
    //     level: report.level,
    //   },
    // })
  } catch (err) {
    console.error('Failed to store error in database:', err)
  }
}

/**
 * Track API errors specifically
 */
export function trackAPIError(
  error: Error | string,
  request: {
    method: string
    url: string
    userId?: string
    body?: any
  }
) {
  trackError(error, {
    type: 'API_ERROR',
    method: request.method,
    url: request.url,
    userId: request.userId,
    body: request.body ? JSON.stringify(request.body) : undefined,
  })
}

/**
 * Track authentication errors
 */
export function trackAuthError(
  error: Error | string,
  context: {
    email?: string
    provider?: string
    action: string
  }
) {
  trackError(
    error,
    {
      type: 'AUTH_ERROR',
      ...context,
    },
    'warning'
  )
}

/**
 * Track database errors
 */
export function trackDatabaseError(
  error: Error | string,
  context: {
    operation: string
    model?: string
    userId?: string
  }
) {
  trackError(error, {
    type: 'DATABASE_ERROR',
    ...context,
  })
}

/**
 * Track performance issues
 */
export function trackPerformanceIssue(
  message: string,
  context: {
    operation: string
    duration: number
    threshold: number
  }
) {
  trackError(
    message,
    {
      type: 'PERFORMANCE_ISSUE',
      ...context,
    },
    'warning'
  )
}

/**
 * Track user actions (for analytics)
 */
export function trackUserAction(
  action: string,
  context: {
    userId: string
    details?: Record<string, any>
  }
) {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`User Action: ${action}`, context)
  }

  // TODO: Send to analytics service
  // if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
  //   analytics.track(action, context)
  // }
}

/**
 * Error boundary handler
 */
export function handleComponentError(
  error: Error,
  errorInfo: { componentStack: string }
) {
  trackError(error, {
    type: 'COMPONENT_ERROR',
    componentStack: errorInfo.componentStack,
  })
}

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      trackError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        type: 'UNHANDLED_REJECTION',
        reason: String(event.reason),
      })
    })

    // Catch global errors
    window.addEventListener('error', (event) => {
      trackError(event.error || new Error(event.message), {
        type: 'GLOBAL_ERROR',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })
  }
}
