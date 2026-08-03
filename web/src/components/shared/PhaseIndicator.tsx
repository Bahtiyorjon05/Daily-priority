'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sunrise, Sun, CloudSun, Sunset, Moon, Stars, Check } from 'lucide-react'
import { usePrayerPhase } from './PrayerPhaseProvider'
import { PHASE_META, type PrayerPhase } from '@/lib/prayer-phase'
import { useModalBehavior } from '@/hooks/useModalBehavior'

const ICONS: Record<PrayerPhase, React.ElementType> = {
  dawn: Sunrise,
  morning: Sun,
  midday: CloudSun,
  afternoon: Sunset,
  dusk: Moon,
  night: Stars,
}

const ORDER: PrayerPhase[] = ['dawn', 'morning', 'midday', 'afternoon', 'dusk', 'night']

/**
 * Shows the current period of the prayer day and lets the user pin it.
 * Sits in the dashboard header next to the other controls.
 */
export function PhaseIndicator() {
  const { phase, label, prayer, preference, setPreference, usingFallback } = usePrayerPhase()
  const [open, setOpen] = useState(false)
  const modal = useModalBehavior(open, () => setOpen(false))
  const Icon = ICONS[phase]

  return (
    <div className="relative" data-dropdown>
      {/* The trigger carries the current atmosphere itself, so the time of day
          is legible at a glance without opening the panel. */}
      <button
        onClick={() => setOpen((v) => !v)}
        title={`${label}${prayer ? ` · ${prayer}` : ''}`}
        aria-label={`Time of day: ${label}. Change appearance.`}
        className="phase-hero flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-2xl shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:scale-105 dark:ring-white/10"
      >
        <Icon className="h-5 w-5 text-white drop-shadow-sm" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-[2px] sm:hidden"
              aria-hidden="true"
            />
            <motion.div
              ref={modal.ref}
              {...modal.dialogProps}
              aria-label="Appearance"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="fixed left-3 right-3 top-[4.5rem] mx-auto max-w-xs
                         sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 sm:max-w-none
                         z-[70] overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            >
              {/* Uses the hero gradient, not `.phase-surface` — the surface wash
                  is near-white in light mode, so it showed nothing at all. */}
              <div className="phase-hero px-4 py-3.5">
                <p className="text-sm font-semibold text-white drop-shadow-sm">{label}</p>
                <p className="text-xs text-white/80">
                  {prayer ? `Between ${prayer} and the next prayer` : 'Between sunrise and Dhuhr'}
                </p>
              </div>

              <div className="p-2">
                <button
                  onClick={() => {
                    setPreference('auto')
                    setOpen(false)
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-muted-foreground" />
                    Follow the prayer day
                  </span>
                  {preference === 'auto' && <Check className="phase-accent h-4 w-4" />}
                </button>

                {/* Each option previews its own atmosphere. Without a swatch all
                    six looked identical on a light panel — you couldn't tell
                    dawn from night. */}
                <div className="mt-1 grid grid-cols-3 gap-1.5 p-1">
                  {ORDER.map((p) => {
                    const PIcon = ICONS[p]
                    const active = preference === p
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          setPreference(p)
                          setOpen(false)
                        }}
                        aria-pressed={active}
                        className={`group flex flex-col items-center gap-1.5 rounded-xl p-1.5 transition-all ${
                          active
                            ? 'bg-gray-100 ring-2 ring-gray-900 dark:bg-gray-800 dark:ring-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span
                          className={`swatch-${p} relative flex h-11 w-full items-center justify-center rounded-lg shadow-sm`}
                        >
                          <PIcon className="h-4 w-4 text-white drop-shadow" />
                          {active && (
                            <Check className="absolute right-1 top-1 h-3 w-3 text-white drop-shadow" />
                          )}
                        </span>
                        <span
                          className={`text-[10px] leading-none ${
                            active
                              ? 'font-semibold text-gray-900 dark:text-white'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {PHASE_META[p].label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {usingFallback && (
                <p className="border-t border-gray-100 px-4 py-2 text-[11px] leading-snug text-muted-foreground dark:border-gray-800">
                  Using an approximate clock. Open Prayers once to sync with your real prayer times.
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
