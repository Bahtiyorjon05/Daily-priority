'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sunrise, Sunset, Check, Loader2, Star, Utensils, Ban, Flame, CalendarDays } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n/client'
import { PhaseHeader, HeaderStat } from '@/components/shared/PhaseHeader'
import { usePrayerCalc } from '@/hooks/usePrayerCalc'
import { fetchPrayerTimes, getStoredPrayerTimes, type PrayerTimes } from '@/lib/prayer-times'
import { getUserLocation } from '@/lib/location-service'
import { gregorianToHijri, hijriMonthKey, RAMADAN_MONTH, type HijriDate } from '@/lib/hijri'
import { fastingOccasion, isForbiddenToFast } from '@/lib/fasting'
import { streakFromDates } from '@/lib/streaks'

/**
 * Ramadan.
 *
 * The page answers one question at a time, because during Ramadan there is only
 * ever one thing you want to know: how long until suhoor ends, or how long until
 * iftar. Everything else — the log, the last ten nights — sits below it.
 *
 * Suhoor ends at Fajr and iftar is at Maghrib, so the countdown comes from the
 * user's own prayer times, including their madhab. It is not a separate
 * calculation that could disagree with the prayers page.
 *
 * Outside Ramadan the page still works: it counts down to the month and the log
 * stays readable, rather than showing an empty screen for eleven months.
 */

const DAY_MS = 86_400_000

type RamadanDay = {
  key: string
  hijriDay: number | null
  fasted: boolean
  taraweeh: boolean
  note: string | null
}

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Minutes since midnight, or null when the time is unusable. */
function toMinutes(hhmm?: string): number | null {
  if (!hhmm) return null
  const [h, m] = hhmm.split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}

