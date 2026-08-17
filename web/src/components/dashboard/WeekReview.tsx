'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import {
  Flame, CheckCircle2, BookOpen, Repeat, Timer, NotebookPen, Target, ArrowRight,
} from 'lucide-react'
import { useT } from '@/lib/i18n/client'

/**
 * The week so far, and the streaks.
 *
 * Streaks lead. The measured problem on this app is activation — most accounts
 * finish onboarding and then create nothing — and a dashboard whose first
 * message is "you have no tasks" gives a returning person no reason to stay. A
 * streak is the one number that is interesting before you have done anything much,
 * and the only one that gets more interesting the longer you keep going.
 *
 * A week of zeroes is not shown as zeroes. For most new accounts that is the true
 * state, and six columns of "0" reads as an accusation; the card offers a place to
 * start instead.
 */

type Review = {
  week: {
    tasksDone: number
    tasksMade: number
    habitCheckIns: number
    habitCount: number
    focusMinutes: number
    focusSessions: number
    journal: number
    goalsDone: number
    goalsTotal: number
    prayers: number
    prayersOnTime: number
    onTimeRate: number
  }
  streaks: { prayers: number; tasks: number; quran: number; habits: number }
  atRisk: { prayers: boolean; tasks: boolean; quran: boolean; habits: boolean }
  topHabit: { title: string; streak: number } | null
  anyActivity: boolean
}

export function WeekReview() {
  const { t } = useT()
  const reduceMotion = useReducedMotion()
  const [review, setReview] = useState<Review | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/review', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed')
      setReview((await res.json()).data)
    } catch {
      // Silent. This card is a summary of things visible elsewhere; an error
      // banner here would be noise on the busiest screen in the app.
      setFailed(true)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (failed) return null

  if (!review) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  const { week, streaks, atRisk, topHabit, anyActivity } = review

  const hours = Math.floor(week.focusMinutes / 60)
  const mins = week.focusMinutes % 60
  const focusLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  /* Only streaks that exist. A row of zeroes is not a streak display. */
  const liveStreaks = [
    { key: 'prayers', value: streaks.prayers, label: t('nav.prayers'), href: '/prayers', risk: atRisk.prayers },
    { key: 'habits', value: streaks.habits, label: t('nav.habits'), href: '/habits', risk: atRisk.habits },
    { key: 'quran', value: streaks.quran, label: t('nav.quran'), href: '/quran', risk: atRisk.quran },
    { key: 'tasks', value: streaks.tasks, label: t('nav.tasks'), href: '/dashboard', risk: atRisk.tasks },
  ].filter((s) => s.value > 0)

  /* Only rows with something in them, same rule as the weekly email. */
  const stats = [
    week.tasksDone > 0 || week.tasksMade > 0
      ? { icon: CheckCircle2, label: t('nav.tasks'), value: week.tasksDone, hint: t('ui.reviewOfCreated', { count: week.tasksMade }) }
      : null,
    week.habitCheckIns > 0
      ? { icon: Repeat, label: t('nav.habits'), value: week.habitCheckIns, hint: t('ui.reviewAcrossHabits', { count: week.habitCount }) }
      : null,
    week.focusSessions > 0
      ? { icon: Timer, label: t('nav.focus'), value: focusLabel, hint: t('ui.reviewSessions', { count: week.focusSessions }) }
      : null,
    week.prayers > 0
      ? { icon: Flame, label: t('nav.prayers'), value: week.prayers, hint: t('ui.reviewOnTime', { percent: week.onTimeRate }) }
      : null,
    week.journal > 0
      ? { icon: NotebookPen, label: t('nav.journal'), value: week.journal, hint: t('ui.reviewEntries') }
      : null,
    week.goalsTotal > 0
      ? { icon: Target, label: t('nav.goals'), value: `${week.goalsDone}/${week.goalsTotal}`, hint: t('ui.reviewDone') }
      : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null)

  return (
    <motion.section
      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.3 }}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      aria-label={t('ui.reviewThisWeek')}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('ui.reviewThisWeek')}</h2>
        {topHabit && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('ui.reviewBestStreak', { habit: topHabit.title, days: topHabit.streak })}
          </p>
        )}
      </div>

      {/* Streaks first. */}
      {liveStreaks.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {liveStreaks.map((s) => (
            <Link
              key={s.key}
              href={s.href}
              className={`inline-flex items-center gap-2 rounded-2xl border-2 px-3.5 py-2.5 transition-colors ${
                s.risk
                  ? 'border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/30'
                  : 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'
              }`}
            >
              <Flame
                className={`h-4 w-4 shrink-0 ${
                  s.risk ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              />
              <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                {s.value}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300">{s.label}</span>
              {/* Named, not just coloured — amber alone says nothing to anyone who
                  cannot distinguish it. */}
              {s.risk && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  {t('ui.reviewToday')}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {anyActivity ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map(({ icon: Icon, label, value, hint }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40"
            >
              <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <p className="mt-1.5 text-xl font-bold leading-none tabular-nums text-slate-900 dark:text-white">
                {value}
              </p>
              <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {label}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>
            </div>
          ))}
        </div>
      ) : (
        /*
          The honest state of most new accounts. Two concrete first moves rather
          than a wall of zeroes, because "0" six times over reads as a reprimand
          for not having used an app you just installed.
        */
        <div className="mt-4">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {t('ui.reviewNothingYet')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/prayers"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Flame className="h-4 w-4" />
              {t('ui.reviewLogAPrayer')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/quran"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <BookOpen className="h-4 w-4" />
              {t('ui.reviewReadAyah')}
            </Link>
          </div>
        </div>
      )}
    </motion.section>
  )
}

export default WeekReview
