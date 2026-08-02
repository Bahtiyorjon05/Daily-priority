'use client'

import { useEffect } from 'react'

/**
 * Catches browser errors the app doesn't handle itself and posts them to
 * /api/errors, where they're grouped and shown in the admin console.
 *
 * Mounted once in the root layout. Deliberately tiny and dependency-free —
 * the point is to see production failures without shipping an APM SDK.
 */
export function ErrorReporter() {
  useEffect(() => {
    // Don't report the same thing repeatedly within one page view.
    const seen = new Set<string>()

    const report = (message: string, stack?: string, context?: Record<string, unknown>) => {
      const key = `${message}::${stack?.slice(0, 120) ?? ''}`
      if (seen.has(key)) return
      seen.add(key)

      // Ignore noise we can't act on.
      if (
        /ResizeObserver loop|Script error\.?$|Load failed|NetworkError|Failed to fetch/i.test(message)
      ) {
        return
      }

      const payload = JSON.stringify({
        message,
        stack,
        url: window.location.href,
        context,
      })

      // sendBeacon survives the page being torn down mid-crash.
      try {
        const blob = new Blob([payload], { type: 'application/json' })
        if (navigator.sendBeacon?.('/api/errors', blob)) return
      } catch {
        /* fall through */
      }
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }

    const onError = (e: ErrorEvent) => {
      report(e.message, e.error?.stack, {
        file: e.filename,
        line: e.lineno,
        col: e.colno,
      })
    }

    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason
      report(
        reason?.message || String(reason) || 'Unhandled promise rejection',
        reason?.stack,
        { kind: 'unhandledrejection' }
      )
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return null
}

/** Imperative reporter for caught errors (e.g. from an ErrorBoundary). */
export function reportError(
  error: Error | string,
  context?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  const message = typeof error === 'string' ? error : error.message
  const stack = typeof error === 'string' ? undefined : error.stack
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, stack, url: window.location.href, context }),
    keepalive: true,
  }).catch(() => {})
}
