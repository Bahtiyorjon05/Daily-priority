'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'
import { useKeyboardShortcuts, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts'
import { useModalBehavior } from '@/hooks/useModalBehavior'

/**
 * App-wide keyboard shortcuts plus the "?" cheatsheet.
 * Mounted once from the dashboard layout.
 */
export function GlobalShortcuts() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)
  const helpModal = useModalBehavior(showHelp, () => setShowHelp(false))

  const shortcuts = useMemo<KeyboardShortcut[]>(
    () => [
      { key: 'd', description: 'Go to Dashboard', handler: () => router.push('/dashboard') },
      { key: 'p', description: 'Go to Prayers', handler: () => router.push('/prayers') },
      { key: 'h', description: 'Go to Habits', handler: () => router.push('/habits') },
      { key: 'g', description: 'Go to Goals', handler: () => router.push('/goals') },
      { key: 'f', description: 'Go to Focus', handler: () => router.push('/focus') },
      { key: 'j', description: 'Go to Journal', handler: () => router.push('/journal') },
      { key: 'c', description: 'Go to Calendar', handler: () => router.push('/calendar') },
      { key: 'a', description: 'Go to Analytics', handler: () => router.push('/analytics') },
      { key: 'r', description: 'Go to Adhkar', handler: () => router.push('/adhkar') },
      { key: ',', description: 'Open Settings', handler: () => router.push('/settings') },
      { key: '?', shift: true, description: 'Show this help', handler: () => setShowHelp((v) => !v) },
    ],
    [router]
  )

  useKeyboardShortcuts(shortcuts)

  return (
    <AnimatePresence>
      {showHelp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <motion.div
            ref={helpModal.ref}
            {...helpModal.dialogProps}
            aria-labelledby="shortcuts-title"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h2 id="shortcuts-title" className="text-base font-semibold text-gray-900 dark:text-white">
                  Keyboard shortcuts
                </h2>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                aria-label="Close shortcuts help"
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="max-h-[60vh] space-y-1 overflow-y-auto p-4">
              {shortcuts.map((s) => (
                <li key={s.key + s.description} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{s.description}</span>
                  <kbd className="rounded-md border border-gray-300 bg-gray-50 px-2 py-0.5 font-mono text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {s.shift ? 'Shift + ' : ''}
                    {s.key.toUpperCase()}
                  </kbd>
                </li>
              ))}
            </ul>

            <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Shortcuts are ignored while typing in a field. Press{' '}
              <kbd className="rounded border px-1">Esc</kbd> to close.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
