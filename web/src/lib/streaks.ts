/**
 * One definition of a streak, used by every streak in the app.
 *
 * There were already two implementations — one inside the Quran progress route,
 * one on the prayers page — and adding a third for tasks would have meant three
 * answers to "how many days in a row", differing at exactly the edges people
 * notice. This is the single definition.
 *
 * A streak is consecutive days ending **today or yesterday**.
 *
 * Yesterday counting as alive is the important part. Someone who read Qur'an last
 * night and opens the app at 8am has not broken anything, and a counter that
 * resets at midnight tells them they have — which is both untrue and the fastest
 * way to make them stop. The streak only dies when a whole day passes with
 * nothing in it.
 */

const DAY_MS = 86_400_000

/** Local midnight for a date, so one calendar day is one key. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Consecutive days ending today or yesterday.
 *
 * Duplicates and ordering do not matter — the caller can pass raw timestamps
 * straight from the database.
 */
export function streakFromDates(dates: Date[], today = new Date()): number {
  if (dates.length === 0) return 0

  const days = new Set(dates.map((d) => startOfDay(d).getTime()))
  const todayKey = startOfDay(today).getTime()

  // Start from today if there is something there, otherwise from yesterday. If
  // neither has anything, the streak is over.
  let cursor = days.has(todayKey) ? todayKey : todayKey - DAY_MS
  if (!days.has(cursor)) return 0

  let streak = 0
  while (days.has(cursor)) {
    streak++
    cursor -= DAY_MS
  }
  return streak
}

/** True when the streak is still alive but today has nothing in it yet. */
export function streakAtRisk(dates: Date[], today = new Date()): boolean {
  if (dates.length === 0) return false
  const days = new Set(dates.map((d) => startOfDay(d).getTime()))
  const todayKey = startOfDay(today).getTime()
  // Yesterday counted, today has not — the one moment a nudge is useful.
  return !days.has(todayKey) && days.has(todayKey - DAY_MS)
}
