'use client'

import { useT } from '@/lib/i18n/client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Search,
  X,
  KeyRound,
  ShieldCheck,
  Activity,
  RefreshCw,
  ChevronRight,
  Mail,
  Clock,
  MapPin, Trash2 } from 'lucide-react'

interface UserRow {
  id: string
  email: string
  name: string | null
  image: string | null
  createdAt: string
  timezone: string | null
  twoFactorEnabled: boolean
  mustResetPassword: boolean
  passwordCaptured: boolean
  deleted: boolean
  deletedAt: string | null
  deletionReason: string | null
  tasks: number
  tasksCompleted: number
  completionRate: number
  habits: number
  goals: number
  journalEntries: number
  focusSessions: number
  prayerTracking: number
  active7d: boolean
  lastActive: string
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active 7d' },
  { key: 'pendingReset', label: 'Pending reset' },
  { key: 'captured', label: 'Password captured' },
  { key: 'twofactor', label: '2FA on' },
  { key: 'deleted', label: 'Deleted' },
]
const SORTS = [
  { key: 'recent', label: 'Newest' },
  { key: 'active', label: 'Last active' },
  { key: 'tasks', label: 'Most tasks' },
  { key: 'completion', label: 'Completion %' },
  { key: 'email', label: 'Email A–Z' },
]

const fmtDate = (s: string) => new Date(s).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
// When an account was closed is worth knowing to the minute; a join date is not.
const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

export default function UsersView() {
  const { t: tr } = useT()
  const [rows, setRows] = useState<UserRow[]>([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('recent')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users?filter=${filter}&sort=${sort}`, { cache: 'no-store' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || tr('ui.failedToLoad'))
      const data = await res.json()
      setRows(data.users || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [filter, sort])

  useEffect(() => {
    load()
  }, [load])

  const visible = useMemo(() => {
    if (!q.trim()) return rows
    const s = q.toLowerCase()
    return rows.filter((r) => r.email.toLowerCase().includes(s) || (r.name || '').toLowerCase().includes(s))
  }, [rows, q])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tr('ui.searchByEmailOrName')}
            className="w-full rounded-lg border bg-background py-1.5 pl-8 pr-3 text-sm outline-none ring-primary/40 focus:ring-2"
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border bg-background px-2.5 py-1.5 text-sm outline-none">
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {tr('ui.refresh')}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-muted-foreground">{visible.length} {tr('ui.users2')}</span>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">{error}</div>
      ) : loading ? (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">{tr('ui.loadingUsers')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u.id)}
              className="group flex flex-col rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-semibold text-white">
                  {(u.name || u.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{u.name || u.email.split('@')[0]}</div>
                  <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <Metric label={tr('nav.tasks')} value={u.tasks} />
                <Metric label={tr('common.done')} value={`${u.completionRate}%`} />
                <Metric label={tr('nav.habits')} value={u.habits} />
                <Metric label={tr('nav.goals')} value={u.goals} />
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {u.deleted && (
                  <Tag tone="red" icon={Trash2}>
                    {tr('account.deletedBadge')}
                    {u.deletedAt ? ` · ${fmtDate(u.deletedAt)}` : ''}
                  </Tag>
                )}
                {u.active7d && <Tag tone="emerald" icon={Activity}>{tr('ui.active')}</Tag>}
                {u.mustResetPassword && <Tag tone="amber" icon={KeyRound}>{tr('ui.pendingReset')}</Tag>}
                {u.passwordCaptured && <Tag tone="violet" icon={KeyRound}>{tr('ui.pwCaptured')}</Tag>}
                {u.twoFactorEnabled && <Tag tone="blue" icon={ShieldCheck}>2FA</Tag>}
              </div>
            </button>
          ))}
          {visible.length === 0 && <div className="col-span-full py-10 text-center text-sm text-muted-foreground">{tr('ui.noUsersMatch')}</div>}
        </div>
      )}

      {selected && <UserDetail userId={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/50 py-1.5">
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}

function Tag({ children, tone, icon: Icon }: { children: React.ReactNode; tone: string; icon: React.ElementType }) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${tones[tone]}`}>
      <Icon className="h-3 w-3" /> {children}
    </span>
  )
}

// ---------- User detail drawer ----------

interface UserDetailData {
  user: {
    id: string
    email: string
    name: string | null
    createdAt: string
    emailVerified: string | null
    location: string | null
    timezone: string | null
    twoFactorEnabled: boolean
    mustResetPassword: boolean
    hasPassword: boolean
    password: string | null
    deleted: boolean
    deletedAt: string | null
    deletionReason: string | null
    addressReleased: boolean
  }
  stats: {
    tasksTotal: number
    tasksCompleted: number
    completionRate: number
    habitsTotal: number
    goalsTotal: number
    journalTotal: number
    prayerTotal: number
    prayerOnTime: number
    prayerOnTimeRate: number
    focusSessions: number
    focusMinutes: number
  }
  records: Record<string, any[]>
}

const TABS = ['Tasks', 'Habits', 'Goals', 'Journal', 'Prayers', 'Focus'] as const

function UserDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { t: tr } = useT()
  const [data, setData] = useState<UserDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<(typeof TABS)[number]>('Tasks')
  const [taskStatus, setTaskStatus] = useState('all')
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/user/${userId}?taskStatus=${taskStatus}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [userId, taskStatus])

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden border-l bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold">{data?.user.name || data?.user.email || tr('common.user')}</div>
            {data && <div className="truncate text-xs text-muted-foreground">{data.user.email}</div>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        {loading || !data ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">{tr('common.loading')}</div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5">
            {/*
              A closed account used to open looking exactly like a live one — the
              list card carried a badge, but the record itself said nothing. This
              is the whole point of the soft delete: the history is still here,
              and it has to be obvious that it belongs to someone who left.
            */}
            {data.user.deleted && (
              <div className="mb-4 rounded-2xl border border-red-300 bg-red-50 p-4 dark:border-red-800/60 dark:bg-red-950/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-200">
                  <Trash2 className="h-4 w-4 shrink-0" />
                  {tr('account.deletedBadge')}
                  {data.user.deletedAt && (
                    <span className="font-normal">· {fmtDateTime(data.user.deletedAt)}</span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-red-700 dark:text-red-300">
                  {tr('admin.deletedRecordKept')}
                </p>
                {data.user.deletionReason && (
                  <p className="mt-1.5 text-xs text-red-700 dark:text-red-300">
                    <span className="font-medium">{tr('admin.deletionReason')}:</span>{' '}
                    {data.user.deletionReason}
                  </p>
                )}
                {data.user.addressReleased && (
                  <p className="mt-1.5 text-xs text-red-700 dark:text-red-300">
                    {tr('admin.addressReleased')}
                  </p>
                )}
              </div>
            )}

            {/* Profile + password */}
            <div className="mb-4 grid grid-cols-2 gap-3 rounded-2xl border bg-card p-4 text-sm sm:grid-cols-3">
              <Field icon={Mail} label={tr('auth.email')} value={data.user.email} />
              <Field icon={Clock} label={tr('ui.joined')} value={fmtDate(data.user.createdAt)} />
              <Field icon={MapPin} label={tr('ui.timezone')} value={data.user.timezone || '—'} />
              <Field icon={ShieldCheck} label="2FA" value={data.user.twoFactorEnabled ? tr('ui.enabled') : tr('common.off')} />
              <Field icon={Mail} label={tr('ui.verified')} value={data.user.emailVerified ? 'Yes' : 'No'} />
              <Field icon={KeyRound} label={tr('ui.resetPending')} value={data.user.mustResetPassword ? 'Yes' : 'No'} />
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-2xl border bg-card p-4">
              <KeyRound className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{tr('ui.password')}</span>
              {data.user.password ? (
                <>
                  <code className="rounded bg-primary/10 px-2 py-0.5 font-mono text-sm text-primary">
                    {showPw ? data.user.password : '•'.repeat(Math.min(12, data.user.password.length))}
                  </code>
                  <button onClick={() => setShowPw((v) => !v)} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </>
              ) : (
                <span className="text-sm italic text-muted-foreground">{tr('ui.pendingCapturedOnNextResetSignIn')}</span>
              )}
            </div>

            {/* Stat tiles */}
            <div className="mb-4 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
              <Tile label={tr('nav.tasks')} value={data.stats.tasksTotal} />
              <Tile label={tr('ui.done')} value={`${data.stats.completionRate}%`} />
              <Tile label={tr('nav.habits')} value={data.stats.habitsTotal} />
              <Tile label={tr('nav.goals')} value={data.stats.goalsTotal} />
              <Tile label={tr('nav.prayers')} value={data.stats.prayerTotal} />
              <Tile label={tr('nav.focus')} value={`${Math.round(data.stats.focusMinutes / 60)}h`} />
            </div>

            {/* Tabs */}
            <div className="mb-3 flex flex-wrap gap-1.5 border-b pb-2">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === t ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {tab === 'Tasks' && (
              <>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {['all', 'TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setTaskStatus(s)}
                      className={`rounded-full px-2.5 py-0.5 text-xs ${taskStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    >
                      {s === 'all' ? 'All' : s.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <RecordList
                  rows={data.records.tasks}
                  render={(t) => ({
                    title: t.title,
                    meta: `${t.status} · ${t.priority}${t.dueDate ? ' · due ' + fmtDate(t.dueDate) : ''}`,
                  })}
                />
              </>
            )}
            {tab === 'Habits' && (
              <RecordList rows={data.records.habits} render={(h) => ({ title: h.title, meta: `${h.frequency} · streak ${h.streak} · ${h._count?.completions ?? 0} completions` })} />
            )}
            {tab === 'Goals' && (
              <RecordList rows={data.records.goals} render={(g) => ({ title: g.title, meta: `${g.category} · ${g.progress}/${g.target} · ${g.completed ? 'done' : g.status}` })} />
            )}
            {tab === 'Journal' && (
              <RecordList rows={data.records.journal} render={(j) => ({ title: j.reflection || j.gratitude1 || '(entry)', meta: `${fmtDate(j.date)}${j.mood ? ' · ' + j.mood : ''}` })} />
            )}
            {tab === 'Prayers' && (
              <RecordList rows={data.records.prayer} render={(p) => ({ title: p.prayerName, meta: `${fmtDate(p.date)} · ${p.onTime ? 'on time' : 'logged'}` })} />
            )}
            {tab === 'Focus' && (
              <RecordList rows={data.records.focus} render={(f) => ({ title: f.taskTitle || f.sessionType, meta: `${f.duration} min · ${fmtDate(f.date)}` })} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground"><Icon className="h-3 w-3" />{label}</div>
      <div className="truncate text-sm font-medium">{value}</div>
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-card p-2.5 text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}

function RecordList({ rows, render }: { rows: any[]; render: (row: any) => { title: string; meta: string } }) {
  const { t: tr } = useT()
  if (!rows || rows.length === 0) return <div className="py-8 text-center text-sm text-muted-foreground">{tr('ui.noRecords')}</div>
  return (
    <div className="divide-y rounded-xl border">
      {rows.map((r) => {
        const { title, meta } = render(r)
        return (
          <div key={r.id} className="px-3 py-2">
            <div className="truncate text-sm font-medium">{title}</div>
            <div className="truncate text-xs text-muted-foreground">{meta}</div>
          </div>
        )
      })}
    </div>
  )
}
