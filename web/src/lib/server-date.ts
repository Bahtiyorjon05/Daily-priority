/**
 * Server-side calendar-day helpers that respect the *user's* timezone.
 *
 * Two traps this avoids:
 *  1. `date.toISOString().split('T')[0]` gives the UTC day, which is a
 *     different calendar day from the user's for most of the world's evening
 *     (or early morning, east of UTC).
 *  2. `new Date(d.toLocaleString('en-US', { timeZone }))` — a common
 *     workaround — re-parses a localized string in the *server's* timezone and
 *     then shifts again on toISOString, so it can still land on the wrong day.
 *
 * `Intl.DateTimeFormat('en-CA', { timeZone })` yields YYYY-MM-DD directly in
 * the target zone, with no round-tripping.
 */

import { prisma } from './prisma'

const DEFAULT_TZ = 'UTC'

function isValidTimeZone(tz: string | null | undefined): tz is string {
  if (!tz) return false
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** Reads the user's stored IANA timezone, falling back to UTC. */
export async function getUserTimezone(userId: string | undefined | null): Promise<string> {
  if (!userId) return DEFAULT_TZ
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    })
    return isValidTimeZone(user?.timezone) ? user!.timezone! : DEFAULT_TZ
  } catch {
    return DEFAULT_TZ
  }
}

/** "YYYY-MM-DD" for `date` as seen in `timeZone`. */
export function dateKeyInTimeZone(date: Date, timeZone: string = DEFAULT_TZ): string {
  const tz = isValidTimeZone(timeZone) ? timeZone : DEFAULT_TZ
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Today's date key in the user's timezone. */
export function todayKeyInTimeZone(timeZone: string = DEFAULT_TZ): string {
  return dateKeyInTimeZone(new Date(), timeZone)
}

/**
 * Date keys for the last `n` days in `timeZone`, most recent first.
 * Stepping by UTC-noon avoids DST edges shifting a day.
 */
export function lastNDayKeysInTimeZone(n: number, timeZone: string = DEFAULT_TZ): string[] {
  const keys: string[] = []
  const today = todayKeyInTimeZone(timeZone)
  const [y, m, d] = today.split('-').map(Number)
  // Anchor at noon UTC so ±14h zone offsets never cross a day boundary.
  const anchor = Date.UTC(y, m - 1, d, 12, 0, 0)
  for (let i = 0; i < n; i++) {
    const day = new Date(anchor - i * 86_400_000)
    const yy = day.getUTCFullYear()
    const mm = String(day.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(day.getUTCDate()).padStart(2, '0')
    keys.push(`${yy}-${mm}-${dd}`)
  }
  return keys
}

/**
 * UTC instant range covering the user's local day `dateKey` (YYYY-MM-DD),
 * suitable for Prisma `gte`/`lt` filters on a DateTime column.
 */
export function localDayRange(dateKey: string, timeZone: string = DEFAULT_TZ): { gte: Date; lt: Date } {
  const [y, m, d] = dateKey.split('-').map(Number)
  // Find the UTC instant whose local date/time in `timeZone` is midnight.
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0)
  const offsetAt = (utcMs: number) => {
    const asLocal = new Date(
      new Intl.DateTimeFormat('en-US', {
        timeZone: isValidTimeZone(timeZone) ? timeZone : DEFAULT_TZ,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      })
        .format(new Date(utcMs))
        .replace(/(\d+)\/(\d+)\/(\d+),?\s+(\d+):(\d+):(\d+)/, '$3-$1-$2T$4:$5:$6Z')
    ).getTime()
    return asLocal - utcMs
  }
  // Two passes converge even across DST transitions.
  let start = guess - offsetAt(guess)
  start = guess - offsetAt(start)
  return { gte: new Date(start), lt: new Date(start + 86_400_000) }
}
