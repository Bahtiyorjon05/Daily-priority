'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Volume2, VolumeX, X, Info } from 'lucide-react'
import { playAdhan, stopAdhan, unlockAdhanAudio } from '@/lib/adhan-audio'
import { todayKey } from '@/lib/date-utils'

interface PrayerTimes {
  fajr?: string
  dhuhr?: string
  asr?: string
  maghrib?: string
  isha?: string
}

const MUTE_KEY = 'dp-adhan-muted'
const FIRED_KEY = 'dp-adhan-fired'

/** Minutes since local midnight for an "HH:MM" string, or null. */
function toMinutes(hhmm?: string): number | null {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function loadFired(): Set<string> {
  try {
    const raw = JSON.parse(localStorage.getItem(FIRED_KEY) || '{}')
    if (raw.day !== todayKey()) return new Set()
    return new Set<string>(raw.slots || [])
  } catch {
    return new Set()
  }
}

function saveFired(slots: Set<string>) {
  try {
    localStorage.setItem(FIRED_KEY, JSON.stringify({ day: todayKey(), slots: [...slots] }))
  } catch {
    /* ignore */
  }
}

/**
 * Plays the adhan when a prayer time arrives while the app is open.
 * Mounted once from the dashboard layout.
 */
export function AdhanPlayer() {
  const [times, setTimes] = useState<PrayerTimes | null>(null)
  const [muted, setMuted] = useState(false)
  const [nowPlaying, setNowPlaying] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)
  const firedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    try {
      setMuted(localStorage.getItem(MUTE_KEY) === '1')
    } catch {}
    firedRef.current = loadFired()

    // Autoplay needs a prior user gesture — arm it on the first interaction.
    const arm = () => unlockAdhanAudio()
    window.addEventListener('pointerdown', arm, { once: true })
    window.addEventListener('keydown', arm, { once: true })
    return () => {
      window.removeEventListener('pointerdown', arm)
      window.removeEventListener('keydown', arm)
    }
  }, [])

  // Read today's prayer times from the cache the Prayers page already writes
  // (`dailypriority_prayer_times`). No network call and no location prompt —
  // the adhan simply stays idle until the user has visited Prayers once.
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('dailypriority_prayer_times')
        if (!raw) return
        const data = JSON.parse(raw)
        if (data?.date !== new Date().toDateString() || !data?.prayerTimes) {
          setTimes(null)
          return
        }
        const t = data.prayerTimes
        setTimes({
          fajr: t.fajr, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha,
        })
      } catch {
        /* malformed cache — ignore */
      }
    }
    load()
    // Pick up times written by the Prayers page in this or another tab.
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dailypriority_prayer_times') load()
    }
    window.addEventListener('storage', onStorage)
    const refresh = setInterval(load, 5 * 60 * 1000)
    return () => {
      window.removeEventListener('storage', onStorage)
      clearInterval(refresh)
    }
  }, [])

  const trigger = useCallback(
    async (name: string) => {
      firedRef.current.add(name)
      saveFired(firedRef.current)
      if (muted) return
      setNowPlaying(name)
      const how = await playAdhan({ isFajr: name === 'Fajr', volume: 0.85 })
      setUsedFallback(how !== 'adhan')
    },
    [muted]
  )

  // Check every 20s whether a prayer time has just arrived.
  useEffect(() => {
    if (!times) return

    const check = () => {
      // New day: allow every slot to fire again.
      const stored = loadFired()
      if (stored.size === 0 && firedRef.current.size > 0) firedRef.current = new Set()

      const now = new Date()
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      const slots: [string, string | undefined][] = [
        ['Fajr', times.fajr],
        ['Dhuhr', times.dhuhr],
        ['Asr', times.asr],
        ['Maghrib', times.maghrib],
        ['Isha', times.isha],
      ]
      for (const [name, hhmm] of slots) {
        const at = toMinutes(hhmm)
        if (at == null || firedRef.current.has(name)) continue
        // Fire within a 2-minute window so a backgrounded tab still catches it.
        if (nowMinutes >= at && nowMinutes < at + 2) {
          trigger(name)
          break
        }
      }
    }

    check()
    const interval = setInterval(check, 20000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', check)
    }
  }, [times, trigger])

  const dismiss = () => {
    stopAdhan()
    setNowPlaying(null)
    setUsedFallback(false)
  }

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m
      try {
        localStorage.setItem(MUTE_KEY, next ? '1' : '0')
      } catch {}
      if (next) stopAdhan()
      return next
    })
  }

  return (
    <AnimatePresence>
      {nowPlaying && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          role="status"
          aria-live="polite"
          className="fixed left-3 right-3 top-3 z-[110] mx-auto max-w-sm sm:left-auto sm:right-4 sm:max-w-xs"
        >
          <div className="overflow-hidden rounded-2xl border-2 border-emerald-300 bg-white/95 shadow-2xl backdrop-blur dark:border-emerald-700/60 dark:bg-gray-900/95">
            <div className="flex items-center gap-3 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                🕌
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  It&apos;s time for {nowPlaying}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {muted ? 'Adhan muted' : 'Playing adhan…'}
                </p>
              </div>
              <button
                onClick={toggleMute}
                aria-label={muted ? 'Unmute adhan' : 'Mute adhan'}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {usedFallback && (
              <p className="flex items-start gap-1.5 border-t border-emerald-100 bg-emerald-50/60 px-3 py-2 text-[11px] text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                Playing a chime — add <code className="mx-1">public/audio/adhan.mp3</code> for the full adhan.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
