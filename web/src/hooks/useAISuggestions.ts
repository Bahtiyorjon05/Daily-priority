/**
 * useAISuggestions Hook
 * Centralized AI suggestions logic
 * Consolidates duplicate AI logic from 10+ components
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Task } from '@/types/models'
import { EnergyLevel } from '@/types/models'
import type { AISuggestRequest, AISuggestion } from '@/types/api'

interface UseAISuggestionsProps {
  userId?: string
  tasks?: Task[]
  onAcceptSuggestion?: (suggestion: AISuggestion) => void
}

export function useAISuggestions({ userId, tasks = [], onAcceptSuggestion }: UseAISuggestionsProps = {}) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [insights, setInsights] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Build user context for AI
  const buildUserContext = useCallback(() => {
    const now = new Date()
    const completedTasks = tasks
      .filter(t => t.status === 'COMPLETED')
      .slice(0, 10)
      .map(t => t.title)

    const recentActivities = tasks
      .slice(0, 5)
      .map(t => `${t.title} - ${t.status}`)

    // Determine current energy level based on time of day
    const hour = now.getHours()
    let energyLevel: EnergyLevel = EnergyLevel.MEDIUM
    if (hour >= 6 && hour < 12) energyLevel = EnergyLevel.HIGH
    else if (hour >= 12 && hour < 17) energyLevel = EnergyLevel.MEDIUM
    else energyLevel = EnergyLevel.LOW

    return {
      completedTasks,
      currentTime: now.toLocaleTimeString(),
      userGoals: 'Improve productivity and maintain work-life balance',
      energyLevel,
      recentActivities,
    }
  }, [tasks])

  // Fetch AI suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!userId) {
      setError('User ID is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const requestData: AISuggestRequest = {
        userContext: buildUserContext(),
        requestType: 'task_suggestions',
      }

      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch AI suggestions')
      }

      const result = await response.json()

      if (result.success) {
        setSuggestions(result.data.suggestions || [])
        setInsights(result.data.insights || [])
        toast.success('AI suggestions loaded')
      } else {
        throw new Error(result.error || 'Failed to get suggestions')
      }
    } catch (err) {
      const error = err as Error
      setError(error.message)
      toast.error(error.message || 'Failed to get AI suggestions')
    } finally {
      setIsLoading(false)
    }
  }, [userId, buildUserContext])

  // Fetch productivity insights
  const fetchInsights = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const requestData: AISuggestRequest = {
        userContext: buildUserContext(),
        requestType: 'productivity_insights',
      }

      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch insights')
      }

      const result = await response.json()

      if (result.success) {
        setInsights(result.data.insights || [])
      }
    } catch (err) {
      const error = err as Error
      setError(error.message)
      console.error('Failed to fetch insights:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId, buildUserContext])

  // Accept a suggestion
  const acceptSuggestion = useCallback(
    (suggestion: AISuggestion) => {
      onAcceptSuggestion?.(suggestion)
      // Remove accepted suggestion from list
      setSuggestions(prev => prev.filter(s => s.title !== suggestion.title))
      toast.success('Suggestion accepted')
    },
    [onAcceptSuggestion]
  )

  // Dismiss a suggestion
  const dismissSuggestion = useCallback((suggestionTitle: string) => {
    setSuggestions(prev => prev.filter(s => s.title !== suggestionTitle))
  }, [])

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setInsights([])
  }, [])

  return {
    suggestions,
    insights,
    isLoading,
    error,
    fetchSuggestions,
    fetchInsights,
    acceptSuggestion,
    dismissSuggestion,
    clearSuggestions,
  }
}
