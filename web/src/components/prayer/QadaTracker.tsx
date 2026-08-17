'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Minus, Plus, Check, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n/client'

/**
 * Qazo — the prayers you owe, and working them down.
 *
 * Two numbers per prayer rather than one. People arrive with a debt measured in
 * months or years and no record of it, so the only honest starting point is a
 * figure they set themselves; keeping "owed" and "made up" apart means the
 * remaining count is a subtraction they can check, and it distinguishes paying a
 * debt down from correcting an estimate.
 *
 * Everything is sent as a delta, so a double tap or a second tab adds twice
 * rather than one silently overwriting the other. The optimistic update is
 * reverted from the server's own response, which is the only number that counts.
 */

type Row = { prayer: string; owed: number; madeUp: number; remaining: number }
type Totals = { owed: number; madeUp: number; remaining: number }

const PRAYER_KEY: Record<string, string> = {
  fajr: 'prayer.fajr',
  dhuhr: 'prayer.dhuhr',
  asr: 'prayer.asr',
  maghrib: 'prayer.maghrib',
  isha: 'prayer.isha',
}

export function QadaTracker({ missedToday = [] }: { missedToday?: string[] }) {
  const { t } = useT()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [totals, setTotals] = useState<Totals>({ owed: 0, madeUp: 0, remaining: 0 })
  const [autoAdded, setAutoAdded] = useState(0)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/qada', { cache: 'no-store' })
      if (!res.ok) throw new Error('failed')
      const json = await res.json()
      setRows(json.data)
      setTotals(json.totals)
      // Only from the initial read: a later PATCH sweeps again and reports 0,
      // which would wipe the notice while the reader was still looking at it.
      setAutoAdded((prev) => prev || (json.autoAdded ?? 0))
    } catch {
      setRows([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const apply = useCallback(
    async (changes: { prayer: string; owedDelta?: number; madeUpDelta?: number }[]) => {
      setBusy(true)
      try {
        const res = await fetch('/api/qada', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ changes }),
        })
        if (!res.ok) throw new Error('failed')
        const json = await res.json()
        // The server's totals replace ours rather than being merged: it applied
        // the increments and knows what actually happened.
        setRows(json.data)
        setTotals(json.totals)
      } catch {
        toast.error(t('ui.failedToSaveSettings'))
        await load()
      } finally {
        setBusy(false)
      }
    },
    [load, t]
  )

  if (rows === null) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  const nothingOwed = totals.owed === 0
  const cleared = !nothingOwed && totals.remaining === 0
  const progress = totals.owed > 0 ? Math.round((totals.madeUp / totals.owed) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Summary. Leads on what is left, because that is the number people came for. */}
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('ui.qadaRemaining')}
            </p>
            <p className="mt-1 text-4xl font-bold leading-none tabular-nums text-slate-900 dark:text-white">
              {totals.remaining}
            </p>
          </div>
          {totals.owed > 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t('ui.qadaMadeUpOf', { madeUp: totals.madeUp, owed: totals.owed })}
            </p>
          )}
        </div>

        {totals.owed > 0 && (
          <div className="mt-4">
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500"
              />
            </div>
            <p className="mt-1.5 text-xs tabular-nums text-slate-500 dark:text-slate-400">{progress}%</p>
          </div>
        )}

        {cleared && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            <Check className="h-4 w-4 shrink-0" />
            {t('ui.qadaAllCleared')}
          </p>
        )}

        {nothingOwed && (
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {t('ui.qadaHowItWorks')}
          </p>
        )}
      </div>

      {/*
        What the sweep counted, said out loud.

        A debt that grows on its own with no explanation is alarming and looks
        like a bug. This states the number, the rule it used, and leaves the
        correction one tap away — the manual controls below exist precisely
        because an automatic count can be wrong about a specific day.
      */}
      {autoAdded > 0 && (
        <div className="accent-soft rounded-2xl p-4">
          <p className="text-sm font-semibold">
            {t('ui.qadaAutoAdded', { count: autoAdded })}
          </p>
          <p className="mt-1 text-xs leading-relaxed opacity-90">
            {t('ui.qadaAutoRule')}
          </p>
        </div>
      )}

      {/*
        Today's missed prayers stay a button, not part of the sweep. Today is not
        over — a prayer whose window has closed may still be prayed as qazo within
        the day, and the app should not decide that for anyone.
      */}
      {missedToday.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-900 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t('ui.qadaAddMissedToday', { count: missedToday.length })}
          </p>
          <button
            onClick={() => apply(missedToday.map((p) => ({ prayer: p, owedDelta: 1 })))}
            disabled={busy}
            className="h-11 shrink-0 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
          >
            {t('ui.qadaAddToCount')}
          </button>
        </div>
      )}

      {/* Per prayer */}
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.prayer}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900 dark:text-white">
                {t(PRAYER_KEY[row.prayer] ?? row.prayer)}
              </p>
              <p className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {t('ui.qadaOwedMadeUp', { owed: row.owed, madeUp: row.madeUp })}
              </p>
            </div>

            <p className="w-12 shrink-0 text-right text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {row.remaining}
            </p>

            <div className="flex shrink-0 items-center gap-1.5">
              {/* Owed: adjust the estimate. */}
              <button
                onClick={() => apply([{ prayer: row.prayer, owedDelta: 1 }])}
                disabled={busy}
                aria-label={t('ui.qadaAddOwed', { prayer: t(PRAYER_KEY[row.prayer] ?? row.prayer) })}
                title={t('ui.qadaAddOwed', { prayer: t(PRAYER_KEY[row.prayer] ?? row.prayer) })}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => apply([{ prayer: row.prayer, owedDelta: -1 }])}
                disabled={busy || row.owed === 0}
                aria-label={t('ui.qadaRemoveOwed', { prayer: t(PRAYER_KEY[row.prayer] ?? row.prayer) })}
                title={t('ui.qadaRemoveOwed', { prayer: t(PRAYER_KEY[row.prayer] ?? row.prayer) })}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Minus className="h-4 w-4" />
              </button>

              {/* Made up: the action people take most, so it is the filled one. */}
              <button
                onClick={() => apply([{ prayer: row.prayer, madeUpDelta: 1 }])}
                disabled={busy || row.remaining === 0}
                className="flex h-11 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
              >
                <Check className="h-4 w-4" />
                {t('ui.qadaPrayed')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default QadaTracker
