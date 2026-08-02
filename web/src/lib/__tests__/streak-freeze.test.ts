import { describe, it, expect } from 'vitest'

/**
 * Mirror of the daily-habit streak calculation in src/app/api/habits/route.ts.
 *
 * Kept in sync deliberately: the first implementation consumed freezes on
 * trailing empty days *after* a streak had already ended, so a long-abandoned
 * habit silently burned its grace days. These cases pin the intended behaviour.
 */
function calcStreak(completedDayOffsets: number[], freezesAvailable: number) {
  const today = new Date(2026, 5, 15)
  today.setHours(0, 0, 0, 0)

  const completedDays = new Set(
    completedDayOffsets.map((o) => {
      const d = new Date(today)
      d.setDate(d.getDate() - o)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
  )

  const currentDate = new Date(today)
  let streak = 0
  let freezesUsed = 0
  let pendingFreezes = 0

  // Not having ticked today yet must not break the streak.
  if (!completedDays.has(currentDate.getTime())) {
    currentDate.setDate(currentDate.getDate() - 1)
  }

  for (let i = 0; i < 366; i++) {
    if (completedDays.has(currentDate.getTime())) {
      streak++
      freezesUsed += pendingFreezes // only commit once the streak continues
      pendingFreezes = 0
    } else if (freezesAvailable - freezesUsed - pendingFreezes > 0) {
      pendingFreezes++
    } else {
      break
    }
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return { streak, freezesUsed }
}

describe('habit streak with freezes', () => {
  it('counts a perfect run without spending freezes', () => {
    expect(calcStreak([0, 1, 2, 3, 4], 2)).toEqual({ streak: 5, freezesUsed: 0 })
  })

  it('does not break when today is not ticked yet', () => {
    expect(calcStreak([1, 2, 3, 4], 2)).toEqual({ streak: 4, freezesUsed: 0 })
  })

  it('spends one freeze to bridge a single missed day', () => {
    expect(calcStreak([0, 1, 3, 4], 2)).toEqual({ streak: 4, freezesUsed: 1 })
  })

  it('bridges two separate gaps with two freezes', () => {
    expect(calcStreak([0, 2, 4], 2)).toEqual({ streak: 3, freezesUsed: 2 })
  })

  it('stops once freezes run out', () => {
    expect(calcStreak([0, 2, 4, 6], 2)).toEqual({ streak: 3, freezesUsed: 2 })
  })

  it('breaks immediately when no freezes are available', () => {
    expect(calcStreak([0, 2, 3], 0)).toEqual({ streak: 1, freezesUsed: 0 })
  })

  // The regression: trailing gaps must not consume freezes.
  it('does not burn freezes on an abandoned habit', () => {
    expect(calcStreak([], 2)).toEqual({ streak: 0, freezesUsed: 0 })
  })

  it('does not burn freezes when only today is ticked', () => {
    expect(calcStreak([0], 2)).toEqual({ streak: 1, freezesUsed: 0 })
  })

  it('does not spend freezes reaching an unreachable older completion', () => {
    expect(calcStreak([0, 5], 2)).toEqual({ streak: 1, freezesUsed: 0 })
  })
})
