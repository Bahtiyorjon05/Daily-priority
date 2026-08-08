import { prisma } from '@/lib/prisma'
import { DEFAULT_LOCALE, normalizeLocale, type Locale } from './locales'
import { getTranslator } from './translate'

/**
 * Locale lookup for server-side senders — verification emails, the weekly
 * review, push notifications.
 *
 * These run outside a request (cron, queues), so there's no cookie to read:
 * the account preference is the only source of truth available, which is
 * exactly why the switcher writes it there as well as to the cookie.
 */

export async function getUserLocale(userId: string): Promise<Locale> {
  try {
    const prefs = await prisma.userPreference.findUnique({
      where: { userId },
      select: { language: true },
    })
    return normalizeLocale(prefs?.language)
  } catch {
    // Never let a preferences lookup be the reason a notification doesn't go
    // out — the wrong language beats silence.
    return DEFAULT_LOCALE
  }
}

/**
 * Locale for an email address.
 *
 * The transactional senders are handed an address, not a user id — password
 * reset and email confirmation both run before there is a session, and the reset
 * flow deliberately accepts addresses that may not have an account at all. So
 * this resolves by email and falls back to the default when there is no match,
 * which also avoids leaking whether an address is registered.
 */
export async function getLocaleForEmail(email: string): Promise<Locale> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { preferences: { select: { language: true } } },
    })
    return normalizeLocale(user?.preferences?.language)
  } catch {
    return DEFAULT_LOCALE
  }
}

/** Convenience for senders that translate several strings for one recipient. */
export async function getUserTranslator(userId: string) {
  const locale = await getUserLocale(userId)
  return { locale, t: getTranslator(locale) }
}
