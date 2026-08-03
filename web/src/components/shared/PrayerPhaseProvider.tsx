'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  resolvePhase,
  PHASE_META,
  type PhaseTimes,
  type PrayerPhase,
} from '@/lib/prayer-phase'

type PhasePreference = PrayerPhase | 'auto'

interface PhaseContextValue {
  /** The phase currently applied to the UI. */
  phase: PrayerPhase
  label: string
  prayer: string | null
  /** 'auto' follows the prayer day; anything else pins the atmosphere. */
  preference: PhasePreference
  setPreference: (p: PhasePreference) => void
  /** True while we're still using the clock fallback (no prayer times known). */
  usingFallback: boolean
}

const PhaseContext = createContext<PhaseContextValue>({
  phase: 'morning',
  label: 'Morning',
  prayer: null,
  preference: 'auto',
  setPreference: () => {},
  usingFallback: true,
})

export const usePrayerPhase = () => useContext(PhaseContext)

const PREF_KEY = 'dp-phase-preference'
const TIMES_KEY = 'dailypriority_prayer_times'

/**
 * Applies "The Prayer Day" atmosphere by setting `data-phase` on <html>.
 *
 * Reads the prayer times the Prayers page already caches — no extra request and
 * no location prompt. Falls back to a clock-based approximation until those
 * exist, so the app always has a coherent atmosphere.
 */
export function PrayerPhaseProvider({ children }: { children: React.ReactNode }) {
  const [times, setTimes] = useState<PhaseTimes | null>(null)
  const [preference, setPreferenceState] = useState<PhasePreference>('auto')
  const [resolved, setResolved] = useState(() => resolvePhase(null))

  // Restore the user's override.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREF_KEY) as PhasePreference | null
      if (saved && (saved === 'auto' || saved in PHASE_META)) setPreferenceState(saved)
    } catch {
      /* storage unavailable */
    }
  }, [])

  // Pick up cached prayer times (and changes from other tabs).
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(TIMES_KEY)
        if (!raw) return
        const data = JSON.parse(raw)
        if (data?.date !== new Date().toDateString() || !data?.prayerTimes) {
          setTimes(null)
          return
        }
        setTimes(data.prayerTimes as PhaseTimes)
      } catch {
        /* malformed cache */
      }
    }
    load()
    const onStorage = (e: StorageEvent) => {
      if (e.key === TIMES_KEY) load()
    }
    window.addEventListener('storage', onStorage)
    const refresh = setInterval(load, 5 * 60 * 1000)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(refresh)
    }
  }, [])

  // Re-evaluate on a slow tick and whenever the tab regains focus.
  useEffect(() => {
    const tick = () => setResolved(resolvePhase(times))
    tick()
    const interval = setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [times])

  const active: PrayerPhase = preference === 'auto' ? resolved.phase : preference

  // Paint it.
  useEffect(() => {
    document.documentElement.setAttribute('data-phase', active)
  }, [active])

  const setPreference = useCallback((p: PhasePreference) => {
    setPreferenceState(p)
    try {
      localStorage.setItem(PREF_KEY, p)
    } catch {
      /* ignore */
    }
  }, [])

  const meta = PHASE_META[active]

  return (
    <PhaseContext.Provider
      value={{
        phase: active,
        label: meta.label,
        prayer: meta.prayer,
        preference,
        setPreference,
        usingFallback: times === null,
      }}
    >
      {children}
    </PhaseContext.Provider>
  )
}
