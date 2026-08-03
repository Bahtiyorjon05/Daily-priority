import { describe, it, expect } from 'vitest'
import { resolvePhase, phaseFromClock, toMinutes, isDarkPhase } from '../prayer-phase'

// A realistic day: Fajr 05:12, sunrise 06:32, Dhuhr 12:45, Asr 16:20,
// Maghrib 19:05, Isha 20:30.
const TIMES = {
  fajr: '05:12',
  sunrise: '06:32',
  dhuhr: '12:45',
  asr: '16:20',
  maghrib: '19:05',
  isha: '20:30',
}

const at = (h: number, m = 0) => new Date(2026, 5, 15, h, m)

describe('prayer-phase', () => {
  describe('toMinutes', () => {
    it('parses HH:MM', () => {
      expect(toMinutes('05:12')).toBe(312)
      expect(toMinutes('00:00')).toBe(0)
      expect(toMinutes('23:59')).toBe(1439)
    })

    it('rejects rubbish', () => {
      expect(toMinutes('')).toBeNull()
      expect(toMinutes('nope')).toBeNull()
      expect(toMinutes(null)).toBeNull()
      expect(toMinutes('25:00')).toBeNull()
      expect(toMinutes('12:99')).toBeNull()
    })
  })

  describe('resolvePhase with real prayer times', () => {
    it('is night before Fajr', () => {
      expect(resolvePhase(TIMES, at(3, 0)).phase).toBe('night')
    })

    it('turns to dawn exactly at Fajr', () => {
      expect(resolvePhase(TIMES, at(5, 11)).phase).toBe('night')
      expect(resolvePhase(TIMES, at(5, 12)).phase).toBe('dawn')
    })

    it('is morning after sunrise', () => {
      expect(resolvePhase(TIMES, at(6, 31)).phase).toBe('dawn')
      expect(resolvePhase(TIMES, at(6, 32)).phase).toBe('morning')
      expect(resolvePhase(TIMES, at(10, 0)).phase).toBe('morning')
    })

    it('is midday from Dhuhr to Asr', () => {
      expect(resolvePhase(TIMES, at(12, 45)).phase).toBe('midday')
      expect(resolvePhase(TIMES, at(15, 0)).phase).toBe('midday')
      expect(resolvePhase(TIMES, at(16, 19)).phase).toBe('midday')
    })

    it('is afternoon from Asr to Maghrib', () => {
      expect(resolvePhase(TIMES, at(16, 20)).phase).toBe('afternoon')
      expect(resolvePhase(TIMES, at(19, 4)).phase).toBe('afternoon')
    })

    it('is dusk from Maghrib to Isha', () => {
      expect(resolvePhase(TIMES, at(19, 5)).phase).toBe('dusk')
      expect(resolvePhase(TIMES, at(20, 29)).phase).toBe('dusk')
    })

    it('is night from Isha, and wraps past midnight', () => {
      expect(resolvePhase(TIMES, at(20, 30)).phase).toBe('night')
      expect(resolvePhase(TIMES, at(23, 59)).phase).toBe('night')
      expect(resolvePhase(TIMES, at(0, 30)).phase).toBe('night')
    })

    it('covers the whole day with no gaps', () => {
      const seen = new Set<string>()
      for (let m = 0; m < 1440; m++) {
        const p = resolvePhase(TIMES, at(Math.floor(m / 60), m % 60)).phase
        expect(p).toBeTruthy()
        seen.add(p)
      }
      // Every phase should occur at least once in a normal day.
      expect(seen).toEqual(new Set(['night', 'dawn', 'morning', 'midday', 'afternoon', 'dusk']))
    })

    it('approximates sunrise when it is missing', () => {
      const noSunrise = { ...TIMES, sunrise: undefined }
      // Fajr + 80min = 06:32, so behaviour should match the full set.
      expect(resolvePhase(noSunrise, at(6, 0)).phase).toBe('dawn')
      expect(resolvePhase(noSunrise, at(7, 0)).phase).toBe('morning')
    })

    it('exposes a label and the associated prayer', () => {
      const meta = resolvePhase(TIMES, at(19, 30))
      expect(meta.label).toBe('Dusk')
      expect(meta.prayer).toBe('Maghrib')
    })
  })

  describe('fallback when prayer times are unknown', () => {
    it('falls back to the clock rather than failing', () => {
      expect(resolvePhase(null, at(3, 0)).phase).toBe('night')
      expect(resolvePhase(undefined, at(13, 0)).phase).toBe('midday')
      expect(resolvePhase({ fajr: '05:00' }, at(13, 0)).phase).toBe('midday')
    })

    it('clock fallback covers the full day', () => {
      for (let m = 0; m < 1440; m++) {
        expect(phaseFromClock(m)).toBeTruthy()
      }
    })
  })

  describe('isDarkPhase', () => {
    it('treats night and dawn as dark', () => {
      expect(isDarkPhase('night')).toBe(true)
      expect(isDarkPhase('dawn')).toBe(true)
      expect(isDarkPhase('morning')).toBe(false)
      expect(isDarkPhase('midday')).toBe(false)
    })
  })
})
