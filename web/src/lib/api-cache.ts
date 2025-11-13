/**
 * API Response Caching
 * In-memory cache for API responses
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class ResponseCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 5 minutes
    if (typeof window === 'undefined') {
      // Server-side only
      this.cleanupInterval = setInterval(() => {
        this.cleanup()
      }, 5 * 60 * 1000)
    }
  }

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache value
   */
  set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Delete cache entry
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key))
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

// Global cache instance
export const apiCache = new ResponseCache()

/**
 * Cache TTL presets (in milliseconds)
 */
export const CacheTTL = {
  SHORT: 30 * 1000, // 30 seconds
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  HOUR: 60 * 60 * 1000, // 1 hour
  DAY: 24 * 60 * 60 * 1000, // 1 day
} as const

/**
 * Generate cache key from request
 */
export function generateCacheKey(
  route: string,
  params?: Record<string, any>
): string {
  if (!params) return route

  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key]
      return acc
    }, {} as Record<string, any>)

  return `${route}:${JSON.stringify(sortedParams)}`
}

/**
 * Cache decorator for API routes
 */
export function withCache<T>(
  handler: () => Promise<T>,
  key: string,
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  // Check cache first
  const cached = apiCache.get<T>(key)
  if (cached !== null) {
    return Promise.resolve(cached)
  }

  // Execute handler and cache result
  return handler().then((result) => {
    apiCache.set(key, result, ttl)
    return result
  })
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCache(pattern: string): void {
  const stats = apiCache.getStats()
  const keysToDelete = stats.keys.filter((key) => key.includes(pattern))
  keysToDelete.forEach((key) => apiCache.delete(key))
}

/**
 * Invalidate user-specific cache
 */
export function invalidateUserCache(userId: string): void {
  invalidateCache(userId)
}

/**
 * Cache middleware for Next.js API routes
 */
export function cacheMiddleware(
  ttl: number = CacheTTL.MEDIUM,
  keyGenerator?: (req: Request) => string
) {
  return async (
    req: Request,
    handler: () => Promise<Response>
  ): Promise<Response> => {
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : generateCacheKey(req.url)

    // Check cache
    const cached = apiCache.get<Response>(cacheKey)
    if (cached) {
      return cached
    }

    // Execute handler
    const response = await handler()

    // Cache successful responses only
    if (response.ok) {
      apiCache.set(cacheKey, response, ttl)
    }

    return response
  }
}
