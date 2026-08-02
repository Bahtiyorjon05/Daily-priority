'use client'

import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface InstallPromptState {
  canShow: boolean
  isInstalled: boolean
  /** True only when this page IS the installed app (standalone display mode). */
  isStandalone: boolean
  isIOS: boolean
  isAndroid: boolean
  isMobile: boolean
  hasNativePrompt: boolean
  promptInstall: () => Promise<boolean>
  dismiss: () => void
  isDismissed: boolean
  ready: boolean
}

const DISMISS_KEY = 'dp-install-dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000

/**
 * `beforeinstallprompt` fires once, early in the page's life. Components that
 * mount later (e.g. the install entry inside the profile dropdown) would miss
 * it entirely if each hook instance kept its own listener. So the event is
 * captured once at module scope and shared with every consumer.
 */
let deferredPrompt: BeforeInstallPromptEvent | null = null
let promptListenersAttached = false
type PromptSignal = { available: boolean; installed?: boolean }
const promptSubscribers = new Set<(signal: PromptSignal) => void>()

function notifySubscribers(signal: PromptSignal) {
  promptSubscribers.forEach((fn) => fn(signal))
}

function attachGlobalPromptListeners() {
  if (promptListenersAttached || typeof window === 'undefined') return
  promptListenersAttached = true

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    notifySubscribers({ available: true })
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notifySubscribers({ available: false, installed: true })
  })
}

function isDismissedRecently(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (!dismissed) return false
    const timestamp = parseInt(dismissed, 10)
    if (isNaN(timestamp)) return false
    return Date.now() - timestamp < DISMISS_DURATION
  } catch {
    return false
  }
}

export function useInstallPrompt(): InstallPromptState {
  const [hasNativePrompt, setHasNativePrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent || ''
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isAndroidDevice = /Android/i.test(ua)
    const isMobileDevice = isIOSDevice || isAndroidDevice || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768

    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)
    setIsMobile(isMobileDevice)

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')

    setIsInstalled(isStandalone)
    setIsStandalone(isStandalone)
    setIsDismissed(isDismissedRecently())
    setReady(true)

    // Extra signal: on Chromium, detect an already-installed PWA even when the
    // user is browsing in a normal tab, so we don't nag someone who has it.
    // (Returns nothing once the app is uninstalled → prompt is offered again.)
    const nav = navigator as unknown as {
      getInstalledRelatedApps?: () => Promise<Array<{ platform?: string }>>
    }
    if (typeof nav.getInstalledRelatedApps === 'function') {
      nav
        .getInstalledRelatedApps()
        .then((apps) => {
          if (apps && apps.some((a) => a.platform === 'webapp')) {
            setIsInstalled(true)
          }
        })
        .catch(() => {})
    }

    // Subscribe to the shared prompt state so late-mounting consumers still
    // see an event that fired before they existed.
    attachGlobalPromptListeners()
    setHasNativePrompt(!!deferredPrompt)
    const onAvailability = ({ available, installed }: PromptSignal) => {
      setHasNativePrompt(available)
      // Only a real 'appinstalled' event means installed — a consumed or
      // dismissed prompt just means it's no longer offerable this session.
      if (installed) setIsInstalled(true)
    }
    promptSubscribers.add(onAvailability)

    const displayModeQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true)
        setIsStandalone(true)
      }
    }
    displayModeQuery.addEventListener('change', handleDisplayModeChange)

    return () => {
      promptSubscribers.delete(onAvailability)
      displayModeQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [])

  // Show only when the app is genuinely installable:
  //  - Chromium (Android/desktop): the browser fires `beforeinstallprompt`
  //    ONLY when the app is not already installed, and fires it again after an
  //    uninstall — so gating on hasNativePrompt gives us "ask if not installed,
  //    don't ask once installed, ask again if deleted" for free.
  //  - iOS/Safari has no such event, so fall back to manual instructions,
  //    hidden once we detect the app is running installed (standalone).
  const canShow = ready && !isInstalled && !isDismissed && (hasNativePrompt || isIOS)

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const prompt = deferredPrompt
    if (!prompt) return false
    try {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      // A deferred prompt can only be used once.
      deferredPrompt = null
      notifySubscribers({ available: false })
      setHasNativePrompt(false)
      if (outcome === 'accepted') {
        setIsInstalled(true)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const dismiss = useCallback(() => {
    setIsDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString())
    } catch {}
  }, [])

  return {
    canShow,
    isInstalled,
    isStandalone,
    isIOS,
    isAndroid,
    isMobile,
    hasNativePrompt,
    promptInstall,
    dismiss,
    isDismissed,
    ready,
  }
}
