'use client'

import { useT } from '@/lib/i18n/client'
import { useEffect, useState } from 'react'
import HealthPanel from './HealthPanel'
import dynamic from 'next/dynamic'

// recharts is ~370 kB; the KPI cards above the charts shouldn't wait for it,
// and it shouldn't be duplicated into this route's bundle.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chart = (name: string): React.ComponentType<any> =>
  dynamic(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => import('recharts').then((m) => (m as any)[name]),
    { ssr: false }
  ) as React.ComponentType<any>
const ResponsiveContainer = chart('ResponsiveContainer')
const AreaChart = chart('AreaChart')
const Area = chart('Area')
const BarChart = chart('BarChart')
const Bar = chart('Bar')
const XAxis = chart('XAxis')
const YAxis = chart('YAxis')
const Tooltip = chart('Tooltip')
const CartesianGrid = chart('CartesianGrid')
const Cell = chart('Cell')
import {
  Users,
  Activity,
  CheckSquare,
  Repeat,
  Target,
  BookOpen,
  Moon,
  Timer,
  KeyRound,
  ShieldCheck,
} from 'lucide-react'

interface OverviewData {
  kpis: {
    totalUsers: number
    activeUsers7d: number
    pendingReset: number
    passwordCaptured: number
    twoFactorUsers: number
    totalTasks: number
    completedTasks: number
    totalHabits: number
    totalGoals: number
    completedGoals: number
    totalJournal: number
    totalPrayerTracking: number
    focusSessions: number
    focusMinutes: number
    vaultConfigured: boolean
  }
  tasksByStatus: Record<string, number>
  tasksByPriority: Record<string, number>
  signups: { date: string; count: number; total: number }[]
  focusTrend: { date: string; minutes: number }[]
  topUsers: { userId: string; email: string; name: string | null; tasks: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
}
const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#94a3b8',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  URGENT: '#ef4444',
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = 'emerald',
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  tone?: 'emerald' | 'blue' | 'amber' | 'violet' | 'rose' | 'slate'
}) {
  const tones: Record<string, string> = {
    emerald: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400',
    blue: 'from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400',
    amber: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400',
    violet: 'from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400',
    rose: 'from-rose-500/10 to-pink-500/10 text-rose-600 dark:text-rose-400',
    slate: 'from-slate-500/10 to-gray-500/10 text-slate-600 dark:text-slate-400',
  }
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function TooltipBox({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-md">
      <div className="font-medium">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

export default function OverviewView() {
  const { t } = useT()
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/admin/overview', { cache: 'no-store' })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load')
        setData(await res.json())
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{t('ui.loadingOverview')}</div>
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">{error}</div>
  if (!data) return null

  const k = data.kpis
  const statusData = Object.entries(data.tasksByStatus).map(([name, value]) => ({ name, value }))
  const priorityData = Object.entries(data.tasksByPriority).map(([name, value]) => ({ name, value }))
  const shortDate = (d: string) => d.slice(5)

  return (
    <div className="space-y-5">
      {/* Is the scheduler alive? Most likely thing to break silently. */}
      <HealthPanel />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={Users} label={t('ui.users')} value={k.totalUsers} sub={`${k.twoFactorUsers} with 2FA`} tone="emerald" />
        <StatCard icon={Activity} label={t('ui.active7d')} value={k.activeUsers7d} sub={`${Math.round((k.activeUsers7d / Math.max(1, k.totalUsers)) * 100)}% of users`} tone="blue" />
        <StatCard icon={CheckSquare} label={t('nav.tasks')} value={k.totalTasks} sub={`${k.completedTasks} completed`} tone="violet" />
        <StatCard icon={Repeat} label={t('nav.habits')} value={k.totalHabits} tone="amber" />
        <StatCard icon={Target} label={t('nav.goals')} value={k.totalGoals} sub={`${k.completedGoals} done`} tone="rose" />
        <StatCard icon={BookOpen} label={t('nav.journal')} value={k.totalJournal} tone="blue" />
        <StatCard icon={Moon} label={t('ui.prayersLogged')} value={k.totalPrayerTracking} tone="emerald" />
        <StatCard icon={Timer} label={t('nav.focus')} value={`${Math.round(k.focusMinutes / 60)}h`} sub={`${k.focusSessions} sessions`} tone="violet" />
        <StatCard icon={KeyRound} label={t('ui.passwordsCaptured')} value={`${k.passwordCaptured}/${k.totalUsers}`} sub={`${k.pendingReset} pending reset`} tone="amber" />
        <StatCard icon={ShieldCheck} label={t('ui.vault')} value={k.vaultConfigured ? 'On' : 'Off'} sub="AES-256-GCM" tone={k.vaultConfigured ? 'emerald' : 'rose'} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title={t('ui.userGrowth30Days')}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.signups} margin={{ left: -20, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="ug" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.3} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10 }} minTickGap={24} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<TooltipBox />} />
              <Area type="monotone" dataKey="total" name="Total users" stroke="#10b981" strokeWidth={2} fill="url(#ug)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('ui.focusMinutes14Days')}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.focusTrend} margin={{ left: -20, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.3} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10 }} minTickGap={16} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<TooltipBox />} />
              <Bar dataKey="minutes" name="Minutes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('ui.tasksByStatus')}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} margin={{ left: -20, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<TooltipBox />} />
              <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                {statusData.map((e) => (
                  <Cell key={e.name} fill={STATUS_COLORS[e.name] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('ui.tasksByPriority')}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} margin={{ left: -20, right: 8, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip content={<TooltipBox />} />
              <Bar dataKey="value" name="Tasks" radius={[4, 4, 0, 0]}>
                {priorityData.map((e) => (
                  <Cell key={e.name} fill={PRIORITY_COLORS[e.name] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Top users */}
      <ChartCard title={t('ui.mostActiveUsersByTasks')}>
        <div className="space-y-1">
          {data.topUsers.length === 0 && <div className="py-4 text-center text-sm text-muted-foreground">{t('ui.noData')}</div>}
          {data.topUsers.map((u, i) => (
            <div key={u.userId} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm">{u.name || u.email}</span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{u.tasks} {t('ui.tasks')}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
