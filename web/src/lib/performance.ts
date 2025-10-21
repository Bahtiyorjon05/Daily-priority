// Performance optimization utilities for the Daily Priority app

// Client-side cache with TTL
class ClientCache {
  private cache: Map<string, { data: any; expires: number }> = new Map()

  set(key: string, data: any, ttlMs: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  clear() {
    this.cache.clear()
  }

  size() {
    return this.cache.size
  }
}

// Global cache instance
export const clientCache = new ClientCache()

// Debounce utility for API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle utility for high-frequency events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map()

  static start(label: string): () => number {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.record(label, duration)
      return duration
    }
  }

  static record(label: string, duration: number) {
    if (!this.measurements.has(label)) {
      this.measurements.set(label, [])
    }
    
    const measurements = this.measurements.get(label)!
    measurements.push(duration)
    
    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift()
    }
  }

  static getStats(label: string) {
    const measurements = this.measurements.get(label) || []
    if (measurements.length === 0) return null

    const sorted = [...measurements].sort((a, b) => a - b)
    return {
      count: measurements.length,
      avg: measurements.reduce((a, b) => a + b, 0) / measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    }
  }

  static getAllStats() {
    const stats: Record<string, any> = {}
    for (const label of this.measurements.keys()) {
      stats[label] = this.getStats(label)
    }
    return stats
  }
}

// Optimized fetch with retry and timeout
export async function optimizedFetch(
  url: string,
  options: RequestInit & { 
    timeout?: number
    retries?: number
    retryDelay?: number
  } = {}
): Promise<Response> {
  const {
    timeout = 10000,
    retries = 2,
    retryDelay = 1000,
    ...fetchOptions
  } = options

  let lastError: Error | null = null

  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      return response
    } catch (error) {
      lastError = error as Error
      
      if (i < retries && error instanceof Error && error.name !== 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)))
        continue
      }
      
      throw error
    }
  }

  throw lastError
}

// Memory usage monitoring
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024 * 100) / 100
    }
  }
  return null
}

// Bundle size analyzer (development only)
export function analyzeBundleSize() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const totalSize = scripts.reduce((total, script) => {
      const src = (script as HTMLScriptElement).src
      if (src.includes('/_next/static/')) {
        // Estimate bundle size from filename patterns
        return total + (src.includes('chunks') ? 100 : 50) // KB estimate
      }
      return total
    }, 0)
    
    console.log('📦 Estimated bundle size: ' + (totalSize) + 'KB')
    return totalSize
  }
  return 0
}