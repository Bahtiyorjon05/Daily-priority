'use client'

import { useT } from '@/lib/i18n/client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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

// Selection is tracked by key, not by label: the label changes when the locale
// changes, which would have silently emptied the user's picks mid-flow. The
// habit is *stored* under the translated label, so it reads in the user's own
// language everywhere it appears afterwards.
const SUGGESTED_HABITS = [
  { key: 'ui.readQurAnDaily', emoji: '📖' },
  { key: 'ui.morningAdhkar2', emoji: '🌅' },
  { key: 'ui.eveningAdhkar2', emoji: '🌙' },
  { key: 'ui.praySunnahPrayers', emoji: '🕌' },
  { key: 'ui.giveSadaqah', emoji: '🤲' },
  { key: 'ui.sleepEarly', emoji: '😴' },
] as const

type Step = 'location' | 'habits' | 'reminders'
const STEPS: Step[] = ['location', 'habits', 'reminders']

export default function OnboardingPage() {
  const { t: tr } = useT()
  const router = useRouter()
  const { update } = useSession()
  const [step, setStep] = useState<Step>('location')
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(true)

  const [locationLabel, setLocationLabel] = useState('')
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState('')

  const [selectedKeys, setSelectedKeys] = useState<string[]>([SUGGESTED_HABITS[0].key])
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
      setLocationError(tr('ui.thisDeviceCanTShareALocationYouCanTypeACityI'))
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
          // Detection succeeding *is* the answer to "where are you praying
          // from", so move on rather than making the user confirm what they
          // just watched happen. Short delay so the resolved city is visible
          // for a beat — otherwise the step appears to skip itself.
          setTimeout(() => setStep('habits'), 700)
        }
      },
      () => {
        setLocationError(tr('ui.couldnTReadYourLocationYouCanTypeACityInstea'))
        setLocating(false)
      },
      { timeout: 10000, maximumAge: 600000 }
    )
  }, [tr])

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
            habits: selectedKeys.map((k) => tr(k)),
            prayerReminders: true,
            prayerLeadMinutes: 10,
            skipped: opts.skipped,
          }),
        })
      } catch {
        /* the API marks onboarding complete even on failure */
      } finally {
        // The JWT still carries needsOnboarding: true at this point, and the
        // dashboard shell redirects on that flag — which is why finishing sent
        // people straight back here and only a manual refresh escaped. update()
        // forces NextAuth to re-issue the token so the flag clears *before* we
        // navigate.
        try {
          await update()
        } catch {
          /* navigate anyway; a hard load will pick up the new token */
        }
        router.replace('/dashboard?welcome=1')
      }
    },
    [locationLabel, coords, selectedKeys, router, update, tr]
  )

  const toggleHabit = (key: string) =>
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key].slice(0, 3)
    )

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b1020]">
        <Loader2 className="h-6 w-6 animate-spin text-white/70" />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0b1020] px-4 py-10">
      {/*
        Onboarding deliberately does not use the phase palette.

        It is seen once, before the app has any rhythm for this person, and the
        phases would have meant a 5am sign-up opening on a near-black screen —
        the wrong first impression at the one moment we get to make one. So: a
        fixed, bright welcome, the same for everybody.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(65% 50% at 12% 0%, rgb(56 189 248 / 0.30), transparent 68%),' +
            'radial-gradient(55% 45% at 92% 18%, rgb(168 85 247 / 0.26), transparent 66%),' +
            'radial-gradient(70% 55% at 50% 108%, rgb(16 185 129 / 0.26), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='none' stroke='%23fff' stroke-width='1'/%3E%3C/svg%3E\")",
          backgroundSize: '38px 38px',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt=""
            aria-hidden
            className="h-9 w-9 rounded-xl ring-1 ring-white/20"
          />
          <span className="text-sm font-semibold tracking-tight text-white/90">
            {tr('ui.dailyPriority')}
          </span>
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center gap-2" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={STEPS.length}>
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= index
                  ? 'bg-gradient-to-r from-sky-400 to-emerald-400 shadow-[0_0_12px_rgb(56_189_248/0.55)]'
                  : 'bg-white/15'
              }`}
            />
          ))}
        </div>

        <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.06] shadow-[0_24px_60px_-24px_rgb(0_0_0/0.7)] backdrop-blur-xl">
          <div
            className="px-6 py-5"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgb(14 165 233) 0%, rgb(99 102 241) 52%, rgb(16 185 129) 100%)',
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
{tr('ui.step')} {index + 1} of {STEPS.length}
            </p>
            <h1 className="mt-1 text-[22px] font-bold leading-tight text-white drop-shadow-sm">
              {step === 'location' && tr('ui.whereAreYouPrayingFrom')}
              {step === 'habits' && tr('ui.pickOneThingToBuild')}
              {step === 'reminders' && tr('ui.wantANudgeBeforeEachPrayer')}
            </h1>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 'location' && (
                <motion.div key="location" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <p className="mb-4 text-sm leading-relaxed text-white/70">
{tr('ui.yourCitySetsAccuratePrayerTimesNothingIsShar')}
</p>

                  <button
                    onClick={detectLocation}
                    disabled={locating}
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/12 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20 disabled:opacity-60"
                  >
                    {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
                    {locating ? tr('ui.findingYou') : tr('ui.useMyCurrentLocation')}
                  </button>

                  <div className="relative mb-3">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                    <input
                      value={locationLabel}
                      onChange={(e) => setLocationLabel(e.target.value)}
                      placeholder={tr('ui.orTypeYourCity')}
                      aria-label={tr('ui.yourCity')}
                      className="w-full rounded-xl border border-white/15 bg-white/[0.07] py-3 pl-9 pr-3 text-sm text-white outline-none ring-sky-400/50 placeholder:text-white/40 focus:border-white/25 focus:ring-2"
                    />
                  </div>

                  {locationError && <p className="mb-3 text-xs text-amber-300">{locationError}</p>}

                  <StepButtons
                    onNext={() => setStep('habits')}
                    nextLabel={tr('common.continue')}
                    onSkip={() => setStep('habits')}
                  />
                </motion.div>
              )}

              {step === 'habits' && (
                <motion.div key="habits" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <p className="mb-4 text-sm leading-relaxed text-white/70">
                    {tr('ui.startWithOneYouCanAddMoreLaterConsistencyBea')}
                  </p>

                  <div className="mb-4 grid grid-cols-2 gap-2">
                    {SUGGESTED_HABITS.map((h) => {
                      const active = selectedKeys.includes(h.key)
                      return (
                        <button
                          key={h.key}
                          onClick={() => toggleHabit(h.key)}
                          aria-pressed={active}
                          className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-all ${
                            active
                              ? 'border-sky-400/60 bg-sky-400/15 font-medium text-white shadow-[0_0_0_1px_rgb(56_189_248/0.35)]'
                              : 'border-white/12 text-white/75 hover:border-white/25 hover:bg-white/[0.06]'
                          }`}
                        >
                          <span aria-hidden className="text-base">{h.emoji}</span>
                          <span className="min-w-0 flex-1 truncate">{tr(h.key)}</span>
                          {active && <Check className="h-4 w-4 shrink-0 text-sky-300" />}
                        </button>
                      )
                    })}
                  </div>

                  <StepButtons
                    onNext={() => setStep('reminders')}
                    nextLabel={selectedKeys.length > 0 ? tr('common.continue') : tr('ui.skipForNow')}
                    onSkip={() => {
                      setSelectedKeys([])
                      setStep('reminders')
                    }}
                  />
                </motion.div>
              )}

              {step === 'reminders' && (
                <motion.div key="reminders" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <p className="mb-4 text-sm leading-relaxed text-white/70">
{tr('ui.aQuietReminderShortlyBeforeEachPrayerYouCanC')}
</p>

                  <div className="mb-4 space-y-2">
                    <button
                      onClick={async () => {
                        if (pushSupported) await subscribe()
                        finish()
                      }}
                      disabled={saving}
                      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 text-white shadow-[0_10px_24px_-10px_rgb(56_189_248/0.8)] transition-transform hover:brightness-110 active:scale-[0.99]"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
{tr('ui.yesRemindMe')}
</button>
                    <button
                      onClick={() => finish()}
                      disabled={saving}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/[0.07] hover:text-white disabled:opacity-60"
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
          className="mx-auto mt-5 block text-xs text-white/55 underline-offset-2 transition-colors hover:text-white/80 hover:underline disabled:opacity-60"
        >
          {tr('ui.skipSetup')}
        </button>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-white/50">
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
        className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 text-white shadow-[0_10px_24px_-10px_rgb(56_189_248/0.8)] transition-transform hover:brightness-110 active:scale-[0.99]"
      >
        {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
      <button onClick={onSkip} className="rounded-xl px-3 py-3 text-sm text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white">
        {tr('common.skip')}
      </button>
    </div>
  )
}
