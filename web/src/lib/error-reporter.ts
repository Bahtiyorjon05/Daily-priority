/**
 * Self-hosted error capture.
 *
 * Errors are grouped by a fingerprint (message + first meaningful stack frame)
 * and stored with a running count, so a fault that fires a thousand times shows
 * up as one row with count=1000 rather than flooding the table. Surfaced in the
 * admin console under "Errors".
 *
 * Server-side only — the browser posts to /api/errors instead.
 */

import { prisma } from './prisma'

export interface CaptureInput {
  message: string
  stack?: string | null
  source?: 'client' | 'server' | 'api'
  url?: string | null
  userAgent?: string | null
  userId?: string | null
  level?: 'error' | 'warning' | 'info'
  context?: Record<string, unknown> | null
}

/** Stable-ish id for "the same bug", independent of ids/timestamps in the text. */
export function fingerprint(message: string, stack?: string | null): string {
  const normalisedMessage = message
    // UUIDs
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<id>')
    // cuid/nanoid-style tokens: long, alphanumeric, mixing letters AND digits.
    // A plain hex match misses these (cuids contain non-hex letters), which
    // meant "User <cuid> not found" produced a distinct row per user.
    .replace(/\b(?=[a-z0-9]*\d)(?=[a-z0-9]*[a-z])[a-z0-9]{16,}\b/gi, '<id>')
    // Long hex runs (hashes, object ids)
    .replace(/\b[0-9a-f]{8,}\b/gi, '<id>')
    .replace(/\d+/g, '<n>')
    .slice(0, 200)

  // First frame that isn't framework noise gives us the origin of the fault.
  const frame =
    (stack || '')
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('at ') && !/node_modules|node:internal/.test(l))
      ?.replace(/:\d+:\d+/g, '')
      ?.slice(0, 160) || ''

  return `${normalisedMessage}::${frame}`
}

const MAX_STACK = 8000
const MAX_MESSAGE = 1000

/**
 * Records an error. Never throws — reporting must not be able to break the
 * request that was already failing.
 */
export async function captureError(input: CaptureInput): Promise<void> {
  try {
    const message = String(input.message || 'Unknown error').slice(0, MAX_MESSAGE)
    const stack = input.stack ? String(input.stack).slice(0, MAX_STACK) : null
    const fp = fingerprint(message, stack)

    await prisma.errorLog.upsert({
      where: { fingerprint: fp },
      update: {
        count: { increment: 1 },
        lastSeenAt: new Date(),
        // A previously-resolved fault that reappears should resurface.
        resolved: false,
        stack: stack ?? undefined,
        url: input.url ?? undefined,
        userId: input.userId ?? undefined,
      },
      create: {
        fingerprint: fp,
        message,
        stack,
        level: input.level || 'error',
        source: input.source || 'server',
        url: input.url || null,
        userAgent: input.userAgent ? String(input.userAgent).slice(0, 400) : null,
        userId: input.userId || null,
        context: (input.context as never) ?? undefined,
      },
    })
  } catch (err) {
    // Last resort: don't let the reporter cascade.
    console.error('[error-reporter] failed to record error:', (err as Error).message)
  }
}

/** Wraps an API route handler so unexpected throws are recorded, then rethrown. */
export async function withErrorCapture<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    await captureError({
      message: (error as Error).message || String(error),
      stack: (error as Error).stack,
      source: 'api',
      context: { label },
    })
    throw error
  }
}
