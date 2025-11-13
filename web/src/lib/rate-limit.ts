/**
 * Rate limiting utilities for API endpoints
 * Prevents brute force attacks and API abuse
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (for production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 10 * 60 * 1000)

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number
  /**
   * Time window in seconds
   */
  windowSeconds: number
  /**
   * Optional identifier (defaults to IP address)
   */
  identifier?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const key = `${identifier}:${config.maxRequests}:${config.windowSeconds}`

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    entry = {
      count: 0,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)
  }

  // Increment counter
  entry.count++

  // Check if limit exceeded
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
 * Get IP address from request
 */
export function getIpAddress(request: Request): string {
  // Try to get IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to 'unknown' if we can't determine IP
  // In production with Vercel/Netlify, x-forwarded-for should always be present
  return 'unknown'
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * Authentication endpoints (login, signup, password reset)
   * Very strict to prevent brute force attacks
   */
  auth: {
    maxRequests: 5,
    windowSeconds: 60 * 15, // 5 requests per 15 minutes
  } as RateLimitConfig,

  /**
   * API endpoints with mutations (create, update, delete)
   * Moderate limits
   */
  mutation: {
    maxRequests: 30,
    windowSeconds: 60, // 30 requests per minute
  } as RateLimitConfig,

  /**
   * API endpoints with queries (read-only)
   * More permissive
   */
  query: {
    maxRequests: 100,
    windowSeconds: 60, // 100 requests per minute
  } as RateLimitConfig,

  /**
   * File upload endpoints
   * Very restrictive due to resource usage
   */
  upload: {
    maxRequests: 10,
    windowSeconds: 60 * 60, // 10 uploads per hour
  } as RateLimitConfig,

  /**
   * Email sending endpoints
   * Strict to prevent spam
   */
  email: {
    maxRequests: 3,
    windowSeconds: 60 * 60, // 3 emails per hour
  } as RateLimitConfig,
}

/**
 * Rate limit middleware for API routes
 * Returns null if allowed, or Response object if rate limited
 */
export function rateLimit(
  request: Request,
  config: RateLimitConfig
): Response | null {
  const ip = getIpAddress(request)
  const identifier = config.identifier || ip

  const result = checkRateLimit(identifier, config)

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
          'Retry-After': Math.ceil(
            (result.reset - Date.now()) / 1000
          ).toString(),
        },
      }
    )
  }

  return null
}

/**
 * Create a rate limiter instance with custom config
 * Returns a function that checks rate limits
 */
export function createRateLimiter(config: {
  maxRequests: number
  windowMs: number
  message?: string
}) {
  return {
    check: async (identifier: string) => {
      const result = checkRateLimit(identifier, {
        maxRequests: config.maxRequests,
        windowSeconds: Math.floor(config.windowMs / 1000),
      })

      if (!result.success) {
        return {
          success: false,
          error: config.message || 'Rate limit exceeded',
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
        }
      }

      return {
        success: true,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      }
    },
  }
}
