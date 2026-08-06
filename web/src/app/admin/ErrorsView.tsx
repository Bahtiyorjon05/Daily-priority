'use client'

import { useT } from '@/lib/i18n/client'
import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Check, RefreshCw, Trash2, ChevronDown, ChevronRight, Bug } from 'lucide-react'

interface ErrorRow {
  id: string
  fingerprint: string
  level: string
  message: string
  stack: string | null
  source: string
  url: string | null
  userAgent: string | null
  userId: string | null
  count: number
  firstSeenAt: string
  lastSeenAt: string
  resolved: boolean
}

const rel = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function ErrorsView() {
  const { t } = useT()
  const [rows, setRows] = useState<ErrorRow[]>([])
  const [openCount, setOpenCount] = useState(0)
  const [resolvedCount, setResolvedCount] = useState(0)
  const [showResolved, setShowResolved] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/errors?resolved=${showResolved ? 1 : 0}`, { cache: 'no-store' })
      const d = await res.json()
      setRows(d.errors || [])
      setOpenCount(d.openCount ?? 0)
      setResolvedCount(d.resolvedCount ?? 0)
    } catch {
      /* handled by empty state */
    } finally {
      setLoading(false)
    }
  }, [showResolved])

  useEffect(() => {
    load()
  }, [load])

  async function setResolved(id: string, resolved: boolean) {
    await fetch('/api/admin/errors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolved }),
    })
    load()
  }

  async function clearResolved() {
    await fetch('/api/admin/errors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearResolved: true }),
    })
    load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowResolved(false)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${!showResolved ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          Open ({openCount})
        </button>
        <button
          onClick={() => setShowResolved(true)}
          className={`rounded-full px-3 py-1 text-xs font-medium ${showResolved ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
        >
          Resolved ({resolvedCount})
        </button>
        <button onClick={load} className="ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {t('ui.refresh')}
        </button>
        {showResolved && resolvedCount > 0 && (
          <button onClick={clearResolved} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
            <Trash2 className="h-4 w-4" /> {t('ui.clear')}
          </button>
        )}
      </div>

      {loading && rows.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40">
            <Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="font-semibold">{showResolved ? 'Nothing resolved yet' : 'No errors 🎉'}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {showResolved ? 'Resolved errors will appear here.' : 'Client and server errors show up here automatically.'}
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-2xl border">
          {rows.map((e) => {
            const isOpen = expanded === e.id
            return (
              <div key={e.id} className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    e.level === 'warning'
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                  }`}>
                    {e.level === 'warning' ? <AlertTriangle className="h-4 w-4" /> : <Bug className="h-4 w-4" />}
                  </span>

                  <button onClick={() => setExpanded(isOpen ? null : e.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                      <span className="truncate text-sm font-medium">{e.message}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-5 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5 font-medium">×{e.count}</span>
                      <span>{e.source}</span>
                      <span>{rel(e.lastSeenAt)}</span>
                      {e.url && <span className="truncate">{e.url.replace(/^https?:\/\/[^/]+/, '')}</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => setResolved(e.id, !e.resolved)}
                    title={e.resolved ? 'Reopen' : 'Mark resolved'}
                    className="shrink-0 rounded-lg border p-1.5 text-muted-foreground hover:bg-muted"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-3 space-y-2 pl-11">
                    {e.stack && (
                      <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed">
                        {e.stack}
                      </pre>
                    )}
                    <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                      <div>First seen: {new Date(e.firstSeenAt).toLocaleString()}</div>
                      <div>Last seen: {new Date(e.lastSeenAt).toLocaleString()}</div>
                      {e.userId && <div>User: {e.userId}</div>}
                      {e.userAgent && <div className="truncate">UA: {e.userAgent}</div>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
