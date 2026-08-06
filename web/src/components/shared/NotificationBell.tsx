'use client'

import { useT } from '@/lib/i18n/client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  CheckCheck,
  AlertTriangle,
  Clock,
  Target,
  Repeat,
} from 'lucide-react'

interface AppNotification {
  id: string
  type: 'task-overdue' | 'task-due-soon' | 'habit-due' | 'goal-overdue'
  title: string
  body: string
  href: string
  severity: 'high' | 'medium' | 'low'
  at: string
}

const SEEN_KEY = 'dp-notif-seen'
const MUTE_KEY = 'dp-notif-muted'
const POLL_MS = 60_000

function loadSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

function iconFor(type: AppNotification['type']) {
  switch (type) {
    case 'task-overdue':
      return AlertTriangle
    case 'task-due-soon':
      return Clock
    case 'habit-due':
      return Repeat
    case 'goal-overdue':
      return Target
  }
}

export function NotificationBell() {
  const { t: tr } = useT()
  const router = useRouter()
  const [items, setItems] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState<Set<string>>(() => loadSeen())
  const [muted, setMuted] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  const knownIdsRef = useRef<Set<string>>(new Set())
  const audioCtxRef = useRef<AudioContext | null>(null)
  const firstLoadRef = useRef(true)

  // Restore mute pref + notification permission on mount.
  useEffect(() => {
    try {
      setMuted(localStorage.getItem(MUTE_KEY) === '1')
    } catch {}
    if (typeof Notification !== 'undefined') setPermission(Notification.permission)
  }, [])

  // Unlock audio on the first user gesture so alert sounds can play later.
  useEffect(() => {
    const unlock = () => {
      try {
        if (!audioCtxRef.current) {
          const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          audioCtxRef.current = new Ctx()
        }
        audioCtxRef.current?.resume().catch(() => {})
      } catch {}
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const playChime = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    try {
      const now = ctx.currentTime
      // Two soft tones.
      ;[880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = freq
        const t = now + i * 0.16
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.3)
      })
    } catch {}
  }, [])

  const showSystemNotifications = useCallback(
    async (fresh: AppNotification[]) => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      try {
        // Prefer the service worker so notifications work in the installed PWA.
        const reg =
          typeof navigator !== 'undefined' && navigator.serviceWorker
            ? await navigator.serviceWorker.ready.catch(() => null)
            : null
        // Only surface the few most important, to avoid a burst.
        for (const n of fresh.slice(0, 3)) {
          const opts: NotificationOptions & { data?: unknown } = {
            body: n.body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: n.id,
            // SW notificationclick handler reads notification.data as a URL string.
            data: n.href,
          }
          if (reg) await reg.showNotification(n.title, opts)
          else new Notification(n.title, opts)
        }
      } catch {}
    },
    []
  )

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = (await res.json()) as { notifications: AppNotification[] }
      const list = data.notifications || []
      setItems(list)

      const currentIds = new Set(list.map((n) => n.id))
      const fresh = list.filter((n) => !knownIdsRef.current.has(n.id))

      // Don't alert on the very first load of the session — only on new arrivals.
      if (!firstLoadRef.current && fresh.length > 0) {
        if (!muted) playChime()
        showSystemNotifications(fresh)
      }
      knownIdsRef.current = currentIds
      firstLoadRef.current = false
    } catch {
      /* offline / transient — ignore */
    }
  }, [muted, playChime, showSystemNotifications])

  useEffect(() => {
    fetchNotifications()
    const id = setInterval(fetchNotifications, POLL_MS)
    const onFocus = () => fetchNotifications()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [fetchNotifications])

  // Close on outside click.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (!el.closest('[data-notif-root]')) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [open])

  const unreadCount = items.filter((n) => !seen.has(n.id)).length

  const markAllSeen = useCallback(() => {
    const next = new Set(items.map((n) => n.id))
    setSeen(next)
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify([...next]))
    } catch {}
  }, [items])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m
      try {
        localStorage.setItem(MUTE_KEY, next ? '1' : '0')
      } catch {}
      return next
    })
  }, [])

  const enableAlerts = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    try {
      const p = await Notification.requestPermission()
      setPermission(p)
    } catch {}
  }, [])

  const handleOpen = () => {
    const next = !open
    setOpen(next)
    if (next) markAllSeen()
  }

  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <div className="relative" data-notif-root>
      <button
        onClick={handleOpen}
        aria-label={tr('nav.notifications')}
        className="relative flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md h-11 w-11 min-h-[44px] min-w-[44px] shrink-0"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white dark:border-gray-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Dimmed backdrop on mobile so the panel reads as a sheet and it's
                obvious that tapping away closes it. Hidden from sm up. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-[2px] sm:hidden"
              aria-hidden="true"
            />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            /*
             * Mobile: the bell isn't the right-most header item, so anchoring a
             * near-full-width panel with `right-0` pushed it off the left edge.
             * Use symmetric left/right insets (not a translate — Framer Motion
             * owns `transform` and would override it), then switch to the
             * button-anchored dropdown from `sm` up where there's room.
             */
            className="fixed left-3 right-3 top-[4.5rem] mx-auto max-w-sm
                       sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-none
                       bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden z-[70]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">{tr('nav.notifications')}</span>
                {items.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{items.length}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMute}
                  title={muted ? 'Unmute sound' : 'Mute sound'}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={markAllSeen}
                  title={tr('ui.markAllRead')}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                onClick={enableAlerts}
                className="w-full px-4 py-2.5 text-left text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border-b border-emerald-100 dark:border-emerald-900/40"
              >
{tr('ui.enableDeviceNotificationsWorksInTheInstalled')}
</button>
            )}

            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-gray-400">
{tr('ui.youReAllCaughtUp')}
</div>
              ) : (
                items.map((n) => {
                  const Icon = iconFor(n.type)
                  const high = n.severity === 'high'
                  return (
                    <button
                      key={n.id}
                      onClick={() => go(n.href)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-50 dark:border-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                          high
                            ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                            : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">
                          {n.title}
                        </span>
                        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                          {n.body}
                        </span>
                      </span>
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
