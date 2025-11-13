/**
 * Enhanced Rate limiting with Vercel KV support
 * Uses Vercel KV in production, in-memory in development
 */

import { kv } from '@vercel/kv'
import { createLogger } from './logger'

const logger = createLogger('RateLimit')

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for development
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 10 minutes (development only)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 10 * 60 * 1000)
}

export interface RateLimitConfig {
  maxRequests: number
  windowSeconds: number
  identifier?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check if Vercel KV is available
 */
function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

/**
 * Check rate limit using Vercel KV
 */
async function checkRateLimitKV(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = `ratelimit:${identifier}:${config.maxRequests}:${config.windowSeconds}`

  try {
    // Use Vercel KV pipeline for atomic operations
    const pipeline = kv.pipeline()
    pipeline.incr(key)
    pipeline.pttl(key)
    const [count, ttl] = await pipeline.exec<[number, number]>()

    // Set expiration if this is the first request
    if (count === 1) {
      await kv.pexpire(key, windowMs)
    }

    const resetTime = now + (ttl > 0 ? ttl : windowMs)
    const success = count <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - count)

    return {
      success,
      limit: config.maxRequests,
      remaining,
      reset: resetTime,
    }
  } catch (error) {
    logger.error('Vercel KV rate limit check failed, allowing request', error)
    // Fail open - allow the request if KV is down
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: now + windowMs,
    }
  }
}

/**
 * Check rate limit using in-memory store
 */
function checkRateLimitMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = `${identifier}:${config.maxRequests}:${config.windowSeconds}`

  let entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)
  }

  entry.count++

  const success = entry.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - entry.count)

  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: entry.resetTime,
  }
}

/**
 * Check rate limit (auto-selects KV or memory)
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (isKVAvailable()) {
    return await checkRateLimitKV(identifier, config)
  } else {
    return checkRateLimitMemory(identifier, config)
  }
}

/**
 * Get IP address from request
 */
export function getIpAddress(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

/**
 * Rate limit presets
 */
export const RateLimitPresets = {
  auth: {
    maxRequests: 5,
    windowSeconds: 60 * 15, // 5 requests per 15 minutes
  } as RateLimitConfig,

  mutation: {
    maxRequests: 30,
    windowSeconds: 60, // 30 requests per minute
  } as RateLimitConfig,

  query: {
    maxRequests: 100,
    windowSeconds: 60, // 100 requests per minute
  } as RateLimitConfig,

  upload: {
    maxRequests: 10,
    windowSeconds: 60 * 60, // 10 uploads per hour
  } as RateLimitConfig,

  email: {
    maxRequests: 3,
    windowSeconds: 60 * 60, // 3 emails per hour
  } as RateLimitConfig,
}

/**
 * Rate limit middleware
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<Response | null> {
  const ip = getIpAddress(request)
  const identifier = config.identifier || ip

  const result = await checkRateLimit(identifier, config)

  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again after ${new Date(result.reset).toLocaleTimeString()}.`,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  return null
}
