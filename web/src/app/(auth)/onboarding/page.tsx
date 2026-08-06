'use client'

import { useT } from '@/lib/i18n/client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  MapPin, Check, Loader2, ArrowRight, Bell, BellOff, Sparkles, Compass,
} from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

/**
 * First-run onboarding.
 *
 * Deliberately three steps. The measured problem was activation — 19 of 24
 * accounts had created nothing — and every extra step loses people. Each step
 * is skippable, and skipping still completes onboarding so nobody is nagged
 * twice.
 *
 * Order is by value: location first (it powers prayer times, the reason people
 * are here), then one habit so the dashboard isn't empty, then reminders.
 */

const SUGGESTED_HABITS = [
  { title: 'Read Qur’an daily', emoji: '📖' },
  { title: 'Morning adhkar', emoji: '🌅' },
  { title: 'Evening adhkar', emoji: '🌙' },
  { title: 'Pray Sunnah prayers', emoji: '🕌' },
  { title: 'Give sadaqah', emoji: '🤲' },
  { title: 'Sleep early', emoji: '😴' },
]

type Step = 'location' | 'habits' | 'reminders'
const STEPS: Step[] = ['location', 'habits', 'reminders']

export default function OnboardingPage() {
  const { t: tr } = useT()
  const router = useRouter()
  const [step, setStep] = useState<Step>('location')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(true)

  const [locationLabel, setLocationLabel] = useState('')
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  const [selectedHabits, setSelectedHabits] = useState<string[]>([SUGGESTED_HABITS[0].title])
  const { supported: pushSupported, subscribe } = usePushNotifications()

  const index = STEPS.indexOf(step)

  // Someone who has already onboarded should never see this page.
  useEffect(() => {
    fetch('/api/onboarding', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.onboarded) router.replace('/dashboard')
        else setChecking(false)
      })
      .catch(() => setChecking(false))
  }, [router])

  const detectLocation = useCallback(() => {
    setLocating(true)
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('This device can’t share a location. You can type a city instead.')
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: c }) => {
        setCoords({ latitude: c.latitude, longitude: c.longitude })
        try {
          const res = await fetch(`/api/geocode?latitude=${c.latitude}&longitude=${c.longitude}`)
          if (res.ok) {
            const d = await res.json()
            const label = d.city || d.location || d.name
            if (label) setLocationLabel(label)
          }
        } catch {
          /* keep coords; the label is a nicety */
        } finally {
          setLocating(false)
        }
      },
      () => {
        setLocationError('Couldn’t read your location. You can type a city instead.')
        setLocating(false)
      },
      { timeout: 10000, maximumAge: 600000 }
    )
  }, [])

  const finish = useCallback(
    async (opts: { skipped?: boolean } = {}) => {
      setSaving(true)
      try {
        await fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: locationLabel
              ? {
                  label: locationLabel,
                  ...(coords ?? {}),
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                }
              : undefined,
            habits: selectedHabits,
            prayerReminders: true,
            prayerLeadMinutes: 10,
            skipped: opts.skipped,
          }),
        })
      } catch {
        /* the API marks onboarding complete even on failure */
      } finally {
        router.replace('/dashboard?welcome=1')
      }
    },
    [locationLabel, coords, selectedHabits, router]
  )

  const toggleHabit = (title: string) =>
    setSelectedHabits((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title].slice(0, 3)
    )

  if (checking) {
    return (
      <div className="phase-canvas flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="phase-canvas flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="mb-6 flex items-center gap-2" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= index ? 'phase-bg-accent' : 'bg-black/10 dark:bg-white/15'
              }`}
            />
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-xl dark:border-white/10 dark:bg-gray-900">
          <div className="phase-hero px-6 py-5">
            <p className="text-xs font-medium uppercase tracking-wide text-white/80">
{tr('ui.step')} {index + 1} of {STEPS.length}
            </p>
            <h1 className="mt-0.5 text-xl font-bold text-white">
              {step === 'location' && 'Where are you praying from?'}
              {step === 'habits' && 'Pick one thing to build'}
              {step === 'reminders' && 'Want a nudge before each prayer?'}
            </h1>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 'location' && (
                <motion.div key="location" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <p className="mb-4 text-sm text-muted-foreground">
{tr('ui.yourCitySetsAccuratePrayerTimesNothingIsShar')}
</p>

                  <button
                    onClick={detectLocation}
                    disabled={locating}
                    className="phase-chip mb-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                  >
                    {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
                    {locating ? 'Finding you…' : 'Use my current location'}
                  </button>

                  <div className="relative mb-3">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={locationLabel}
                      onChange={(e) => setLocationLabel(e.target.value)}
                      placeholder={tr('ui.orTypeYourCity')}
                      aria-label={tr('ui.yourCity')}
                      className="w-full rounded-xl border bg-background py-3 pl-9 pr-3 text-sm outline-none ring-primary/40 focus:ring-2"
                    />
                  </div>

                  {locationError && <p className="mb-3 text-xs text-amber-600 dark:text-amber-400">{locationError}</p>}

                  <StepButtons
                    onNext={() => setStep('habits')}
                    nextLabel="Continue"
                    onSkip={() => setStep('habits')}
                  />
                </motion.div>
              )}

              {step === 'habits' && (
                <motion.div key="habits" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {tr('ui.startWithOneYouCanAddMoreLaterConsistencyBea')}
                  </p>

                  <div className="mb-4 grid grid-cols-2 gap-2">
                    {SUGGESTED_HABITS.map((h) => {
                      const active = selectedHabits.includes(h.title)
                      return (
                        <button
                          key={h.title}
                          onClick={() => toggleHabit(h.title)}
                          aria-pressed={active}
                          className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-all ${
                            active
                              ? 'phase-border bg-black/[0.03] font-medium dark:bg-white/[0.06]'
                              : 'border-black/10 hover:bg-black/[0.02] dark:border-white/10 dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <span aria-hidden className="text-base">{h.emoji}</span>
                          <span className="min-w-0 flex-1 truncate">{h.title}</span>
                          {active && <Check className="phase-accent h-4 w-4 shrink-0" />}
                        </button>
                      )
                    })}
                  </div>

                  <StepButtons
                    onNext={() => setStep('reminders')}
                    nextLabel={selectedHabits.length > 0 ? 'Continue' : 'Skip for now'}
                    onSkip={() => {
                      setSelectedHabits([])
                      setStep('reminders')
                    }}
                  />
                </motion.div>
              )}

              {step === 'reminders' && (
                <motion.div key="reminders" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <p className="mb-4 text-sm text-muted-foreground">
{tr('ui.aQuietReminderShortlyBeforeEachPrayerYouCanC')}
</p>

                  <div className="mb-4 space-y-2">
                    <button
                      onClick={async () => {
                        if (pushSupported) await subscribe()
                        finish()
                      }}
                      disabled={saving}
                      className="phase-bg-accent flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
{tr('ui.yesRemindMe')}
</button>
                    <button
                      onClick={() => finish()}
                      disabled={saving}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
                    >
                      <BellOff className="h-4 w-4" />
                      {tr('install.dismiss')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          onClick={() => finish({ skipped: true })}
          disabled={saving}
          className="mx-auto mt-5 block text-xs text-muted-foreground underline-offset-2 hover:underline disabled:opacity-60"
        >
          {tr('ui.skipSetup')}
        </button>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" />
          {tr('ui.takesUnderAMinute')}
        </p>
      </div>
    </div>
  )
}

function StepButtons({
  onNext, nextLabel, onSkip,
}: { onNext: () => void; nextLabel: string; onSkip: () => void }) {
  const { t: tr } = useT()
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onNext}
        className="phase-bg-accent flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
      >
        {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
      <button onClick={onSkip} className="rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted">
        {tr('common.skip')}
      </button>
    </div>
  )
}
