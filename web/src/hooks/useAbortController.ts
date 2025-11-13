import { useEffect, useRef } from 'react'

/**
 * Custom hook to manage AbortController for fetch requests
 * Automatically aborts pending requests when component unmounts
 */
export function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Create a new AbortController on mount
    abortControllerRef.current = new AbortController()

    // Cleanup: abort any pending requests on unmount
    return () => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        try {
          abortControllerRef.current.abort('Component unmounted')
        } catch (error) {
          // Suppress abort errors during cleanup
        }
      }
    }
  }, [])

  // Function to get a new AbortController and signal
  const getController = () => {
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController()
    }
    return abortControllerRef.current
  }

  // Function to get the signal
  const getSignal = () => {
    return getController().signal
  }

  // Function to manually abort
  const abort = (reason?: string) => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      try {
        abortControllerRef.current.abort(reason || 'Request aborted')
      } catch (error) {
        // Suppress abort errors
      }
    }
  }

  // Function to reset the controller (for new requests)
  const reset = () => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      try {
        abortControllerRef.current.abort('Resetting controller')
      } catch (error) {
        // Suppress abort errors
      }
    }
    abortControllerRef.current = new AbortController()
  }

  return {
    controller: getController(),
    signal: getSignal(),
    abort,
    reset,
  }
}
