'use client'

import { useState } from 'react'
import { Download, Check } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

/**
 * Persistent "Install app" entry for the profile menu.
 *
 * The floating banner snoozes itself for a week once dismissed, which left no
 * way back to the install flow. This entry deliberately ignores that dismissal
 * — it stays available for as long as the app isn't installed.
 */
export function InstallMenuItem({ onNavigate }: { onNavigate?: () => void }) {
  const { ready, isInstalled, isIOS, isAndroid, hasNativePrompt, promptInstall } =
    useInstallPrompt()
  const [tip, setTip] = useState('')

  // Nothing to offer once it's already installed.
  if (!ready || isInstalled) return null

  const handleClick = async () => {
    if (hasNativePrompt) {
      const accepted = await promptInstall()
      if (accepted) onNavigate?.()
      return
    }
    // No native prompt (iOS/Safari, or the event hasn't fired) — tell the user
    // how to do it manually instead of silently doing nothing.
    setTip(
      isIOS
        ? 'Tap Share ↗ in Safari, then "Add to Home Screen".'
        : isAndroid
          ? 'Tap ⋮ in your browser menu, then "Install app".'
          : 'Open your browser menu and choose "Install app".'
    )
  }

  return (
    <div className="border-b-2 border-gray-100 dark:border-gray-800">
      <button
        onClick={handleClick}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
      >
        <Download className="h-4 w-4 shrink-0" />
        Install app
      </button>
      {tip && (
        <p className="flex items-start gap-1.5 bg-emerald-50/70 px-4 pb-2.5 text-[11px] leading-snug text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300">
          <Check className="mt-0.5 h-3 w-3 shrink-0" />
          {tip}
        </p>
      )}
    </div>
  )
}
