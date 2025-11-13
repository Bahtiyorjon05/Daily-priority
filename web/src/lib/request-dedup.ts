/**
 * Request Deduplication
 * Prevents duplicate API requests from being sent simultaneously
 */

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>()
  private readonly maxAge = 5000 // 5 seconds

  /**
   * Generate cache key from request
   */
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET'
    const body = options?.body ? JSON.stringify(options.body) : ''
    return `${method}:${url}:${body}`
  }

  /**
   * Clean up old pending requests
   */
  private cleanup() {
    const now = Date.now()
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.maxAge) {
        this.pendingRequests.delete(key)
      }
    }
  }

  /**
   * Execute fetch with deduplication
   */
  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const key = this.generateKey(url, options)

    // Check if request is already pending
    const pending = this.pendingRequests.get(key)
    if (pending) {
      console.log(`[Dedup] Reusing pending request for ${key}`)
      return pending.promise
    }

    // Create new request
    const promise = fetch(url, options)
      .then((response) => {
        // Remove from pending after completion
        this.pendingRequests.delete(key)
        return response
      })
      .catch((error) => {
        // Remove from pending after error
        this.pendingRequests.delete(key)
        throw error
      })

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    })

    // Periodic cleanup
    if (Math.random() < 0.1) {
      this.cleanup()
    }

    return promise
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear()
  }

  /**
   * Clear specific request
   */
  clearRequest(url: string, options?: RequestInit) {
    const key = this.generateKey(url, options)
    this.pendingRequests.delete(key)
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator()

/**
 * Deduplicated fetch wrapper
 */
export function deduplicatedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return requestDeduplicator.fetch(url, options)
}
