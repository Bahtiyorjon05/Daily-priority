'use client'

import { useT } from '@/lib/i18n/client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MapPin, Loader2, AlertCircle, Sunrise, Sun, CloudSun, Sunset, Moon, Stars, ArrowRight } from 'lucide-react'
import { usePrayerPhase } from '@/components/shared/PrayerPhaseProvider'
import {
  fetchPrayerTimes,
  getCityFromCoordinates,
  getCurrentLocation,
  enhancePrayerTimes,
  getNextPrayer,
  type PrayerTime,
} from '@/lib/prayer-times'
import { usePrayerCalc } from '@/hooks/usePrayerCalc'

/**
 * Prayer times.
 *
 * The panel is painted with `.sky` — a three-stop gradient plus a radial glow
 * positioned where the sun (or moon) actually is for that phase. The previous
 * version used a two-stop `--phase-hero` pair that ran dark and desaturated;
 * afternoon was rgb(124 45 18) → rgb(146 64 14), which is mud, and midday had
 * almost no travel between its stops. It looked like a dark card rather than a
 * time of day.
 *
 * Because the sky now runs *light* at the horizon, text sits on `.sky-scrim`
 * rather than directly on the gradient — that's what lets the palette stay
 * luminous without white text failing contrast over Dhuhr's pale band.
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
  const { phase } = usePrayerPhase()
  // Hanafi or Shafi'i, per user. Was a literal `1` here and a literal `0` in
  // two other paths.
  const { calc } = usePrayerCalc()
  const reduceMotion = useReducedMotion()

  const [prayers, setPrayers] = useState<PrayerTime[]>([])
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null)
  const [location, setLocation] = useState<{ city: string; country: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [now, setNow] = useState(() => new Date())

  // A countdown measured in minutes doesn't need a per-second re-render.
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

      const times = await fetchPrayerTimes(latitude, longitude, undefined, calc)
      if (!times) throw new Error(t('ui.failedToFetchPrayerTimes'))

      const enhanced = enhancePrayerTimes(times)
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
  const completed = daily.filter(p => p.passed).length

  /** How far through the gap between the last prayer and the next. */
  const progress = useMemo(() => {
    if (!nextPrayer) return 0
    const nextMin = toMinutes(nextPrayer.time)
    if (nextMin === null) return 0

    const current = now.getHours() * 60 + now.getMinutes()
    const passed = daily.filter(p => p.passed)
    // Before Fajr the previous prayer is yesterday's Isha; anchor on midnight
    // rather than inventing a negative span.
    const start = passed.length ? (toMinutes(passed[passed.length - 1].time) ?? 0) : 0
    const span = nextMin - start
    if (span <= 0) return 0
    return Math.min(1, Math.max(0, (current - start) / span))
  }, [nextPrayer, daily, now])

  return (
    <section className="sky relative overflow-hidden rounded-[28px] shadow-[0_18px_50px_-18px_rgb(0_0_0/0.55)] ring-1 ring-white/10">
      {/* Stars, only at night. Deterministic positions so they don't jump on
          every render. */}
      {phase === 'night' && !reduceMotion && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {STAR_FIELD.map((s, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full bg-white"
              style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r }}
              animate={{ opacity: [0.15, 0.75, 0.15] }}
              transition={{ duration: s.d, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* Islamic geometry as structure, per DESIGN.md — a woven eight-point
          lattice rather than a generic dot pattern. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23fff' stroke-width='1'%3E%3Cpath d='M40 0l40 40-40 40L0 40z'/%3E%3Cpath d='M40 12l28 28-28 28-28-28z'/%3E%3Ccircle cx='40' cy='40' r='9'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: '52px 52px',
        }}
      />

      {/* Horizon lift: a soft light bloom along the bottom edge, so the panel
          reads as sky meeting ground rather than as a flat rectangle. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ backgroundImage: 'linear-gradient(to top, rgb(var(--sky-glow) / 0.22), transparent)' }}
      />

      <div className="sky-scrim relative px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
              {t('ui.prayerTimes')}
            </p>
            {location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-white/70">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location.city}</span>
              </p>
            )}
          </div>

          {daily.length > 0 && (
            <div className="shrink-0 rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold text-white ring-1 ring-white/20 backdrop-blur-md">
              {completed}/{daily.length}
            </div>
          )}
        </div>

        {/* ── Next prayer ────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10"
            >
              <Loader2 className="mb-3 h-7 w-7 animate-spin text-white/80" />
              <p className="text-sm text-white/75">{t('ui.loadingPrayerTimes')}</p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-7 text-center"
            >
              <AlertCircle className="mx-auto mb-3 h-7 w-7 text-white/85" />
              <p className="text-sm text-white/90">{error}</p>
              {locationDenied && (
                <p className="mt-1 text-xs text-white/65">
                  {t('ui.youCanEnableLocationAccessInYourBrowserSetti')}
                </p>
              )}
              {/* Plain button for the same reason as the one below: the default
                  variant's `hover:bg-primary/90` competes with the local hover
                  colour on emit order, not on class order. */}
              <button
                type="button"
                onClick={loadPrayerTimes}
                className="mt-4 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/25"
              >
                {t('ui.tryAgain')}
              </button>
            </motion.div>
          ) : nextPrayer ? (
            <motion.div
              key="next"
              initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 flex items-center gap-5"
            >
              <CountdownRing progress={progress} reduceMotion={reduceMotion}>
                {(() => {
                  const Icon = PRAYER_ICON[nextPrayer.name] ?? Moon
                  return <Icon className="h-7 w-7 text-white drop-shadow" />
                })()}
              </CountdownRing>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">
                  {t('ui.nextPrayer')}
                </p>
                <p className="mt-1 truncate text-[28px] font-bold leading-tight text-white drop-shadow-sm sm:text-[34px]">
                  {t(PRAYER_KEY[nextPrayer.name] ?? nextPrayer.name)}
                </p>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-xl font-semibold tabular-nums text-white/95">
                    {nextPrayer.time}
                  </span>
                  {nextPrayer.nextPrayerIn && (
                    <span className="rounded-full bg-white/12 px-2.5 py-0.5 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur-md">
                      {t('ui.inDuration', { duration: nextPrayer.nextPrayerIn })}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── The day's arc ──────────────────────────────────────────────── */}
        {!loading && !error && daily.length > 0 && (
          <div className="mt-7">
            <div className="relative h-[3px] rounded-full bg-white/18">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-white/85 shadow-[0_0_12px_rgb(255_255_255/0.6)]"
                initial={false}
                animate={{ width: `${(completed / daily.length) * 100}%` }}
                transition={{ duration: reduceMotion ? 0 : 0.7, ease: 'easeOut' }}
              />
            </div>

            <div className="mt-2.5 grid grid-cols-5 gap-1">
              {daily.map(p => {
                const isNext = p.name === nextPrayer?.name
                return (
                  <div key={p.name} className="flex flex-col items-center gap-1.5">
                    <span
                      className={
                        isNext
                          ? 'h-2 w-2 rounded-full bg-white ring-4 ring-white/25'
                          : p.passed
                            ? 'h-1.5 w-1.5 rounded-full bg-white/75'
                            : 'h-1.5 w-1.5 rounded-full bg-white/25'
                      }
                    />
                    <span
                      className={`truncate text-[10px] font-medium ${isNext ? 'text-white' : 'text-white/55'}`}
                    >
                      {t(PRAYER_KEY[p.name] ?? p.name)}
                    </span>
                    <span
                      className={`font-mono text-[10px] tabular-nums ${isNext ? 'text-white/90' : 'text-white/40'}`}
                    >
                      {p.time}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Detail list ────────────────────────────────────────────────────
          An ordinary opaque surface, not glass over the sky.

          Translucent-over-gradient meant every foreground colour had to be
          white and every contrast ratio depended on which part of the gradient
          sat behind it — that's how "View All Prayer Times" ended up
          unreadable. The sky carries the atmosphere in the hero above; the list
          is reference data and just needs to be legible, so it takes normal
          theme colours and inherits their contrast for free. */}
      {!loading && !error && daily.length > 0 && (
        <div className="relative border-t border-black/5 bg-white p-2.5 dark:border-white/10 dark:bg-slate-900">
          <ul className="space-y-0.5">
            {daily.map((prayer, index) => {
              const isNext = prayer.name === nextPrayer?.name
              const Icon = PRAYER_ICON[prayer.name] ?? Moon
              return (
                <motion.li
                  key={prayer.name}
                  initial={{ opacity: 0, x: reduceMotion ? 0 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduceMotion ? 0 : index * 0.04, duration: 0.3 }}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                    isNext
                      ? 'bg-[rgb(var(--phase-accent)/0.12)] ring-1 ring-[rgb(var(--phase-accent)/0.30)]'
                      : prayer.passed
                        ? 'opacity-50'
                        : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      isNext
                        ? 'bg-[rgb(var(--phase-accent)/0.16)] text-[rgb(var(--phase-ink-on-surface))]'
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

          {/*
            A plain button, deliberately not <Button variant="ghost">.

            That variant carries `hover:bg-accent hover:text-accent-foreground`,
            which are theme-aware and *light* in light mode. Whether those or a
            local `hover:bg-white/10` win comes down to Tailwind's emit order
            rather than the order they're written in — so on hover this went
            white-on-light and disappeared. Nothing on this panel should take
            colour from the light/dark theme; it sits on the sky.
          */}
          <button
            type="button"
            onClick={() => (window.location.href = '/prayers')}
            className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-2xl px-4 py-2.5 text-sm font-semibold text-[rgb(var(--phase-ink-on-surface))] transition-colors hover:bg-[rgb(var(--phase-accent)/0.10)] focus-visible:bg-[rgb(var(--phase-accent)/0.10)]"
          >
            {t('ui.viewAllPrayerTimes')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </section>
  )
}

/** Fixed so the sky doesn't reshuffle on every render. */
const STAR_FIELD = [
  { x: 12, y: 18, r: 2, d: 3.2, delay: 0 },
  { x: 28, y: 9, r: 1.5, d: 4.1, delay: 0.6 },
  { x: 44, y: 24, r: 1.5, d: 3.7, delay: 1.2 },
  { x: 61, y: 12, r: 2, d: 4.6, delay: 0.3 },
  { x: 73, y: 28, r: 1.5, d: 3.4, delay: 1.8 },
  { x: 88, y: 15, r: 2, d: 4.2, delay: 0.9 },
  { x: 19, y: 38, r: 1.5, d: 3.9, delay: 1.5 },
  { x: 54, y: 40, r: 1.5, d: 4.4, delay: 2.1 },
]

/**
 * Countdown ring.
 *
 * An arc rather than a bar: the value is a position in time, and a ring reads
 * as a clock face. The soft outer halo keeps it legible against the brighter
 * phases without needing a border.
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
  const radius = 30
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative h-[76px] w-[76px] shrink-0">
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: '0 0 28px rgb(var(--sky-glow) / 0.45)' }}
      />
      <svg className="h-full w-full -rotate-90" viewBox="0 0 76 76" aria-hidden>
        <circle cx="38" cy="38" r={radius} fill="rgb(255 255 255 / 0.06)" stroke="rgb(255 255 255 / 0.18)" strokeWidth="3" />
        <motion.circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="rgb(255 255 255 / 0.92)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: reduceMotion ? 0 : 0.9, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">{children}</span>
    </div>
  )
}
