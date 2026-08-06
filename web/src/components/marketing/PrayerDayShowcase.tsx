'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Sunrise, Sun, CloudSun, Sunset, Moon, Stars } from 'lucide-react'
import { useT } from '@/lib/i18n/client'

/**
 * The landing page's centrepiece: a live demonstration of "The Prayer Day".
 *
 * The differentiator is that the interface moves with the Islamic day, which is
 * impossible to convey in a sentence — so this shows it. The phases cycle
 * automatically, and the whole panel (gradient, icon, copy, mock UI) changes
 * with them.
 *
 * Motion is opt-out: with `prefers-reduced-motion` the cycling stops and the
 * user drives it with the buttons instead. Cycling also pauses when the section
 * is off-screen, so it isn't burning frames in a background tab.
 */

const PHASES = [
  {
    id: 'dawn',
    labelKey: 'prayer.fajr',
    timeKey: 'phase.dawn',
    icon: Sunrise,
    gradient: 'linear-gradient(135deg, rgb(30 27 75), rgb(76 29 80))',
    noteKey: 'showcase.note.dawn',
    metricKey: 'showcase.metric.dawn',
  },
  {
    id: 'morning',
    labelKey: 'showcase.duha',
    timeKey: 'phase.morning',
    icon: Sun,
    gradient: 'linear-gradient(135deg, rgb(4 90 66), rgb(13 110 97))',
    noteKey: 'showcase.note.morning',
    metricKey: 'showcase.metric.morning',
  },
  {
    id: 'midday',
    labelKey: 'prayer.dhuhr',
    timeKey: 'phase.midday',
    icon: CloudSun,
    gradient: 'linear-gradient(135deg, rgb(13 110 97), rgb(12 95 110))',
    noteKey: 'showcase.note.midday',
    metricKey: 'showcase.metric.midday',
  },
  {
    id: 'afternoon',
    labelKey: 'prayer.asr',
    timeKey: 'phase.afternoon',
    icon: Sunset,
    gradient: 'linear-gradient(135deg, rgb(124 45 18), rgb(146 64 14))',
    noteKey: 'showcase.note.afternoon',
    metricKey: 'showcase.metric.afternoon',
  },
  {
    id: 'dusk',
    labelKey: 'prayer.maghrib',
    timeKey: 'phase.dusk',
    icon: Moon,
    gradient: 'linear-gradient(135deg, rgb(76 29 149), rgb(19 78 74))',
    noteKey: 'showcase.note.dusk',
    metricKey: 'showcase.metric.dusk',
  },
  {
    id: 'night',
    labelKey: 'prayer.isha',
    timeKey: 'phase.night',
    icon: Stars,
    gradient: 'linear-gradient(135deg, rgb(8 17 30), rgb(15 44 52))',
    noteKey: 'showcase.note.night',
    metricKey: 'showcase.metric.night',
  },
] as const

const CYCLE_MS = 3200

export function PrayerDayShowcase() {
  const [index, setIndex] = useState(0)
  const [inView, setInView] = useState(false)
  const [userPicked, setUserPicked] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { t } = useT()

  // Only animate while visible — no point cycling in a background tab.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.25,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!inView || reduceMotion || userPicked) return
    const id = setInterval(() => setIndex((i) => (i + 1) % PHASES.length), CYCLE_MS)
    return () => clearInterval(id)
  }, [inView, reduceMotion, userPicked])

  const phase = PHASES[index]
  const Icon = phase.icon

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-28 dark:bg-[#0b0f14]"
      aria-labelledby="prayer-day-heading"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10">
            {t('marketing.showcaseEyebrow')}
          </span>
          <h2
            id="prayer-day-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white"
          >
            {t('marketing.showcaseTitle')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
            {t('marketing.showcaseBody')}
          </p>
        </div>

        <div className="mt-12 grid items-center gap-8 lg:mt-16 lg:grid-cols-2 lg:gap-14">
          {/* Live panel */}
          <div className="order-2 lg:order-1">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5 sm:aspect-[16/11] dark:ring-white/10">
              <AnimatePresence mode="sync">
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.8, ease: 'easeInOut' }}
                  className="absolute inset-0"
                  style={{ backgroundImage: phase.gradient }}
                />
              </AnimatePresence>

              {/* Islamic geometry as texture, per the design system */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23ffffff' fill-opacity='0.5'/%3E%3C/svg%3E\")",
                  backgroundSize: '34px 34px',
                }}
              />

              {/* Mock app chrome */}
              <div className="relative flex h-full flex-col justify-between p-5 sm:p-7">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`${phase.id}-time`}
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                        transition={{ duration: 0.35 }}
                        className="text-xs font-medium uppercase tracking-widest text-white/70"
                      >
                        {t(phase.timeKey)}
                      </motion.p>
                    </AnimatePresence>
                    <AnimatePresence mode="wait">
                      <motion.h3
                        key={`${phase.id}-label`}
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
                        transition={{ duration: 0.35, delay: 0.04 }}
                        className="mt-1 text-2xl font-bold text-white sm:text-3xl"
                      >
                        {t(phase.labelKey)}
                      </motion.h3>
                    </AnimatePresence>
                  </div>

                  <motion.span
                    key={`${phase.id}-icon`}
                    initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.7, rotate: reduceMotion ? 0 : -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 180, damping: 18 }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm sm:h-12 sm:w-12"
                  >
                    <Icon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </motion.span>
                </div>

                {/* Mock rows so it reads as an interface, not a colour swatch */}
                <div className="space-y-2">
                  <div className="h-2 w-2/3 rounded-full bg-white/25" />
                  <div className="h-2 w-1/2 rounded-full bg-white/15" />
                </div>

                <div className="flex items-end justify-between gap-3">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={`${phase.id}-note`}
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                      transition={{ duration: 0.35 }}
                      className="max-w-[16rem] text-sm leading-snug text-white/85"
                    >
                      {t(phase.noteKey)}
                    </motion.p>
                  </AnimatePresence>
                  <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                    {t(phase.metricKey)}
                  </span>
                </div>
              </div>
            </div>

            {/* Phase selector — also the reduced-motion fallback */}
            <div className="mt-4 flex flex-wrap justify-center gap-2" role="tablist" aria-label={t('marketing.showcaseTabs')}>
              {PHASES.map((p, i) => {
                const active = i === index
                return (
                  <button
                    key={p.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setIndex(i)
                      setUserPicked(true)
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
                    }`}
                  >
                    {t(p.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Explanation */}
          <div className="order-1 space-y-5 lg:order-2">
            {[
              {
                title: t('ui.itKnowsWhereYouAreInTheDay'),
                body: t('ui.timesComeFromYourOwnLocationSoTheShiftHappen'),
              },
              {
                title: t('ui.calmAtNightSharpAtMidday'),
                body: t('ui.deepAndQuietAfterIshaSoYouReNotStaringIntoAB'),
              },
              {
                title: t('ui.yoursToOverride'),
                body: t('ui.preferOneLookAllDayPinAnyPhaseFromTheHeaderA'),
              },
            ].map((row, i) => (
              <motion.div
                key={row.title}
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{row.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {row.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PrayerDayShowcase
