'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Database,
  LogOut,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  AlertTriangle,
} from 'lucide-react'
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

interface StatsResponse {
  counts: Record<string, number | null>
  vaultConfigured: boolean
}

const PAGE_SIZES = [25, 50, 100, 200]

export default function AdminDashboard({
  username,
  models,
}: {
  username: string
  models: AdminModel[]
}) {
  const router = useRouter()
  const [active, setActive] = useState<string>(models[0]?.key ?? 'user')
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [data, setData] = useState<DataResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [revealPasswords, setRevealPasswords] = useState(true)

  const groups = useMemo(() => {
    const map = new Map<string, AdminModel[]>()
    for (const m of models) {
      if (!map.has(m.group)) map.set(m.group, [])
      map.get(m.group)!.push(m)
    }
    return Array.from(map.entries())
  }, [models])

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' })
      if (res.ok) setStats(await res.json())
    } catch {
      /* non-fatal */
    }
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/admin/data?model=${encodeURIComponent(active)}&page=${page}&pageSize=${pageSize}`,
        { cache: 'no-store' }
      )
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Request failed (${res.status})`)
      }
      setData(await res.json())
    } catch (e) {
      setError((e as Error).message)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [active, page, pageSize])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset paging when switching table.
  useEffect(() => {
    setPage(1)
    setSearch('')
  }, [active])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  const activeModel = models.find((m) => m.key === active)

  const filteredRows = useMemo(() => {
    if (!data) return []
    if (!search.trim()) return data.rows
    const q = search.toLowerCase()
    return data.rows.filter((row) =>
      Object.values(row).some((v) =>
        v != null && String(v).toLowerCase().includes(q)
      )
    )
  }, [data, search])

  const isUserTable = active === 'user'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Daily Priority</div>
            <div className="text-xs text-muted-foreground">Admin Console</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map(([group, items]) => (
            <div key={group} className="mb-4">
              <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group}
              </div>
              {items.map((m) => {
                const count = stats?.counts[m.key]
                const isActive = m.key === active
                return (
                  <button
                    key={m.key}
                    onClick={() => setActive(m.key)}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-foreground/80 hover:bg-muted'
                    }`}
                  >
                    <span className="truncate">{m.label}</span>
                    {count != null && (
                      <span
                        className={`ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="border-t px-3 py-3">
          <div className="mb-2 px-1 text-xs text-muted-foreground">
            Signed in as <span className="font-medium text-foreground">{username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex flex-wrap items-center gap-3 border-b bg-background/80 px-6 py-3 backdrop-blur">
          <div className="mr-auto">
            <h1 className="text-lg font-semibold leading-tight">{activeModel?.label}</h1>
            <p className="text-xs text-muted-foreground">
              {data ? `${data.total} row${data.total === 1 ? '' : 's'} total` : '—'}
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter this page…"
              className="w-56 rounded-lg border bg-background py-1.5 pl-8 pr-3 text-sm outline-none ring-primary/40 focus:ring-2"
            />
          </div>

          {isUserTable && (
            <button
              onClick={() => setRevealPasswords((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              title="Toggle password visibility"
            >
              {revealPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {revealPasswords ? 'Hide passwords' : 'Show passwords'}
            </button>
          )}

          <button
            onClick={() => {
              loadData()
              loadStats()
            }}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </header>

        {isUserTable && stats && !stats.vaultConfigured && (
          <div className="flex items-center gap-2 border-b bg-amber-50 px-6 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            Password vault key is not configured — decrypted passwords will show as
            empty. Set PASSWORD_VAULT_KEY in the environment.
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          ) : loading && !data ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : data && filteredRows.length > 0 ? (
            <DataTable
              columns={data.columns}
              rows={filteredRows}
              isUserTable={isUserTable}
              revealPasswords={revealPasswords}
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              {search ? 'No rows match your filter on this page.' : 'No rows.'}
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <footer className="flex items-center justify-between gap-4 border-t px-6 py-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="rounded-md border bg-background px-2 py-1 text-foreground outline-none"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page <= 1}
                  className="rounded-md border p-1.5 transition-colors hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={data.page >= data.totalPages}
                  className="rounded-md border p-1.5 transition-colors hover:bg-muted disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </footer>
        )}
      </main>
    </div>
  )
}

function DataTable({
  columns,
  rows,
  isUserTable,
  revealPasswords,
}: {
  columns: string[]
  rows: Record<string, unknown>[]
  isUserTable: boolean
  revealPasswords: boolean
}) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => {
              const isPw = col === 'password (decrypted)'
              return (
                <th
                  key={col}
                  className={`whitespace-nowrap px-3 py-2 text-left font-medium ${
                    isPw ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {isPw && <KeyRound className="h-3.5 w-3.5" />}
                    {col}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
              {columns.map((col) => (
                <td key={col} className="max-w-[360px] px-3 py-2 align-top">
                  <Cell
                    column={col}
                    value={row[col]}
                    isUserTable={isUserTable}
                    revealPasswords={revealPasswords}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Cell({
  column,
  value,
  isUserTable,
  revealPasswords,
}: {
  column: string
  value: unknown
  isUserTable: boolean
  revealPasswords: boolean
}) {
  const isPasswordCol = isUserTable && column === 'password (decrypted)'

  if (isPasswordCol) {
    if (value == null || value === '') {
      return (
        <span className="text-xs italic text-muted-foreground">
          — pending (captured on next sign-in)
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-medium text-primary">
        <KeyRound className="h-3 w-3" />
        {revealPasswords ? String(value) : '•'.repeat(Math.min(12, String(value).length))}
      </span>
    )
  }

  if (value == null) {
    return <span className="text-xs italic text-muted-foreground">null</span>
  }

  if (typeof value === 'boolean') {
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          value
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {String(value)}
      </span>
    )
  }

  if (typeof value === 'object') {
    return (
      <code className="block max-h-24 overflow-auto whitespace-pre-wrap break-words rounded bg-muted px-1.5 py-1 font-mono text-xs">
        {JSON.stringify(value, null, 2)}
      </code>
    )
  }

  const str = String(value)
  // Highlight ISO datetimes lightly.
  const isDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)
  return (
    <span
      className={`block break-words ${isDate ? 'font-mono text-xs text-muted-foreground' : ''}`}
      title={str.length > 80 ? str : undefined}
    >
      {str.length > 200 ? str.slice(0, 200) + '…' : str}
    </span>
  )
}
