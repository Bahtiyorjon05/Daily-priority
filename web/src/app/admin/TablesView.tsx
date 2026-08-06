'use client'

import { useT } from '@/lib/i18n/client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Search, ChevronLeft, ChevronRight, KeyRound, Eye, EyeOff } from 'lucide-react'
import type { AdminModel } from '@/lib/admin-models'

interface DataResponse {
  model: string
  label: string
  columns: string[]
  rows: Record<string, unknown>[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const PAGE_SIZES = [25, 50, 100, 200]
// Models that can be filtered by a user (mirror of the server registry).
const USER_FILTERABLE = new Set([
  'user', 'account', 'session', 'task', 'category', 'habit', 'analytics',
  'prayerTime', 'prayerTracking', 'journalEntry', 'goal', 'userPreference',
  'focusSession', 'calendarEvent', 'adhkarProgress', 'userSettings', 'twoFactorToken',
])

export default function TablesView({ models }: { models: AdminModel[] }) {
  const { t } = useT()
  const [active, setActive] = useState<string>(models[0]?.key ?? 'user')
  const [data, setData] = useState<DataResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [userOptions, setUserOptions] = useState<{ id: string; email: string }[]>([])
  const [reveal, setReveal] = useState(true)

  const groups = useMemo(() => {
    const m = new Map<string, AdminModel[]>()
    for (const model of models) {
      if (!m.has(model.group)) m.set(model.group, [])
      m.get(model.group)!.push(model)
    }
    return [...m.entries()]
  }, [models])

  // Load a lightweight user list once for the per-user filter dropdown.
  useEffect(() => {
    fetch('/api/admin/users?sort=email', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setUserOptions((d.users || []).map((u: any) => ({ id: u.id, email: u.email }))))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const uq = userFilter && USER_FILTERABLE.has(active) ? `&userId=${encodeURIComponent(userFilter)}` : ''
      const res = await fetch(`/api/admin/data?model=${active}&page=${page}&pageSize=${pageSize}${uq}`, { cache: 'no-store' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Failed (${res.status})`)
      setData(await res.json())
    } catch (e) {
      setError((e as Error).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [active, page, pageSize, userFilter])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    setPage(1)
    setSearch('')
  }, [active, userFilter])

  const isUserTable = active === 'user'
  const filtered = useMemo(() => {
    if (!data) return []
    if (!search.trim()) return data.rows
    const s = search.toLowerCase()
    return data.rows.filter((r) => Object.values(r).some((v) => v != null && String(v).toLowerCase().includes(s)))
  }, [data, search])

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="rounded-lg border bg-background px-2.5 py-1.5 text-sm outline-none"
        >
          {groups.map(([g, items]) => (
            <optgroup key={g} label={g}>
              {items.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </optgroup>
          ))}
        </select>

        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          disabled={!USER_FILTERABLE.has(active)}
          title={USER_FILTERABLE.has(active) ? t('ui.filterByUser') : t('ui.thisTableHasNoUserLink')}
          className="max-w-[220px] rounded-lg border bg-background px-2.5 py-1.5 text-sm outline-none disabled:opacity-40"
        >
          <option value="">{t('ui.allUsers')}</option>
          {userOptions.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
        </select>

        <div className="relative min-w-[160px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('ui.filterThisPage')}
            className="w-full rounded-lg border bg-background py-1.5 pl-8 pr-3 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>

        {isUserTable && (
          <button onClick={() => setReveal((v) => !v)} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {reveal ? 'Hide' : 'Show'} pw
          </button>
        )}
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {t('ui.refresh')}
        </button>
      </div>

      <div className="text-xs text-muted-foreground">{data ? `${data.total} rows total` : '—'}</div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">{error}</div>
      ) : loading && !data ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">{t('common.loading')}</div>
      ) : data && filtered.length > 0 ? (
        <DataTable columns={data.columns} rows={filtered} isUserTable={isUserTable} reveal={reveal} />
      ) : (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">{search ? t('ui.noRowsMatchYourFilter') : t('ui.noRows')}</div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 border-t pt-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>{t('ui.rows')}</span>
            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }} className="rounded-md border bg-background px-2 py-1 text-foreground">
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{t('ui.page')} {data.page} / {data.totalPages}</span>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={data.page <= 1} className="rounded-md border p-1.5 hover:bg-muted disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={data.page >= data.totalPages} className="rounded-md border p-1.5 hover:bg-muted disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>
  )
}

function DataTable({ columns, rows, isUserTable, reveal }: { columns: string[]; rows: Record<string, unknown>[]; isUserTable: boolean; reveal: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((c) => {
              const isPw = c === 'password (decrypted)'
              return (
                <th key={c} className={`whitespace-nowrap px-3 py-2 text-left font-medium ${isPw ? 'text-primary' : 'text-muted-foreground'}`}>
                  <span className="inline-flex items-center gap-1">{isPw && <KeyRound className="h-3.5 w-3.5" />}{c}</span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
              {columns.map((c) => (
                <td key={c} className="max-w-[360px] px-3 py-2 align-top">
                  <Cell column={c} value={row[c]} isUserTable={isUserTable} reveal={reveal} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Cell({ column, value, isUserTable, reveal }: { column: string; value: unknown; isUserTable: boolean; reveal: boolean }) {
  const { t } = useT()

  if (isUserTable && column === 'password (decrypted)') {
    if (value == null || value === '') return <span className="text-xs italic text-muted-foreground">{t('ui.pending2')}</span>
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
        <KeyRound className="h-3 w-3" />{reveal ? String(value) : '•'.repeat(Math.min(12, String(value).length))}
      </span>
    )
  }
  if (value == null) return <span className="text-xs italic text-muted-foreground">null</span>
  if (typeof value === 'boolean')
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${value ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>{String(value)}</span>
  if (typeof value === 'object')
    return <code className="block max-h-24 overflow-auto whitespace-pre-wrap break-words rounded bg-muted px-1.5 py-1 font-mono text-xs">{JSON.stringify(value, null, 2)}</code>
  const str = String(value)
  const isDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)
  return <span className={`block break-words ${isDate ? 'font-mono text-xs text-muted-foreground' : ''}`} title={str.length > 80 ? str : undefined}>{str.length > 200 ? str.slice(0, 200) + '…' : str}</span>
}
