'use client'

import { useT } from '@/lib/i18n/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database, LogOut, LayoutDashboard, Users as UsersIcon, Table2, ArrowLeft, Bug } from 'lucide-react'
import type { AdminModel } from '@/lib/admin-models'
import OverviewView from './OverviewView'
import UsersView from './UsersView'
import TablesView from './TablesView'
import ErrorsView from './ErrorsView'

type View = 'overview' | 'users' | 'tables' | 'errors'

const NAV: { key: View; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: UsersIcon },
  { key: 'tables', label: 'Tables', icon: Table2 },
  { key: 'errors', label: 'Errors', icon: Bug },
]

export default function AdminDashboard({
  username,
  models,
}: {
  username: string
  models: AdminModel[]
}) {
  const { t } = useT()
  const router = useRouter()
  const [view, setView] = useState<View>('overview')

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
      {/* Sidebar — collapses to a top bar + bottom tab row on small screens */}
      <aside className="flex shrink-0 flex-col border-b bg-card lg:w-56 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-4 py-3 lg:border-b lg:py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-tight">{t('ui.dailyPriority')}</div>
            <div className="truncate text-xs text-muted-foreground">{t('ui.adminConsole')}</div>
          </div>
          <a href="/dashboard" aria-label={t('ui.backToApp')} className="rounded-lg p-2 text-foreground/70 hover:bg-muted lg:hidden"><ArrowLeft className="h-4 w-4" /></a>
          {/* Sign out lives inline in the header on mobile */}
          <button
            onClick={handleLogout}
            aria-label={t('nav.signOut')}
            className="rounded-lg p-2 text-foreground/70 hover:bg-muted lg:hidden"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:space-y-1 lg:overflow-visible lg:px-2 lg:py-3">
          {NAV.map((n) => {
            const Icon = n.icon
            const active = view === n.key
            return (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors lg:w-full lg:gap-2.5 ${
                  active ? 'bg-primary/10 font-medium text-primary' : 'text-foreground/80 hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </button>
            )
          })}
        </nav>

        <div className="hidden border-t px-3 py-3 lg:block">
          <div className="mb-2 px-1 text-xs text-muted-foreground">
            {t('ui.signedInAs')} <span className="font-medium text-foreground">{username}</span>
          </div>
          <a
            href="/dashboard"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('ui.backToApp')}
          </a>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <h1 className="text-base font-semibold capitalize sm:text-lg">{view}</h1>
        </header>
        <div className="flex-1 overflow-auto p-3 sm:p-6">
          {view === 'overview' && <OverviewView />}
          {view === 'users' && <UsersView />}
          {view === 'tables' && <TablesView models={models} />}
          {view === 'errors' && <ErrorsView />}
        </div>
      </main>
    </div>
  )
}
