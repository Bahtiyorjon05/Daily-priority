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
      <button
        onClick={() => setOpen((v) => !v)}
        title={`${label}${prayer ? ` · ${prayer}` : ''}`}
        aria-label={`Time of day: ${label}. Change appearance.`}
        className="phase-glow flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-2xl bg-gray-100 transition-all duration-200 hover:scale-105 dark:bg-gray-800"
      >
        <Icon className="phase-accent h-5 w-5" />
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
              <div className="phase-surface border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
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

                <div className="mt-1 grid grid-cols-3 gap-1 p-1">
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
                        title={PHASE_META[p].label}
                        className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition-colors ${
                          active
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        <PIcon className="h-4 w-4" />
                        {PHASE_META[p].label}
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
