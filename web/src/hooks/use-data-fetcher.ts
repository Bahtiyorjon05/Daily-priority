'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { PerformanceMonitor } from '@/lib/performance-monitor'

interface UseDataFetcherOptions {
  cacheKey?: string
  ttl?: number // Time to live in milliseconds
  retryAttempts?: number
  retryDelay?: number
}

interface CacheItem<T> {
  data: T
  timestamp: number
  error?: string
}

// In-memory cache
const cache = new Map<string, CacheItem<any>>()

export function useDataFetcher<T>(
  key: string,
  fetcher: (signal?: AbortSignal) => Promise<T>,
  options: UseDataFetcherOptions = {}
) {
  const {
    cacheKey = key,
    ttl = 5 * 60 * 1000, // 5 minutes default
    retryAttempts = 3,
    retryDelay = 1000
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    abortControllerRef.current?.abort('New fetch started')
    const controller = new AbortController()
    abortControllerRef.current = controller
    const stopMonitoring = PerformanceMonitor.start(`fetch-${key}`)
    
    try {
      setLoading(true)
      setError(null)

      // Check cache first
      const cachedItem = cache.get(cacheKey)
      if (cachedItem && Date.now() - cachedItem.timestamp < ttl) {
        if (cachedItem.error) {
          throw new Error(cachedItem.error)
        }
        setData(cachedItem.data)
        setLoading(false)
        stopMonitoring()
        return
      }

      let lastError: any = null
      
      // Retry logic
      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          const result = await fetcher(controller.signal)
          
          // Cache the result
          cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          })
          
          if (!controller.signal.aborted) {
            setData(result)
            setLoading(false)
          }
          stopMonitoring()
          return
        } catch (err) {
          lastError = err
          
          if (attempt < retryAttempts) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
            continue
          }
          
          // Cache the error for the TTL duration
          cache.set(cacheKey, {
            data: null,
            timestamp: Date.now(),
            error: err instanceof Error ? err.message : 'Unknown error'
          })
          
          throw err
        }
      }
    } catch (err) {
      // Ignore abort errors (component unmounted or request cancelled)
      if (err instanceof Error && err.name === 'AbortError') {
        stopMonitoring()
        return
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(errorMessage)
      setLoading(false)
      stopMonitoring()
    }
  }, [key, cacheKey, ttl, retryAttempts, retryDelay, fetcher])

  const invalidateCache = useCallback(() => {
    cache.delete(cacheKey)
  }, [cacheKey])

  useEffect(() => {
    fetchData()
    
    // Cleanup: abort pending requests when component unmounts or dependencies change
    return () => {
      abortControllerRef.current?.abort('Component unmounted')
    }
  }, [fetchData])

  return { data, loading, error, refetch: fetchData, invalidateCache }
}
