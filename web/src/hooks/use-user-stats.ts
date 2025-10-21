'use client'

import { useDataFetcher } from './use-data-fetcher'
import type { UserStats } from '@/types/models'

export function useUserStats() {
  const { data, loading, error, refetch, invalidateCache } = useDataFetcher<{ success: boolean; data: UserStats }>(
    'user-stats',
    () => fetch('/api/user/stats').then(res => res.json()),
    { ttl: 2 * 60 * 1000 }
  )

  return {
    stats: data?.data ?? null,
    loading,
    error,
    refetchStats: refetch,
    invalidateCache,
  }
}
