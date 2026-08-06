'use client'

import { useT } from '@/lib/i18n/client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MapPin, Loader2, AlertCircle, Sunrise, Sun, CloudSun, Sunset, Moon, Stars, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  fetchPrayerTimes,
  getCityFromCoordinates,
  getCurrentLocation,
  enhancePrayerTimes,
  getNextPrayer,
  type PrayerTime,
} from '@/lib/prayer-times'

/**
 * Prayer times, rebuilt around "The Prayer Day".
 *
 * The previous version was a fixed emerald gradient over a flat list of rows —
 * the same card you'd see in any productivity app, and it ignored the phase
 * system the rest of the dashboard already uses. It also gave no sense of
 * *where in the day* you are, which is the one thing this screen should convey.
 *
 * What's here instead:
 *  - the hero takes its colour from the current phase, so the card belongs to
 *    the surrounding surface instead of fighting it;
 *  - a countdown ring that fills as the next prayer approaches, so the wait is
 *    legible at a glance rather than needing arithmetic;
 *  - the five prayers drawn as the day's arc, with a marker showing how far
 *    through you are.
 *
 * Prayer names are keyed, so Bomdod/Peshin/Shom/Xufton appear under `uz`.
 */

const PRAYER_KEY: Record<string, string> = {
  Fajr: 'prayer.fajr',
  Sunrise: 'prayer.sunrise',
  Dhuhr: 'prayer.dhuhr',
  Asr: 'prayer.asr',
  Maghrib: 'prayer.maghrib',
  Isha: 'prayer.isha',
}

const PRAYER_ICON: Record<string, typeof Sun> = {
  Fajr: Sunrise,
  Sunrise: Sunrise,
  Dhuhr: Sun,
  Asr: CloudSun,
  Maghrib: Sunset,
  Isha: Stars,
}

