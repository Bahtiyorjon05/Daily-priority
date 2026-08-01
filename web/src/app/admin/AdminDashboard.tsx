'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database, LogOut, LayoutDashboard, Users as UsersIcon, Table2 } from 'lucide-react'
import type { AdminModel } from '@/lib/admin-models'
import OverviewView from './OverviewView'
import UsersView from './UsersView'
import TablesView from './TablesView'

type View = 'overview' | 'users' | 'tables'

const NAV: { key: View; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'users', label: 'Users', icon: UsersIcon },
  { key: 'tables', label: 'Tables', icon: Table2 },
]

export default function AdminDashboard({
  username,
  models,
}: {
  username: string
  models: AdminModel[]
}) {
  const router = useRouter()
  const [view, setView] = useState<View>('overview')

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Daily Priority</div>
            <div className="text-xs text-muted-foreground">Admin Console</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-3">
          {NAV.map((n) => {
            const Icon = n.icon
            const active = view === n.key
            return (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-primary/10 font-medium text-primary' : 'text-foreground/80 hover:bg-muted'
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </button>
            )
          })}
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
        <header className="flex items-center gap-3 border-b bg-background/80 px-6 py-4 backdrop-blur">
          <h1 className="text-lg font-semibold capitalize">{view}</h1>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {view === 'overview' && <OverviewView />}
          {view === 'users' && <UsersView />}
          {view === 'tables' && <TablesView models={models} />}
        </div>
      </main>
    </div>
  )
}
