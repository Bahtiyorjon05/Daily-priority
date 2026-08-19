/**
 * The `window.Telegram.WebApp` bridge, typed and narrowed.
 *
 * Only the parts this app uses. Telegram's own script is loaded at runtime and
 * every field is optional in practice: the object exists in old clients with
 * half of it missing, so nothing here assumes a method is present just because
 * the docs list it. Feature-detect, always.
 */

export type TelegramThemeParams = {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
}

export type SafeAreaInset = { top: number; bottom: number; left: number; right: number }

export type TelegramWebApp = {
  initData: string
  initDataUnsafe?: { user?: { id: number; first_name?: string; username?: string } }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: TelegramThemeParams
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  safeAreaInset?: SafeAreaInset
  contentSafeAreaInset?: SafeAreaInset
  ready: () => void
  expand: () => void
  close: () => void
  disableVerticalSwipes?: () => void
  enableClosingConfirmation?: () => void
  setHeaderColor?: (color: string) => void
  setBackgroundColor?: (color: string) => void
  onEvent: (event: string, handler: () => void) => void
  offEvent: (event: string, handler: () => void) => void
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void
  openTelegramLink?: (url: string) => void
  HapticFeedback?: {
    impactOccurred?: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred?: (type: 'error' | 'success' | 'warning') => void
    selectionChanged?: () => void
  }
  BackButton?: {
    isVisible: boolean
    show: () => void
    hide: () => void
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

/** The bridge, or null outside Telegram. */
export function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp ?? null
}

/**
 * Whether this page is really running inside Telegram.
 *
 * Keyed on `initData` being non-empty, not on the object existing. The script
 * can be present -- it is in our own <head> -- while the page is open in an
 * ordinary browser tab, and then `Telegram.WebApp` exists with an empty
 * `initData` and a fabricated theme. Treating that as "inside Telegram" would
 * apply the Mini App chrome to the normal website.
 */
export function isInsideTelegram(): boolean {
  const app = getWebApp()
  return Boolean(app && app.initData && app.initData.length > 0)
}