export default function RamadanPage() {
  const { t, locale } = useT()
  const { calc } = usePrayerCalc()

  const [times, setTimes] = useState<PrayerTimes | null>(null)
  const [hijri, setHijri] = useState<HijriDate | null>(null)
  const [days, setDays] = useState<RamadanDay[] | null>(null)
  const [totals, setTotals] = useState({ fasted: 0, taraweeh: 0 })
  const [now, setNow] = useState(() => new Date())
  const [busy, setBusy] = useState(false)

  // One tick a second, only for the countdown.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [h, location] = await Promise.all([
        gregorianToHijri(new Date()).catch(() => null),
        getUserLocation().catch(() => null),
      ])
      if (cancelled) return
      setHijri(h)

      if (location) {
        // Same source and same madhab as the prayers page, so the two screens
        // can never disagree about when iftar is.
        const cached = getStoredPrayerTimes(location.latitude, location.longitude, calc)
        const resolved = cached ?? (await fetchPrayerTimes(location.latitude, location.longitude, undefined, calc))
        if (!cancelled) setTimes(resolved)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [calc])

  const loadDays = useCallback(async () => {
    try {
      const res = await fetch('/api/ramadan', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed')
      const json = await res.json()
      setDays(json.data)
      setTotals(json.totals)
    } catch {
      setDays([])
    }
  }, [])

  useEffect(() => {
    loadDays()
  }, [loadDays])

  const setToday = useCallback(
    async (patch: { fasted?: boolean; taraweeh?: boolean }) => {
      setBusy(true)
      try {
        const res = await fetch('/api/ramadan', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: toKey(new Date()),
            hijriDay: hijri?.monthNumber === RAMADAN_MONTH ? hijri.day : undefined,
            ...patch,
          }),
        })
        if (!res.ok) throw new Error('failed')
        await loadDays()
      } catch {
        toast.error(t('ui.failedToSaveSettings'))
      } finally {
        setBusy(false)
      }
    },
    [hijri, loadDays, t]
  )

  const isRamadan = hijri?.monthNumber === RAMADAN_MONTH
  const todayKey = toKey(now)
  const today = days?.find((d) => d.key === todayKey)

  /*
    Which countdown to show.

    Before Fajr, the thing that matters is how long is left to eat. Between Fajr
    and Maghrib, it is how long until you can. After Maghrib the fast is done, so
    the next thing is tomorrow's suhoor — and showing "0:00 until iftar" all
    evening would be both wrong and dispiriting.
  */
  const countdown = useMemo(() => {
    const fajr = toMinutes(times?.fajr)
    const maghrib = toMinutes(times?.maghrib)
    if (fajr === null || maghrib === null) return null

    const minutesNow = now.getHours() * 60 + now.getMinutes()
    const seconds = now.getSeconds()

    const until = (targetMinutes: number, addDay = false) => {
      const total = (targetMinutes - minutesNow + (addDay ? 1440 : 0)) * 60 - seconds
      return Math.max(0, total)
    }

    if (minutesNow < fajr) return { kind: 'suhoor' as const, seconds: until(fajr), at: times!.fajr }
    if (minutesNow < maghrib) return { kind: 'iftar' as const, seconds: until(maghrib), at: times!.maghrib }
    return { kind: 'suhoor' as const, seconds: until(fajr, true), at: times!.fajr }
  }, [times, now])

  /** The last ten nights, with the odd ones marked. */
  const lastTen = useMemo(() => {
    if (!isRamadan || !hijri) return []
    return Array.from({ length: 10 }, (_, i) => {
      const hijriDay = 21 + i
      const offset = hijriDay - hijri.day
      const date = new Date(now.getTime() + offset * DAY_MS)
      return {
        hijriDay,
        key: toKey(date),
        // The odd nights are where Laylat al-Qadr is sought.
        odd: hijriDay % 2 === 1,
        past: offset < 0,
        isToday: offset === 0,
      }
    })
  }, [isRamadan, hijri, now])

  /*
    Today's occasion, so the page has something true to say for eleven months of
    the year rather than sitting empty until Ramadan.
  */
  const occasion = useMemo(() => fastingOccasion(now, hijri), [now, hijri])
  const forbidden = useMemo(() => isForbiddenToFast(now, hijri), [now, hijri])

  const logged = useMemo(() => new Map((days ?? []).map((d) => [d.key, d])), [days])

  /*
    A calendar of the current Gregorian month.

    Gregorian, not Hijri: the grid has to line up with the weekday headers and
    with the dates on the person's phone. The Hijri day is what gets labelled
    inside each cell, not what arranges them.
  */
  const monthGrid = useMemo(() => {
    const first = new Date(now.getFullYear(), now.getMonth(), 1)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    // Sunday-first, matching the calendar page's weekday row.
    const lead = first.getDay()
    const cells: ({ date: Date; key: string } | null)[] = Array(lead).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), d)
      cells.push({ date, key: toKey(date) })
    }
    return cells
  }, [now])

  const stats = useMemo(() => {
    const all = days ?? []
    const fastedDates = all.filter((d) => d.fasted).map((d) => new Date(d.key))
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return {
      total: fastedDates.length,
      thisMonth: all.filter((d) => d.fasted && d.key.startsWith(monthPrefix)).length,
      taraweeh: all.filter((d) => d.taraweeh).length,
      // Same definition as every other streak in the app.
      run: streakFromDates(fastedDates, now),
    }
  }, [days, now])

  const fmt = (total: number) => {
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    const s = total % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div data-accent="ramadan" className="accent-canvas min-h-screen space-y-4 p-4 sm:space-y-6 sm:p-6">
      <PhaseHeader
        accent="ramadan"
        icon={Moon}
        title={t('nav.ramadan')}
        subtitle={isRamadan ? t('ui.ramadanSubtitleActive') : t('ui.ramadanSubtitleWaiting')}
        meta={
          hijri ? (
            <span>
              {Math.floor(hijri.day)} {t(hijriMonthKey(hijri.monthNumber))} {hijri.year}
            </span>
          ) : undefined
        }
      >
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <HeaderStat label={t('ui.ramadanFasted')} value={totals.fasted} hint={t('ui.days')} icon={Utensils} />
          <HeaderStat label={t('ui.ramadanTaraweeh')} value={totals.taraweeh} hint={t('ui.ramadanNights')} icon={Star} />
          {isRamadan && hijri && (
            <HeaderStat label={t('ui.ramadanDayOf')} value={`${Math.floor(hijri.day)}/30`} icon={Moon} />
          )}
        </div>
      </PhaseHeader>

      {/* The one number that matters right now. */}
      {countdown ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="accent-border rounded-3xl border-2 bg-white p-6 text-center dark:bg-slate-900 sm:p-8"
        >
          <p className="accent-ink flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider">
            {countdown.kind === 'suhoor' ? <Sunrise className="h-4 w-4" /> : <Sunset className="h-4 w-4" />}
            {countdown.kind === 'suhoor' ? t('ui.ramadanUntilSuhoor') : t('ui.ramadanUntilIftar')}
          </p>
          <p className="mt-2 text-[clamp(2.5rem,13vw,4.5rem)] font-bold leading-none tabular-nums text-slate-900 dark:text-white">
            {fmt(countdown.seconds)}
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {countdown.kind === 'suhoor'
              ? t('ui.ramadanFajrAt', { time: countdown.at })
              : t('ui.ramadanMaghribAt', { time: countdown.at })}
          </p>
        </motion.div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {t('ui.ramadanNeedTimes')}
        </div>
      )}

      {/*
        What today is. The page used to say nothing at all outside Ramadan; now it
        names the occasion when there is one, and says plainly when there is not
        rather than implying you have missed something.
      */}
      {!isRamadan && (
        <div
          className={`rounded-2xl border-2 p-4 ${
            forbidden
              ? 'border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30'
              : occasion
                ? 'accent-border accent-soft'
                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <p className="flex items-center gap-2 text-sm font-bold">
            {forbidden ? <Ban className="h-4 w-4 shrink-0" /> : <Utensils className="h-4 w-4 shrink-0" />}
            {forbidden
              ? t('ui.ramadanForbidden')
              : occasion
                ? t('ui.ramadanNaflToday')
                : t('ui.ramadanNaflNone')}
          </p>
          {occasion && (
            <p className="mt-1 text-sm opacity-90">{t(occasion.key)}</p>
          )}
        </div>
      )}

      {/* Today's two acts. Separate, because they are separate. */}
      <div className="grid gap-2 sm:grid-cols-2">
        {(
          [
            {
              key: 'fasted' as const,
              label: isRamadan ? t('ui.ramadanIFasted') : t('ui.ramadanIFastedNafl'),
              icon: Utensils,
              on: today?.fasted ?? false,
              // Fasting the two Eids is forbidden by unanimous agreement, so the
              // app should not offer to record it.
              blocked: forbidden,
            },
            { key: 'taraweeh' as const, label: t('ui.ramadanIPrayedTaraweeh'), icon: Star, on: today?.taraweeh ?? false, blocked: false },
          ]
        ).map(({ key, label, icon: Icon, on, blocked }) => (
          <button
            key={key}
            onClick={() => setToday({ [key]: !on })}
            disabled={busy || days === null || blocked}
            title={blocked ? t('ui.ramadanForbidden') : label}
            aria-pressed={on}
            className={`flex h-16 items-center gap-3 rounded-2xl border-2 px-5 text-left font-semibold transition-colors disabled:opacity-60 ${
              on
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-100'
                : 'border-slate-200 bg-white text-slate-700 hover:accent-border dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                on ? 'bg-emerald-600 text-white' : 'accent-soft'
              }`}
            >
              {on ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
            </span>
            <span className="min-w-0 flex-1">{label}</span>
          </button>
        ))}
      </div>

      {/* The last ten nights. Only during Ramadan — a grid of empty boxes for
          eleven months would be clutter. */}
      {isRamadan && lastTen.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="font-bold text-slate-900 dark:text-white">{t('ui.ramadanLastTen')}</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t('ui.ramadanLastTenNote')}
          </p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {lastTen.map((night) => {
              const logged = days?.find((d) => d.key === night.key)
              return (
                <div
                  key={night.hijriDay}
                  className={`rounded-xl border-2 p-2 text-center ${
                    night.isToday
                      ? 'accent-border accent-soft'
                      : night.odd
                        ? 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/25'
                        : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <p className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {night.hijriDay}
                  </p>
                  {logged?.taraweeh ? (
                    <Check className="mx-auto mt-1 h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <span className="mt-1 block text-[10px] text-slate-400">
                      {night.odd ? t('ui.ramadanOdd') : ''}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Statistics. Four numbers that each answer a different question. */}
      {days !== null && stats.total > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: t('ui.ramadanTotalFasts'), value: stats.total, icon: Utensils },
            { label: t('ui.ramadanLongestRun'), value: stats.run, icon: Flame, hint: t('ui.days') },
            { label: t('ui.ramadanThisMonth'), value: stats.thisMonth, icon: CalendarDays },
            { label: t('ui.ramadanTaraweehTotal'), value: stats.taraweeh, icon: Star },
          ].map(({ label, value, icon: Icon, hint }) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              <p className="mt-1.5 text-2xl font-bold leading-none tabular-nums text-slate-900 dark:text-white">
                {value}
              </p>
              <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {label}
              </p>
              {hint && <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
            </div>
          ))}
        </div>
      )}

      {/*
        The month at a glance.

        Gregorian layout, because the grid has to line up with the weekday row and
        with the dates on the person's phone — the Hijri day is what labels a cell,
        not what arranges it. Seven columns at every width, for the same reason the
        calendar page is: a month grid that is not seven wide is not a month grid.
      */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-bold text-slate-900 dark:text-white">
            {now.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
              {t('ui.ramadanLegendFasted')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="accent-soft h-2.5 w-2.5 rounded-sm ring-1 ring-inset ring-current" />
              {t('ui.ramadanLegendRecommended')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
              {t('ui.ramadanLegendEid')}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {monthGrid.map((cell, i) => {
            if (!cell) return <div key={`pad-${i}`} aria-hidden />

            const entry = logged.get(cell.key)
            // The occasion needs the Hijri date for that day, which is only
            // fetched for today — so other days get weekday-only occasions. Being
            // wrong about Ashura on a grid would be worse than not marking it.
            const occ = fastingOccasion(cell.date, null)
            const isToday = cell.key === todayKey
            const future = cell.date.getTime() > now.getTime()

            return (
              <div
                key={cell.key}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg border text-xs ${
                  entry?.fasted
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : occ?.kind === 'forbidden'
                      ? 'border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : occ
                        ? 'accent-border accent-soft'
                        : 'border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400'
                } ${isToday ? 'ring-2 accent-ring' : ''} ${future ? 'opacity-45' : ''}`}
                title={occ ? t(occ.key) : undefined}
              >
                <span className="font-bold tabular-nums">{cell.date.getDate()}</span>
                {entry?.taraweeh && <Star className="mt-0.5 h-2.5 w-2.5" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* The log so far. */}
      {days === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="accent-ink h-5 w-5 animate-spin" />
        </div>
      ) : (
        days.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 font-bold text-slate-900 dark:text-white">{t('ui.ramadanLog')}</h2>
            <ul className="space-y-1.5">
              {[...days].reverse().map((d) => (
                <li
                  key={d.key}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
                    {new Date(d.key).toLocaleDateString(locale, { day: 'numeric', month: 'long' })}
                    {d.hijriDay ? ` · ${t('ui.ramadanDayN', { n: d.hijriDay })}` : ''}
                  </span>
                  {d.fasted && (
                    <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {t('ui.ramadanFastedShort')}
                    </span>
                  )}
                  {d.taraweeh && (
                    <span className="accent-soft shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                      {t('ui.ramadanTaraweehShort')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  )
}
