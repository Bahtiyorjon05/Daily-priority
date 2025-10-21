// Performance monitoring utilities for the Daily Priority app

export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map()

  /**
   * Start a performance measurement
   * @param label - Label for the measurement
   * @returns Function to stop the measurement and get the duration
   */
  static start(label: string): () => number {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      this.record(label, duration)
      return duration
    }
  }

  /**
   * Record a measurement
   * @param label - Label for the measurement
   * @param duration - Duration in milliseconds
   */
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

  /**
   * Get statistics for a measurement
   * @param label - Label for the measurement
   * @returns Statistics object or null if no measurements
   */
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

  /**
   * Get all statistics
   * @returns Object with all statistics
   */
  static getAllStats() {
    const stats: Record<string, any> = {}
    for (const label of this.measurements.keys()) {
      stats[label] = this.getStats(label)
    }
    return stats
  }

  /**
   * Clear all measurements
   */
  static clear() {
    this.measurements.clear()
  }
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

// Debounce utility for high-frequency events
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