'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface DailyQuote {
  id: string
  text: string
  author: string
  source: string | null
  category: string | null
  arabic?: string | null
}

export function useDailyQuote() {
  const { data: session } = useSession()
  const [quote, setQuote] = useState<DailyQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDailyQuote = async () => {
    try {
      setLoading(true)
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort('Request timeout'), 15000) // 15 second timeout

      const response = await fetch('/api/quotes/daily', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch daily quote')
      }

      // API shape: { quote }
      setQuote(result.quote)
    } catch (err) {
      // Silently use fallback quote without logging (not critical)
      setError(null) // Don't show error to user
      
      // Fallback quote for new users or errors
      setQuote({
        id: 'fallback',
        text: 'And whoever relies upon Allah – then He is sufficient for him.',
        author: 'Allah (SWT)',
        source: 'Quran 65:3',
        category: 'Quran',
        arabic: null,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDailyQuote()
  }, [session])

  return {
    quote,
    loading,
    error,
    refetch: fetchDailyQuote,
  }
}

