/**
 * API Request Logging Utilities
 * Provides structured logging for API routes
 */

export interface RequestLog {
  method: string
  url: string
  timestamp: string
  duration?: number
  status?: number
  userId?: string
  error?: string
  ip?: string
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Format log message with timestamp
 */
function formatLog(
  level: LogLevel,
  message: string,
  data?: Record<string, any>
): string {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ` | ${JSON.stringify(data)}` : ''
  return `[${timestamp}] [${level}] ${message}${dataStr}`
}

/**
 * Logger class
 */
export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  debug(message: string, data?: Record<string, any>) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog(LogLevel.DEBUG, `[${this.context}] ${message}`, data))
    }
  }

  info(message: string, data?: Record<string, any>) {
    // Only log info messages in development
    if (process.env.NODE_ENV === 'development') {
      console.info(formatLog(LogLevel.INFO, `[${this.context}] ${message}`, data))
    }
  }

  warn(message: string, data?: Record<string, any>) {
    console.warn(formatLog(LogLevel.WARN, `[${this.context}] ${message}`, data))
  }

  error(message: string, error?: Error | unknown, data?: Record<string, any>) {
    const errorData = {
      ...data,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
    console.error(formatLog(LogLevel.ERROR, `[${this.context}] ${message}`, errorData))
  }
}

/**
 * Create request logger
 */
export function createRequestLogger(request: Request, userId?: string) {
  const url = new URL(request.url)
  const startTime = Date.now()

  const log: RequestLog = {
    method: request.method,
    url: url.pathname + url.search,
    timestamp: new Date().toISOString(),
    userId,
    ip: request.headers.get('x-forwarded-for') || 'unknown',
  }

  return {
    log,
    complete: (status: number, error?: string) => {
      log.duration = Date.now() - startTime
      log.status = status
      if (error) {
        log.error = error
      }

      // Log to console
      const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO
      const message = `${log.method} ${log.url} ${status} ${log.duration}ms`
      
      if (level === LogLevel.ERROR) {
        console.error(formatLog(level, message, log))
      } else if (level === LogLevel.WARN) {
        console.warn(formatLog(level, message, log))
      } else if (process.env.NODE_ENV === 'development') {
        console.info(formatLog(level, message, log))
      }

      // In production, you would send this to a logging service
      // e.g., DataDog, CloudWatch, LogRocket, etc.
    },
  }
}

/**
 * Create logger for specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context)
}

/**
 * Performance logger
 */
export class PerformanceLogger {
  private startTime: number
  private checkpoints: Map<string, number> = new Map()

  constructor() {
    this.startTime = performance.now()
  }

  checkpoint(name: string) {
    this.checkpoints.set(name, performance.now() - this.startTime)
  }

  finish(name: string = 'total'): Record<string, number> {
    this.checkpoint(name)
    return Object.fromEntries(this.checkpoints)
  }

  log(context: string) {
    const timings = this.finish()
    console.info(
      formatLog(
        LogLevel.INFO,
        `[${context}] Performance timings`,
        timings
      )
    )
  }
}
