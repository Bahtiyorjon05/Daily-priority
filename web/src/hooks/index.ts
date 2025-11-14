/**
 * Hooks Index
 * Central export point for all custom hooks
 */

// Task Hooks
export { useTaskFiltering } from './useTaskFiltering'
export { useTaskOperations } from './useTaskOperations'

// @deprecated Use @/lib/location-service instead for unified location handling
export { useUserLocation } from './useUserLocation'

// Existing Hooks
export { useTasks } from './use-tasks'
export { useUserStats } from './use-user-stats'
export { usePrayerTimes } from './use-prayer-times'
export { useDailyQuote } from './useDailyQuote'
export { useDataFetcher } from './use-data-fetcher'
export { useUserProfile } from './useUserProfile'
