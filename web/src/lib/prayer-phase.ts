/**
 * "The Prayer Day" — the app's visual atmosphere follows the rhythm of the
 * Islamic day rather than a fixed brand palette.
 *
 * This module is pure: it maps a clock time + today's prayer times onto a
 * phase. Rendering concerns (CSS variables) live in the provider.
 */

export type PrayerPhase = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night'

export interface PhaseTimes {
  fajr?: string
  sunrise?: string
  dhuhr?: string
  asr?: string
  maghrib?: string
  isha?: string
}

export interface PhaseMeta {
  phase: PrayerPhase
  /** Message key for the short UI label — resolve with t(). */
  labelKey: string
  /** Message key for the prayer this period belongs to, if any. */
  prayerKey: string | null
}

/**
 * `labelKey` and `prayerKey` are message keys, not English — the phase name is
 * shown in the header on every page, so it has to follow the language switch.
 */
export const PHASE_META: Record<PrayerPhase, { labelKey: string; prayerKey: string | null }> = {
  dawn: { labelKey: 'phase.dawn', prayerKey: 'prayer.fajr' },
  morning: { labelKey: 'phase.morning', prayerKey: null },
  midday: { labelKey: 'phase.midday', prayerKey: 'prayer.dhuhr' },
  afternoon: { labelKey: 'phase.afternoon', prayerKey: 'prayer.asr' },
  dusk: { labelKey: 'phase.dusk', prayerKey: 'prayer.maghrib' },
  night: { labelKey: 'phase.night', prayerKey: 'prayer.isha' },
}

/** Minutes since local midnight for "HH:MM", or null when unparseable. */
export function toMinutes(hhmm?: string | null): number | null {
  if (!hhmm) return null
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

/**
 * Fallback when we don't know the user's prayer times yet (they haven't
 * visited Prayers, or they're offline on first run). Rough but never wrong
 * enough to feel broken.
 */
export function phaseFromClock(minutes: number): PrayerPhase {
  if (minutes < 5 * 60) return 'night'
  if (minutes < 7 * 60) return 'dawn'
  if (minutes < 12 * 60) return 'morning'
  if (minutes < 15 * 60 + 30) return 'midday'
  if (minutes < 18 * 60) return 'afternoon'
  if (minutes < 20 * 60) return 'dusk'
  return 'night'
}

/**
 * Resolves the current phase from real prayer times.
 *
 * Boundaries follow the day as it's actually lived:
 *   Fajr → sunrise      dawn
 *   sunrise → Dhuhr     morning
 *   Dhuhr → Asr         midday
 *   Asr → Maghrib       afternoon
 *   Maghrib → Isha      dusk
 *   Isha → Fajr         night   (wraps past midnight)
 */
export function resolvePhase(times: PhaseTimes | null | undefined, now: Date = new Date()): PhaseMeta {
  const minutes = now.getHours() * 60 + now.getMinutes()

  const fajr = toMinutes(times?.fajr)
  const sunrise = toMinutes(times?.sunrise)
  const dhuhr = toMinutes(times?.dhuhr)
  const asr = toMinutes(times?.asr)
  const maghrib = toMinutes(times?.maghrib)
  const isha = toMinutes(times?.isha)

  // Need at least the anchors; otherwise fall back to the clock.
  if (fajr == null || dhuhr == null || asr == null || maghrib == null || isha == null) {
    const phase = phaseFromClock(minutes)
    return { phase, ...PHASE_META[phase] }
  }

  // Sunrise isn't always available; approximate it as ~80 min after Fajr so the
  // dawn window doesn't swallow the whole morning.
  const sunriseAt = sunrise ?? Math.min(fajr + 80, dhuhr)

  let phase: PrayerPhase
  if (minutes >= fajr && minutes < sunriseAt) phase = 'dawn'
  else if (minutes >= sunriseAt && minutes < dhuhr) phase = 'morning'
  else if (minutes >= dhuhr && minutes < asr) phase = 'midday'
  else if (minutes >= asr && minutes < maghrib) phase = 'afternoon'
  else if (minutes >= maghrib && minutes < isha) phase = 'dusk'
  else phase = 'night' // after Isha, or before Fajr

  return { phase, ...PHASE_META[phase] }
}

/** True when the phase should render against dark surfaces. */
export function isDarkPhase(phase: PrayerPhase): boolean {
  return phase === 'night' || phase === 'dawn'
}
