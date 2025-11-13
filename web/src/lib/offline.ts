/**
 * Offline Support Utilities
 * Handle offline state and queue operations for later sync
 */

export interface QueuedOperation {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  endpoint: string
  data: any
  timestamp: number
  retries: number
}

class OfflineQueue {
  private queue: QueuedOperation[] = []
  private readonly STORAGE_KEY = 'dailypriority_offline_queue'
  private readonly MAX_RETRIES = 3
  private isProcessing = false

  constructor() {
    this.loadQueue()
    this.setupOnlineListener()
  }

  /**
   * Add operation to queue
   */
  add(
    type: QueuedOperation['type'],
    endpoint: string,
    data: any
  ): string {
    const operation: QueuedOperation = {
      id: this.generateId(),
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0,
    }

    this.queue.push(operation)
    this.saveQueue()

    return operation.id
  }

  /**
   * Process queue when online
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return
    if (this.queue.length === 0) return

    this.isProcessing = true
    console.log(`[Offline Queue] Processing ${this.queue.length} operations`)

    const operations = [...this.queue]

    for (const operation of operations) {
      try {
        await this.executeOperation(operation)
        this.removeFromQueue(operation.id)
        console.log(`[Offline Queue] Completed operation ${operation.id}`)
      } catch (error) {
        console.error(
          `[Offline Queue] Failed operation ${operation.id}:`,
          error
        )

        operation.retries++
        if (operation.retries >= this.MAX_RETRIES) {
          console.warn(
            `[Offline Queue] Removing operation ${operation.id} after ${this.MAX_RETRIES} retries`
          )
          this.removeFromQueue(operation.id)
        }
      }
    }

    this.saveQueue()
    this.isProcessing = false
  }

  /**
   * Execute a queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    const method =
      operation.type === 'CREATE'
        ? 'POST'
        : operation.type === 'UPDATE'
        ? 'PATCH'
        : 'DELETE'

    const response = await fetch(operation.endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: operation.data ? JSON.stringify(operation.data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  /**
   * Remove operation from queue
   */
  private removeFromQueue(id: string) {
    this.queue = this.queue.filter((op) => op.id !== id)
  }

  /**
   * Clear entire queue
   */
  clear() {
    this.queue = []
    this.saveQueue()
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length
  }

  /**
   * Get all queued operations
   */
  getAll(): QueuedOperation[] {
    return [...this.queue]
  }

  /**
   * Save queue to localStorage
   */
  private saveQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue))
    } catch (error) {
      console.warn('[Offline Queue] Failed to save queue:', error)
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.queue = JSON.parse(stored)
        console.log(`[Offline Queue] Loaded ${this.queue.length} operations`)
      }
    } catch (error) {
      console.warn('[Offline Queue] Failed to load queue:', error)
      this.queue = []
    }
  }

  /**
   * Setup online event listener
   */
  private setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('[Offline Queue] Back online, processing queue...')
      this.processQueue()
    })
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue()

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return navigator.onLine
}

/**
 * Check if user is offline
 */
export function isOffline(): boolean {
  return !navigator.onLine
}

/**
 * Execute fetch with offline fallback
 */
export async function fetchWithOfflineSupport(
  endpoint: string,
  options?: RequestInit & { offlineSupport?: boolean }
): Promise<Response> {
  if (isOffline() && options?.offlineSupport) {
    // Queue operation for later
    const method = options.method || 'GET'
    const type =
      method === 'POST'
        ? 'CREATE'
        : method === 'PATCH' || method === 'PUT'
        ? 'UPDATE'
        : method === 'DELETE'
        ? 'DELETE'
        : 'CREATE'

    const operationId = offlineQueue.add(
      type,
      endpoint,
      options.body ? JSON.parse(options.body as string) : null
    )

    // Return fake response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Operation queued for sync',
        operationId,
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Normal fetch
  return fetch(endpoint, options)
}

/**
 * Hook for online/offline status
 */
export function useOnlineStatus() {
  const [online, setOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return online
}

import React from 'react'
