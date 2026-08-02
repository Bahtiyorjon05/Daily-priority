import { describe, it, expect } from 'vitest'
import {
  dateKeyInTimeZone,
  todayKeyInTimeZone,
  lastNDayKeysInTimeZone,
  localDayRange,
} from '../server-date'

/**
 * Server-side counterpart to the timezone bug: streaks and daily stats were
 * grouped by the SERVER's UTC day rather than the user's calendar day.
 */
describe('server-date', () => {
  describe('dateKeyInTimeZone', () => {
    it('uses the user day, not the UTC day (west of UTC)', () => {
      // 01:00 UTC on Jan 2 is still 8pm on Jan 1 in New York.
      const instant = new Date('2026-01-02T01:00:00Z')
      expect(dateKeyInTimeZone(instant, 'America/New_York')).toBe('2026-01-01')
      expect(dateKeyInTimeZone(instant, 'UTC')).toBe('2026-01-02')
    })

    it('uses the user day, not the UTC day (east of UTC)', () => {
      // 20:00 UTC on Jan 1 is already 01:00 on Jan 2 in Tashkent (UTC+5).
      const instant = new Date('2026-01-01T20:00:00Z')
      expect(dateKeyInTimeZone(instant, 'Asia/Tashkent')).toBe('2026-01-02')
      expect(dateKeyInTimeZone(instant, 'UTC')).toBe('2026-01-01')
    })

    it('falls back to UTC for an invalid timezone instead of throwing', () => {
      expect(dateKeyInTimeZone(new Date('2026-01-02T01:00:00Z'), 'Not/AZone')).toBe('2026-01-02')
    })
  })

  describe('todayKeyInTimeZone', () => {
    it('returns a well-formed key', () => {
      expect(todayKeyInTimeZone('Asia/Tashkent')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('lastNDayKeysInTimeZone', () => {
    it('returns n consecutive descending days', () => {
      const keys = lastNDayKeysInTimeZone(5, 'America/New_York')
      expect(keys).toHaveLength(5)
      for (let i = 1; i < keys.length; i++) {
        expect(keys[i] < keys[i - 1]).toBe(true)
      }
    })

    it('starts at today in that zone', () => {
      expect(lastNDayKeysInTimeZone(3, 'UTC')[0]).toBe(todayKeyInTimeZone('UTC'))
    })
  })

  describe('localDayRange', () => {
    it('spans exactly 24h for a normal day', () => {
      const { gte, lt } = localDayRange('2026-01-15', 'America/New_York')
      expect((lt.getTime() - gte.getTime()) / 3_600_000).toBe(24)
    })

    it('starts at local midnight (UTC-5 => 05:00Z)', () => {
      expect(localDayRange('2026-01-15', 'America/New_York').gte.toISOString()).toBe(
        '2026-01-15T05:00:00.000Z'
      )
    })

    it('starts at local midnight (UTC+5 => 19:00Z previous day)', () => {
      expect(localDayRange('2026-06-01', 'Asia/Tashkent').gte.toISOString()).toBe(
        '2026-05-31T19:00:00.000Z'
      )
    })

    it('round-trips: range start maps back to the same local day', () => {
      const { gte, lt } = localDayRange('2026-01-15', 'America/New_York')
      expect(dateKeyInTimeZone(gte, 'America/New_York')).toBe('2026-01-15')
      expect(dateKeyInTimeZone(lt, 'America/New_York')).toBe('2026-01-16')
    })

    it('handles the DST spring-forward day', () => {
      // 2026-03-08 is the US spring-forward date; midnight is still 05:00Z.
      const { gte } = localDayRange('2026-03-08', 'America/New_York')
      expect(gte.toISOString()).toBe('2026-03-08T05:00:00.000Z')
      expect(dateKeyInTimeZone(gte, 'America/New_York')).toBe('2026-03-08')
    })
  })
})
