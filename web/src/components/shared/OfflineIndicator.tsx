'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { countPending, flushQueue } from '@/lib/offline-queue'

/**
 * Shows connection state and replays any writes that were made offline.
 * Mounted once in the dashboard layout.
 */
export function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  const refreshCount = useCallback(async () => {
    setPending(await countPending())
  }, [])

  const sync = useCallback(async () => {
    setSyncing(true)
    try {
      const { sent } = await flushQueue()
      await refreshCount()
      if (sent > 0) {
        setJustSynced(true)
        setTimeout(() => setJustSynced(false), 4000)
        // Let open pages pick up server state after a replay.
        window.dispatchEvent(new CustomEvent('offline-queue-flushed', { detail: { sent } }))
      }
    } finally {
      setSyncing(false)
    }
  }, [refreshCount])

  useEffect(() => {
    setOnline(navigator.onLine)
    refreshCount()

    const goOnline = () => {
      setOnline(true)
      sync()
    }
    const goOffline = () => setOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    // Catch writes queued before this mounted.
    if (navigator.onLine) sync()

    const interval = setInterval(refreshCount, 15000)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      clearInterval(interval)
    }
  }, [refreshCount, sync])

  const show = !online || pending > 0 || justSynced

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 z-[90] -translate-x-1/2 lg:bottom-4"
        >
          <div
            className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium shadow-lg backdrop-blur ${
              !online
                ? 'border-amber-300 bg-amber-50/95 text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/80 dark:text-amber-200'
                : justSynced && pending === 0
                  ? 'border-emerald-300 bg-emerald-50/95 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-950/80 dark:text-emerald-200'
                  : 'border-sky-300 bg-sky-50/95 text-sky-800 dark:border-sky-700/60 dark:bg-sky-950/80 dark:text-sky-200'
            }`}
          >
            {!online ? (
              <>
                <CloudOff className="h-3.5 w-3.5" />
                Offline{pending > 0 ? ` — ${pending} change${pending === 1 ? '' : 's'} saved locally` : ' — changes will sync'}
              </>
            ) : pending > 0 ? (
              <>
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                Syncing {pending} change{pending === 1 ? '' : 's'}…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                All changes synced
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
