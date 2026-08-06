/**
 * Locale definitions and detection.
 *
 * Deliberately routing-free: the locale lives in a cookie and in
 * `UserPreferences.language`, never in the URL. A `/[locale]/` segment would
 * have meant rewriting all 25 routes, the manifest `start_url`, the service
 * worker cache keys and the NextAuth callback URLs — a lot of blast radius for
 * an app already in production, and none of it visible to the user.
 *
 * Everything here is pure so it can run in middleware, server components,
 * client components, email jobs and push senders without divergence.
 */

export const LOCALES = ['en', 'uz'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** Cookie name. Readable by the server so the first paint is already correct. */
export const LOCALE_COOKIE = 'dp_locale'

/** One year — a language choice shouldn't quietly expire. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const LOCALE_LABELS: Record<Locale, { native: string; english: string; flag: string }> = {
  en: { native: 'English', english: 'English', flag: '🇬🇧' },
  uz: { native: "O'zbekcha", english: 'Uzbek', flag: '🇺🇿' },
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/**
 * Coerce anything into a usable locale.
 *
 * Accepts region subtags (`uz-UZ`, `en_GB`) because that's what browsers and
 * older stored preferences actually contain. Uzbek Cyrillic (`uz-Cyrl`) still
 * maps to `uz`: the script differs but it's the same language, and shipping
 * Latin is closer than falling back to English.
 */
export function normalizeLocale(value: unknown): Locale {
  if (typeof value !== 'string') return DEFAULT_LOCALE
  const base = value.trim().toLowerCase().replace('_', '-').split('-')[0]
  return isLocale(base) ? base : DEFAULT_LOCALE
}

/**
 * Pick a locale from an `Accept-Language` header, honouring quality weights.
 *
 * Only used on a visitor's very first request. Once someone chooses, the cookie
 * wins forever — re-guessing after an explicit choice is the bug this ordering
 * exists to prevent.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null

  const ranked = header
    .split(',')
    .map(part => {
      const [tag, ...params] = part.trim().split(';')
      const q = params.find(p => p.trim().startsWith('q='))
      // A malformed q= shouldn't promote an entry above explicit ones.
      const weight = q ? Number.parseFloat(q.split('=')[1]) : 1
      return { tag: tag.trim(), weight: Number.isFinite(weight) ? weight : 0 }
    })
    .filter(entry => entry.tag && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight)

  for (const { tag } of ranked) {
    if (tag === '*') continue
    const base = tag.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return null
}

/**
 * Resolve the locale to render with, most authoritative source first.
 *
 * Stored preference beats cookie so a signed-in user gets the same language on
 * a new device; the header is only consulted when we know nothing at all.
 */
export function resolveLocale(sources: {
  stored?: string | null
  cookie?: string | null
  acceptLanguage?: string | null
}): Locale {
  if (isLocale(sources.stored)) return sources.stored
  if (isLocale(sources.cookie)) return sources.cookie
  return localeFromAcceptLanguage(sources.acceptLanguage) ?? DEFAULT_LOCALE
}