/** Minutes since midnight for "HH:MM", or null when unparseable. */
function toMinutes(hhmm?: string): number | null {
  if (!hhmm) return null
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

export default function PrayerTimesWidget() {
  const { t } = useT()
  const reduceMotion = useReducedMotion()
  const [prayers, setPrayers] = useState<PrayerTime[]>([])
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null)
  const [location, setLocation] = useState<{ city: string; country: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [now, setNow] = useState(() => new Date())

  // One tick a minute is enough for a countdown measured in minutes, and it
  // keeps the widget from re-rendering the whole list every second.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const loadPrayerTimes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setLocationDenied(false)

      const position = await getCurrentLocation()
      const { latitude, longitude } = position.coords

      const prayerTimes = await fetchPrayerTimes(latitude, longitude, undefined, 1)
      if (!prayerTimes) throw new Error(t('ui.failedToFetchPrayerTimes'))

      const enhanced = enhancePrayerTimes(prayerTimes)
      setPrayers(enhanced)
      setNextPrayer(getNextPrayer(enhanced))
      setLocation(await getCityFromCoordinates(latitude, longitude))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message.includes('denied')) {
        setLocationDenied(true)
        setError(t('ui.locationAccessDeniedPleaseEnableLocationServ'))
      } else {
        setError(t('ui.failedToLoadPrayerTimesPleaseTryAgain'))
      }
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadPrayerTimes()
  }, [loadPrayerTimes])

  const daily = useMemo(() => prayers.filter(p => p.name !== 'Sunrise'), [prayers])

  /**
   * How far through the gap between the last prayer and the next.
   *
   * Used for both the ring and the arc marker. Falls back to 0 rather than
   * guessing when a time won't parse — a wrong position is worse than none.
   */
  const progress = useMemo(() => {
    if (!nextPrayer) return 0
    const nextMin = toMinutes(nextPrayer.time)
    if (nextMin === null) return 0

    const current = now.getHours() * 60 + now.getMinutes()
    const passed = daily.filter(p => p.passed)
    const prevMin = passed.length ? toMinutes(passed[passed.length - 1].time) : null

    // Before Fajr the "previous" prayer is yesterday's Isha; anchor on midnight
    // instead of inventing a negative span.
    const start = prevMin ?? 0
    const span = nextMin - start
    if (span <= 0) return 0
    return Math.min(1, Math.max(0, (current - start) / span))
  }, [nextPrayer, daily, now])

  const completedCount = daily.filter(p => p.passed).length

  return (
    <div className="phase-canvas overflow-hidden rounded-3xl border border-black/5 shadow-sm dark:border-white/10">
      {/* ── Hero: current phase colour, next prayer, countdown ring ───────── */}
      <div className="phase-hero relative overflow-hidden px-5 py-6 sm:px-6">
        {/* Islamic geometry as texture, per DESIGN.md — structural, not decorative */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E\")",
            backgroundSize: '34px 34px',
          }}
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
              {t('ui.prayerTimes')}
            </p>
            {location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-white/75">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location.city}</span>
              </p>
            )}
          </div>

          {daily.length > 0 && (
            <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
              {completedCount}/{daily.length}
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative flex flex-col items-center justify-center py-8"
            >
              <Loader2 className="mb-3 h-7 w-7 animate-spin text-white/80" />
              <p className="text-sm text-white/80">{t('ui.loadingPrayerTimes')}</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative py-6 text-center"
            >
              <AlertCircle className="mx-auto mb-3 h-7 w-7 text-white/85" />
              <p className="mb-1 text-sm text-white/90">{error}</p>
              {locationDenied && (
                <p className="mb-4 text-xs text-white/70">
                  {t('ui.youCanEnableLocationAccessInYourBrowserSetti')}
                </p>
              )}
              <Button
                onClick={loadPrayerTimes}
                size="sm"
                className="mt-2 bg-white/20 text-white backdrop-blur-sm hover:bg-white/30"
              >
                {t('ui.tryAgain')}
              </Button>
            </motion.div>
          ) : nextPrayer ? (
            <motion.div
              key="next"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative mt-5 flex items-center gap-5"
            >
              <CountdownRing progress={progress} reduceMotion={reduceMotion}>
                {(() => {
                  const Icon = PRAYER_ICON[nextPrayer.name] ?? Moon
                  return <Icon className="h-6 w-6 text-white" />
                })()}
              </CountdownRing>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                  {t('ui.nextPrayer')}
                </p>
                <p className="mt-0.5 truncate text-2xl font-bold text-white sm:text-3xl">
                  {t(PRAYER_KEY[nextPrayer.name] ?? nextPrayer.name)}
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                  <span className="font-mono text-lg font-semibold text-white/95">
                    {nextPrayer.time}
                  </span>
                  {nextPrayer.nextPrayerIn && (
                    <span className="text-sm text-white/75">
                      {t('ui.inDuration', { duration: nextPrayer.nextPrayerIn })}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── The day's arc ─────────────────────────────────────────────── */}
        {!loading && !error && daily.length > 0 && (
          <div className="relative mt-6">
            <div className="relative h-1 rounded-full bg-white/20">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-white/70"
                initial={false}
                animate={{ width: `${(completedCount / daily.length) * 100}%` }}
                transition={{ duration: reduceMotion ? 0 : 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="mt-2 flex justify-between">
              {daily.map(p => {
                const isNext = p.name === nextPrayer?.name
                return (
                  <div key={p.name} className="flex flex-col items-center gap-1">
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        isNext
                          ? 'bg-white ring-2 ring-white/40'
                          : p.passed
                            ? 'bg-white/70'
                            : 'bg-white/25'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-medium ${
                        isNext ? 'text-white' : 'text-white/55'
                      }`}
                    >
                      {t(PRAYER_KEY[p.name] ?? p.name)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── The five prayers ──────────────────────────────────────────────── */}
      {!loading && !error && daily.length > 0 && (
        <div className="bg-white/70 p-3 backdrop-blur-sm dark:bg-slate-900/50">
          <ul className="space-y-1">
            {daily.map((prayer, index) => {
              const isNext = prayer.name === nextPrayer?.name
              const Icon = PRAYER_ICON[prayer.name] ?? Moon
              return (
                <motion.li
                  key={prayer.name}
                  initial={{ opacity: 0, x: reduceMotion ? 0 : -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.04, duration: 0.3 }}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                    isNext
                      ? 'bg-[rgb(var(--phase-accent)/0.12)] ring-1 ring-[rgb(var(--phase-accent)/0.35)]'
                      : prayer.passed
                        ? 'opacity-55'
                        : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                      isNext
                        ? 'bg-[rgb(var(--phase-accent)/0.18)] text-[rgb(var(--phase-ink-on-surface))]'
                        : 'bg-black/[0.04] text-slate-500 dark:bg-white/[0.06] dark:text-slate-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold ${
                        isNext
                          ? 'text-[rgb(var(--phase-ink-on-surface))]'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {t(PRAYER_KEY[prayer.name] ?? prayer.name)}
                    </p>
                    {prayer.arabicName && (
                      <p
                        dir="rtl"
                        className="truncate font-[family-name:var(--font-amiri)] text-xs text-slate-500 dark:text-slate-400"
                      >
                        {prayer.arabicName}
                      </p>
                    )}
                  </div>

                  <span
                    className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${
                      isNext
                        ? 'text-[rgb(var(--phase-ink-on-surface))]'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {prayer.time}
                  </span>
                </motion.li>
              )
            })}
          </ul>

          <Button
            variant="ghost"
            className="mt-2 w-full justify-center gap-1.5 text-sm font-medium text-[rgb(var(--phase-ink-on-surface))] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            onClick={() => (window.location.href = '/prayers')}
          >
            {t('ui.viewAllPrayerTimes')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Countdown ring.
 *
 * An SVG arc rather than a bar: it reads as a clock face, which is what the
 * value actually is, and it fits beside the prayer name without taking a row
 * of its own.
 */
function CountdownRing({
  progress,
  reduceMotion,
  children,
}: {
  progress: number
  reduceMotion: boolean | null
  children: React.ReactNode
}) {
  const radius = 26
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative h-[68px] w-[68px] shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 68 68" aria-hidden>
        <circle cx="34" cy="34" r={radius} fill="none" stroke="rgb(255 255 255 / 0.2)" strokeWidth="4" />
        <motion.circle
          cx="34"
          cy="34"
          r={radius}
          fill="none"
          stroke="rgb(255 255 255 / 0.9)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: reduceMotion ? 0 : 0.8, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </div>
  )
}
