'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw } from 'lucide-react'

interface Job {
  job: string
  lastRunAt: string
  ageMs: number
  lastOk: boolean
  runCount: number
  durationMs: number | null
  lastResult: Record<string, unknown> | null
  stale: boolean
}

interface Health {
  jobs: Job[]
  remindersConfigured: boolean
  pushConfigured: boolean
  vaultConfigured: boolean
  pushDevices: number
  openErrors: number
}

const rel = (ms: number) => {
  const m = Math.floor(ms / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const JOB_LABEL: Record<string, string> = {
  reminders: 'Prayer & habit reminders',
  'weekly-review': 'Weekly review email',
}

/** Compact system-health strip shown at the top of the admin Overview. */
export default function HealthPanel() {
  const [health, setHealth] = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/health', { cache: 'no-store' })
      if (res.ok) setHealth(await res.json())
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [load])

  if (!health) return null

  const reminders = health.jobs.find((j) => j.job === 'reminders')

  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">System health</h3>
        <button
          onClick={load}
          aria-label="Refresh health"
          className="ml-auto rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Scheduler — the thing most likely to be silently broken */}
      {!health.remindersConfigured ? (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Reminder scheduler has never run</p>
            <p className="mt-0.5">
              Prayer and habit reminders won&apos;t be delivered until an external scheduler
              calls <code>/api/cron/reminders</code> every 5 minutes.
            </p>
          </div>
        </div>
      ) : reminders?.stale ? (
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-900 dark:border-red-700/60 dark:bg-red-950/30 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Scheduler looks stopped</p>
            <p className="mt-0.5">Last run {rel(reminders.ageMs)} — expected every few minutes.</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Tile
          label="Push"
          value={health.pushConfigured ? `${health.pushDevices} devices` : 'Not configured'}
          ok={health.pushConfigured}
        />
        <Tile label="Vault" value={health.vaultConfigured ? 'On' : 'Off'} ok={health.vaultConfigured} />
        <Tile
          label="Open errors"
          value={String(health.openErrors)}
          ok={health.openErrors === 0}
        />
        <Tile
          label="Reminders"
          value={reminders ? rel(reminders.ageMs) : 'never'}
          ok={Boolean(reminders && !reminders.stale)}
        />
      </div>

      {health.jobs.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {health.jobs.map((j) => (
            <div key={j.job} className="flex items-center gap-2 text-xs">
              {j.lastOk && !j.stale ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              )}
              <span className="font-medium">{JOB_LABEL[j.job] ?? j.job}</span>
              <span className="text-muted-foreground">
                <Clock className="mr-1 inline h-3 w-3" />
                {rel(j.ageMs)}
              </span>
              <span className="ml-auto text-muted-foreground">
                {j.runCount} runs{j.durationMs != null ? ` · ${j.durationMs}ms` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Tile({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="rounded-xl bg-muted/50 p-2.5 text-center">
      <div className={`text-sm font-bold ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}
