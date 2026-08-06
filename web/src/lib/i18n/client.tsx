'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from './locales'
import { translate, type MessageKey } from './translate'

/**
 * Locale state for the client tree.
 *
 * The locale is adopted in the browser rather than passed down from the server.
 * Reading `cookies()` in the root layout would have resolved it a step earlier,
 * but it also opts the whole app out of static rendering — measured, it turned
 * every route including the marketing page from static to dynamic. Not worth it
 * for a value the browser already has.
 *
 * So: render the default (matching the prerendered HTML, so hydration is
 * clean), then correct it in a *layout* effect. That runs after hydration but
 * before the browser paints, so the wrong language never reaches the screen.
 *
 * Switching afterwards is pure state — no reload, no route change, nothing
 * in-progress is lost.
 */

/** `useLayoutEffect` warns when it runs during SSR; on the server there's no paint to beat. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

function readCookieLocale(): Locale | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`))
  const value = match ? decodeURIComponent(match[1]) : null
  return isLocale(value) ? value : null
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (next: Locale) => void
  t: (key: MessageKey | (string & {}), params?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function writeCookie(locale: Locale) {
  if (typeof document === 'undefined') return
  // `SameSite=Lax` so it survives normal navigation; not `Secure`, because
  // local development is served over plain http and the cookie would vanish.
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`
}

export function LocaleProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  // Adopt the stored choice before the first paint. If there's no cookie yet,
  // fall back to the browser's own languages — a first-time Uzbek visitor
  // shouldn't have to find the switcher to read the page.
  useIsomorphicLayoutEffect(() => {
    const stored = readCookieLocale()
    if (stored) {
      setLocaleState(stored)
      return
    }
    const guessed = localeFromAcceptLanguage(navigator.languages?.join(','))
    // Only a guess, so it isn't written to the cookie: an explicit choice must
    // stay distinguishable from one we made on the user's behalf.
    if (guessed) setLocaleState(guessed)
  }, [])

  // Keep `<html lang>` honest. Screen readers pick pronunciation from it, and
  // it's wrong the moment someone switches if we don't.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    if (!isLocale(next)) return
    setLocaleState(next)
    writeCookie(next)

    // Best-effort account sync. A signed-out visitor 401s here, which is fine —
    // the cookie already holds their choice, so the failure changes nothing
    // they can see.
    void fetch('/api/user/locale', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    }).catch(() => {})
  }, [])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, setLocale]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

/**
 * Translate within a client component.
 *
 * Falls back to the default locale rather than throwing when no provider is
 * present. A missing provider should not be able to blank a page — it degrades
 * to English, which is legible, instead of an error boundary.
 */
export function useT() {
  const ctx = useContext(LocaleContext)
  if (ctx) return ctx
  return {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    t: (key: MessageKey | (string & {}), params?: Record<string, string | number>) =>
      translate(DEFAULT_LOCALE, key, params),
  } satisfies LocaleContextValue
}
