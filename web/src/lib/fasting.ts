import type { HijriDate } from '@/lib/hijri'

/**
 * Which days are recommended for voluntary (nafl) fasting.
 *
 * The Ramadan page was useful for one month a year and empty for eleven. But
 * nafl fasting is a year-round practice with well-known days, and the app already
 * knows the Hijri date — so it can say "today is a Monday" or "tomorrow is
 * Ashura" without any new data source.
 *
 * Only the widely-agreed occasions are listed. This is not the place to take a
 * position on contested rulings, so where schools differ the day is simply not
 * claimed. Fasting on the two Eids is forbidden, and that IS unanimous, so those
 * are marked as such rather than left out — a fasting tracker that says nothing
 * about the one day you must not fast is worse than one that does.
 */

export type FastingOccasion = {
  /** Message key for the name. */
  key: string
  /** `sunnah` is recommended, `forbidden` must not be fasted. */
  kind: 'sunnah' | 'forbidden'
  /** Higher wins when a date qualifies more than once. */
  weight: number
}

/** Weekday fasts: Monday and Thursday. */
const MONDAY = 1
const THURSDAY = 4

/** Ayyām al-Bīḍ — the white days, 13th to 15th of any Hijri month. */
const WHITE_DAYS = [13, 14, 15]

/**
 * What, if anything, this date is.
 *
 * Returns the single most significant occasion. A Monday that is also Ashura is
 * Ashura; saying "Monday" there would bury the more important fact.
 */
export function fastingOccasion(
  date: Date,
  hijri: HijriDate | null
): FastingOccasion | null {
  const found: FastingOccasion[] = []

  if (hijri) {
    const { day, monthNumber } = hijri
    const d = Math.floor(day)

    // Ramadan is obligatory, not nafl — the page handles that month directly.
    if (monthNumber === 9) return null

    // Shawwal 1 and Dhul Hijjah 10-13: fasting is forbidden.
    if (monthNumber === 10 && d === 1) {
      return { key: 'fasting.eidFitr', kind: 'forbidden', weight: 100 }
    }
    if (monthNumber === 12 && d >= 10 && d <= 13) {
      return { key: 'fasting.eidAdha', kind: 'forbidden', weight: 100 }
    }

    // Ashura — 10th of Muharram, with the 9th recommended alongside it.
    if (monthNumber === 1 && d === 10) {
      found.push({ key: 'fasting.ashura', kind: 'sunnah', weight: 90 })
    } else if (monthNumber === 1 && d === 9) {
      found.push({ key: 'fasting.tasua', kind: 'sunnah', weight: 85 })
    }

    // Arafah — 9th of Dhul Hijjah, for those not on Hajj.
    if (monthNumber === 12 && d === 9) {
      found.push({ key: 'fasting.arafah', kind: 'sunnah', weight: 95 })
    }

    // The six days of Shawwal, after Eid.
    if (monthNumber === 10 && d >= 2 && d <= 7) {
      found.push({ key: 'fasting.shawwalSix', kind: 'sunnah', weight: 60 })
    }

    if (WHITE_DAYS.includes(d)) {
      found.push({ key: 'fasting.whiteDays', kind: 'sunnah', weight: 50 })
    }
  }

  const weekday = date.getDay()
  if (weekday === MONDAY) found.push({ key: 'fasting.monday', kind: 'sunnah', weight: 20 })
  if (weekday === THURSDAY) found.push({ key: 'fasting.thursday', kind: 'sunnah', weight: 20 })

  if (found.length === 0) return null
  return found.sort((a, b) => b.weight - a.weight)[0]
}

/** True when fasting on this date is forbidden. */
export function isForbiddenToFast(date: Date, hijri: HijriDate | null): boolean {
  return fastingOccasion(date, hijri)?.kind === 'forbidden'
}
