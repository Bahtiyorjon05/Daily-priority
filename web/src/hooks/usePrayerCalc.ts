'use client'

import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_CALC, type PrayerCalc } from '@/lib/prayer-times'

/**
 * The user's prayer calculation convention, shared by every surface that shows a
 * time.
 *
 * One hook because the two surfaces that fetch prayer times used to each pass
 * their own literal — both Hanafi, as it happens, while two other code paths
 * defaulted to Shafi'i. Four places deciding this independently is how an app
 * ends up showing two different Asr times depending on which screen you are on.
 *
 * Starts from the default rather than null so the first render can already fetch:
 * waiting for the preference before asking for times would add a round trip to
 * the one number people open the app for.
 */
export function usePrayerCalc() {
  const [calc, setCalc] = useState<PrayerCalc>(DEFAULT_CALC)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/user/prayer-calc', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json?.data) return
        const { asrSchool, calculationMethod } = json.data
        setCalc({
          school: asrSchool === 0 ? 0 : 1,
          method: Number(calculationMethod) || DEFAULT_CALC.method,
        })
      })
      .catch(() => {
        /* Defaults already in state; a failed read must not block prayer times. */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  /** Persists and updates locally, so callers can refetch times immediately. */
  const save = useCallback(async (next: Partial<PrayerCalc>) => {
    const merged = { ...calc, ...next }
    setCalc(merged)
    const res = await fetch('/api/user/prayer-calc', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        asrSchool: merged.school,
        calculationMethod: merged.method,
      }),
    })
    if (!res.ok) {
      // Put it back: showing a school the server rejected would be a lie about
      // which times are on screen.
      setCalc(calc)
      throw new Error('Failed to save prayer settings')
    }
    return merged
  }, [calc])

  return { calc, loaded, save }
}
