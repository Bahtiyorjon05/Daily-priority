import { describe, it, expect } from 'vitest'
import { toLocalDateKey, todayKey, isSameLocalDay, lastNDayKeys } from '../date-utils'

/**
 * Regression tests for the timezone bug that silently broke habit streaks:
 * `new Date().toISOString().split('T')[0]` yields the UTC day, so a habit ticked
 * at 8pm in the Americas (or after midnight east of UTC) was recorded against
 * the wrong calendar day.
 */
describe('date-utils', () => {
  const dayInZone = (d: Date, timeZone: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)

  describe('toLocalDateKey', () => {
    it('returns YYYY-MM-DD', () => {
      expect(toLocalDateKey(new Date(2026, 0, 5, 13, 30))).toBe('2026-01-05')
    })

    it('zero-pads month and day', () => {
      expect(toLocalDateKey(new Date(2026, 8, 9, 0, 0))).toBe('2026-09-09')
    })

    it('uses the LOCAL day, not the UTC day', () => {
      // 23:30 local on the 5th. In any zone ahead of UTC this instant is still
      // the 5th locally but may already be the 6th (or still the 4th) in UTC.
      const lateNight = new Date(2026, 0, 5, 23, 30)
      expect(toLocalDateKey(lateNight)).toBe('2026-01-05')
      expect(toLocalDateKey(lateNight)).toBe(dayInZone(lateNight, Intl.DateTimeFormat().resolvedOptions().timeZone))
    })

    it('agrees with the runtime timezone for an early-morning instant', () => {
      const earlyMorning = new Date(2026, 0, 6, 0, 30)
      expect(toLocalDateKey(earlyMorning)).toBe('2026-01-06')
    })

    it('accepts strings and timestamps', () => {
      const d = new Date(2026, 2, 14, 10, 0)
      expect(toLocalDateKey(d.toISOString())).toBe('2026-03-14')
      expect(toLocalDateKey(d.getTime())).toBe('2026-03-14')
    })

    it('returns empty string for an invalid date', () => {
      expect(toLocalDateKey('not-a-date')).toBe('')
    })
  })

  describe('todayKey', () => {
    it('matches the local calendar day', () => {
      const now = new Date()
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      expect(todayKey()).toBe(expected)
    })
  })

  describe('isSameLocalDay', () => {
    it('is true across different times on the same local day', () => {
      expect(isSameLocalDay(new Date(2026, 0, 5, 0, 1), new Date(2026, 0, 5, 23, 59))).toBe(true)
    })

    it('is false across a local midnight', () => {
      expect(isSameLocalDay(new Date(2026, 0, 5, 23, 59), new Date(2026, 0, 6, 0, 1))).toBe(false)
    })
  })

  describe('lastNDayKeys', () => {
    it('returns n keys, most recent first, with no gaps', () => {
      const keys = lastNDayKeys(7)
      expect(keys).toHaveLength(7)
      expect(keys[0]).toBe(todayKey())
      for (let i = 1; i < keys.length; i++) {
        expect(keys[i] < keys[i - 1]).toBe(true)
      }
      expect(new Set(keys).size).toBe(7)
    })
  })
})
