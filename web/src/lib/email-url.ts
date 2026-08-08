/**
 * The base URL to use inside emails.
 *
 * Emails are read on someone else's device, so a `localhost` origin is never
 * reachable — a link goes nowhere and an image renders as nothing. Production
 * was sending both: `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` were set to
 * `http://localhost:3000` months ago during development, so the footer link read
 * "localhost:3000" and the header icon never loaded.
 *
 * Rather than depend on those being corrected, this refuses a loopback origin
 * outright when running in production and falls through to the next candidate.
 * A misconfigured variable can then only cost a redirect, never a broken email.
 *
 * Kept in one place because three files were each resolving this differently,
 * and one of them — the confirmation link — used `NEXTAUTH_URL` with no fallback
 * at all.
 */

const FALLBACK = 'https://daily-priority.vercel.app'

const isLoopback = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/i.test(url)

export function emailBaseUrl(): string {
  const candidates = [
    // Explicit override, for when the canonical domain differs from the app's.
    process.env.EMAIL_BASE_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    // Vercel exposes the production domain, which is right by construction.
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue
    const url = candidate.trim().replace(/\/+$/, '')
    if (!/^https?:\/\//i.test(url)) continue
    // Loopback is fine while developing — you are the recipient. In production
    // it is always wrong, so keep looking.
    if (process.env.NODE_ENV === 'production' && isLoopback(url)) continue
    return url
  }

  return FALLBACK
}
