/**
 * Local-date helpers.
 *
 * IMPORTANT: `new Date().toISOString().split('T')[0]` returns the **UTC** day,
 * not the user's day. For anyone west of UTC (all of the Americas) that rolls
 * over to "tomorrow" in the early evening — so habits ticked at 8pm were being
 * recorded against the wrong day and streaks broke. Always use these helpers
 * when the value represents a calendar day in the user's own timezone.
 */

/** "YYYY-MM-DD" for a date, in the viewer's local timezone. */
export function toLocalDateKey(date: Date | string | number = new Date()): string {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Today's local date key. */
export function todayKey(): string {
  return toLocalDateKey(new Date())
}

/** True when the two values fall on the same local calendar day. */
export function isSameLocalDay(a: Date | string, b: Date | string): boolean {
  return toLocalDateKey(a) === toLocalDateKey(b)
}

/** Local date keys for the last `n` days, most recent first (includes today). */
export function lastNDayKeys(n: number): string[] {
  const out: string[] = []
  const base = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    out.push(toLocalDateKey(d))
  }
  return out
}
