'use client'

/**
 * Adhan playback.
 *
 * Plays the call to prayer in-app when a prayer time arrives. Browsers can't
 * attach custom audio to a *push* notification, so audio only plays while a tab
 * (or the installed app) is open — the push notification still fires either way.
 *
 * Audio file: place a recording at `public/audio/adhan.mp3` (and optionally
 * `adhan-fajr.mp3`, which traditionally differs). If the file is missing we
 * fall back to a short synthesized chime so the feature still signals the time
 * rather than failing silently.
 */

export const ADHAN_SRC = '/audio/adhan.mp3'
export const ADHAN_FAJR_SRC = '/audio/adhan-fajr.mp3'

let element: HTMLAudioElement | null = null
let unlocked = false

/** Browsers block autoplay until the user interacts; call this on first gesture. */
export function unlockAdhanAudio(): void {
  if (unlocked || typeof window === 'undefined') return
  unlocked = true
  try {
    const a = new Audio(ADHAN_SRC)
    a.volume = 0
    a.play()
      .then(() => {
        a.pause()
        a.currentTime = 0
      })
      .catch(() => {
        /* still blocked; playback will just require a gesture */
      })
  } catch {
    /* ignore */
  }
}

async function fileExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

/** Short two-tone chime used when no adhan recording is installed. */
function playFallbackChime(volume: number): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const now = ctx.currentTime
    ;[523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = now + i * 0.45
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume), t + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + 1)
    })
  } catch {
    /* audio unavailable */
  }
}

export interface PlayAdhanOptions {
  /** Fajr uses a different recording when one is provided. */
  isFajr?: boolean
  /** 0..1 */
  volume?: number
}

/**
 * Plays the adhan. Resolves to how it was played so callers can surface a hint
 * when only the fallback tone is available.
 */
export async function playAdhan(options: PlayAdhanOptions = {}): Promise<'adhan' | 'chime' | 'blocked'> {
  const volume = Math.min(1, Math.max(0, options.volume ?? 0.8))
  const preferred = options.isFajr ? ADHAN_FAJR_SRC : ADHAN_SRC

  const src = (await fileExists(preferred))
    ? preferred
    : (await fileExists(ADHAN_SRC))
      ? ADHAN_SRC
      : null

  if (!src) {
    playFallbackChime(volume)
    return 'chime'
  }

  try {
    stopAdhan()
    element = new Audio(src)
    element.volume = volume
    await element.play()
    return 'adhan'
  } catch {
    // Autoplay blocked (no user gesture yet in this tab).
    playFallbackChime(volume)
    return 'blocked'
  }
}

export function stopAdhan(): void {
  if (element) {
    element.pause()
    element.currentTime = 0
    element = null
  }
}

export function isAdhanPlaying(): boolean {
  return !!element && !element.paused
}
