'use client'

import { useT } from '@/lib/i18n/client'
import { motion, useReducedMotion } from 'framer-motion'
import { Zap, Coffee, Moon, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react'

/**
 * The focus timer.
 *
 * Rewritten because the previous version was unusable on a phone and confusing
 * on a laptop:
 *
 *  - The ring was a hard-coded `w-80 h-80` with an SVG whose geometry was
 *    written in absolute pixels (`cx=160 r=140`). 320px plus the page padding
 *    is wider than a 360px screen, so the timer — the entire point of the page
 *    — was clipped. It is now a `viewBox` that scales to whatever space it has.
 *
 *  - Three separate palettes (purple / emerald / blue) were hard-coded across
 *    twelve class strings, none of them the page's own. Focus now uses the page
 *    accent; the two breaks share a single distinct treatment, because "you are
 *    resting" is one state, not two.
 *
 *  - The three controls sat in a `flex gap-4` row of large buttons that
 *    overflowed a narrow screen. Start is now the primary action at full width
 *    on a phone, with reset and mute as square icon buttons beside it.
 *
 *  - The mode label fell through to `{mode}` for focus, rendering the raw
 *    English identifier "focus" on an Uzbek dashboard.
 */

type Mode = 'focus' | 'shortBreak' | 'longBreak'

interface FocusTimerProps {
  mode: Mode
  timeLeft: number
  isActive: boolean
  completedSessions: number
  settings: {
    focusDuration: number
    shortBreakDuration: number
    longBreakDuration: number
  }
  isMuted: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSwitchMode: (mode: Mode) => void
  onToggleMute: () => void
}

/** Geometry in viewBox units, so the ring scales with its container. */
const SIZE = 200
const RADIUS = 88
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function FocusTimer({
  mode,
  timeLeft,
  isActive,
  completedSessions,
  settings,
  isMuted,
  onStart,
  onPause,
  onReset,
  onSwitchMode,
  onToggleMute,
}: FocusTimerProps) {
  const { t } = useT()
  const reduceMotion = useReducedMotion()

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const totalSeconds =
    (mode === 'focus'
      ? settings.focusDuration
      : mode === 'shortBreak'
        ? settings.shortBreakDuration
        : settings.longBreakDuration) * 60

  // A zero-length session would divide by zero and paint a full ring.
  const progress = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0

  const isBreak = mode !== 'focus'
  // Focus takes the page accent. Breaks take emerald — one treatment for both,
  // because resting is a single state and giving each break its own colour made
  // the page look like it had three unrelated themes.
  const ring = isBreak ? 'rgb(16 185 129)' : 'rgb(var(--acc-2))'

  const MODES: { key: Mode; icon: typeof Zap; label: string }[] = [
    {
      key: 'focus',
      icon: Zap,
      label: t('ui.focusWithDuration', { minutes: settings.focusDuration }),
    },
    {
      key: 'shortBreak',
      icon: Coffee,
      label: t('ui.shortBreakWithDuration', { minutes: settings.shortBreakDuration }),
    },
    {
      key: 'longBreak',
      icon: Moon,
      label: t('ui.longBreakWithDuration', { minutes: settings.longBreakDuration }),
    },
  ]

  const modeLabel =
    mode === 'shortBreak'
      ? t('ui.shortBreak')
      : mode === 'longBreak'
        ? t('ui.longBreak')
        : t('ui.focusMode')

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      {/* Mode switch — an equal three-up grid, so the labels cannot overflow. */}
      <div
        role="tablist"
        aria-label={t('ui.timer')}
        className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800"
      >
        {MODES.map(({ key, icon: Icon, label }) => {
          const active = mode === key
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => onSwitchMode(key)}
              disabled={isActive}
              // Switching mid-session would silently discard it, so the control
              // is disabled rather than destructive.
              title={isActive ? t('ui.pause') : label}
              className={`flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 sm:text-sm ${
                active
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                  : 'text-slate-600 hover:bg-white/60 dark:text-slate-400 dark:hover:bg-slate-950/40'
              }`}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={active ? { color: ring } : undefined}
              />
              <span className="truncate">{label}</span>
            </button>
          )
        })}
      </div>

      {/* Ring */}
      <div className="mt-6 flex justify-center">
        <div className="relative w-full max-w-[min(72vw,18rem)]">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full -rotate-90" aria-hidden>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              className="stroke-slate-200 dark:stroke-slate-800"
            />
            <motion.circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              stroke={ring}
              strokeDasharray={CIRCUMFERENCE}
              initial={false}
              animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - progress) }}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: 'linear' }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p
              // tabular-nums so the digits do not jitter as they change.
              className="text-[clamp(2.75rem,14vw,4.5rem)] font-bold leading-none tabular-nums text-slate-900 dark:text-white"
              aria-live="off"
            >
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:text-sm">
              {modeLabel}
            </p>
            {completedSessions > 0 && (
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                {t('ui.sessionsToday', { count: completedSessions })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center gap-2">
        <button
          onClick={isActive ? onPause : onStart}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl text-base font-bold text-white shadow-lg transition-transform active:scale-[0.99]"
          style={{ backgroundColor: ring }}
        >
          {isActive ? (
            <>
              <Pause className="h-5 w-5" />
              {t('ui.pause')}
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              {t('ui.start')}
            </>
          )}
        </button>

        <button
          onClick={onReset}
          aria-label={t('ui.reset')}
          title={t('ui.reset')}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        <button
          onClick={onToggleMute}
          aria-label={isMuted ? t('ui.unmute') : t('ui.mute')}
          title={isMuted ? t('ui.unmute') : t('ui.mute')}
          aria-pressed={isMuted}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )
}
