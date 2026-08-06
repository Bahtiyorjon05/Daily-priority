'use client'

import { motion } from 'framer-motion'
import { useT } from '@/lib/i18n/client'
import {
  Moon, BookHeart, Compass, Repeat, Timer, CheckSquare,
  BookOpen, Target, BarChart3, Bell, WifiOff, Download, Sunrise, Heart,
  ArrowUpRight,
} from 'lucide-react'

/**
 * Feature overview.
 *
 * Rewritten against DESIGN.md's restraint rules. The previous version stacked
 * four floating orbs, a noise texture and several radial gradients, which
 * flattened the hierarchy — when everything is emphasised, nothing is. It also
 * listed only 6 of the 9 things the app does: Adhkar, Habits and Focus were
 * missing entirely, as were reminders, offline and install.
 *
 * Grouped by what someone is trying to do, not by feature name.
 */

const GROUPS = [
  {
    id: 'worship',
    eyebrow: 'Worship',
    title: 'Built around the five prayers',
    blurb: 'Your day already has a shape. The app follows it instead of fighting it.',
    accent: 'emerald',
    items: [
      {
        icon: Moon,
        title: 'Prayer times & tracking',
        body: 'Accurate times for your location, one tap to log each prayer and whether it was on time. Streaks show your consistency at a glance.',
      },
      {
        icon: Bell,
        title: 'Adhan & reminders',
        body: 'A quiet nudge before each prayer, and the adhan when the time arrives. Set your own lead time, or quiet hours to hear nothing at all.',
      },
      {
        icon: BookHeart,
        title: 'Adhkar',
        body: 'Morning and evening remembrance with a counter that keeps your place, so you can finish where you left off.',
      },
      {
        icon: Compass,
        title: 'Qibla & Hijri calendar',
        body: 'Qibla direction from wherever you are, plus Hijri dates and Islamic occasions alongside your own events.',
      },
    ],
  },
  {
    id: 'discipline',
    eyebrow: 'Discipline',
    title: 'Small things, done consistently',
    blurb: 'Consistency beats ambition, so these are deliberately simple.',
    accent: 'teal',
    items: [
      {
        icon: Repeat,
        title: 'Habits with streak freezes',
        body: 'Daily habits with streaks — and two grace days a month, so one missed day doesn’t erase weeks of effort.',
      },
      {
        icon: Timer,
        title: 'Focus sessions',
        body: 'A Pomodoro timer with optional ambient sound. It runs on the wall clock, so it stays accurate even if you switch away.',
      },
      {
        icon: CheckSquare,
        title: 'Tasks & priorities',
        body: 'Plan the day with priorities, due dates and subtasks. Overdue work surfaces in the morning instead of getting buried.',
      },
      {
        icon: Heart,
        title: 'Gentle, not nagging',
        body: 'Reminders you control, streaks that forgive, and no guilt-tripping when life gets in the way.',
      },
    ],
  },
  {
    id: 'reflection',
    eyebrow: 'Reflection',
    title: 'See how the week actually went',
    blurb: 'Honest numbers rather than vanity charts.',
    accent: 'violet',
    items: [
      {
        icon: BookOpen,
        title: 'Journal',
        body: 'Gratitude, lessons and du‘ā in one place, dated in both calendars, with a mood you can look back on.',
      },
      {
        icon: Target,
        title: 'Dunya & Akhirah goals',
        body: 'Track worldly and spiritual goals side by side, with milestones and progress, so the balance stays visible.',
      },
      {
        icon: BarChart3,
        title: 'Analytics',
        body: 'Trends across prayers, habits, focus and tasks — enough to spot a pattern, not so much that it becomes homework.',
      },
      {
        icon: Sunrise,
        title: 'Weekly review',
        body: 'A short Sunday email summarising your week, with your streaks and on-time prayer rate.',
      },
    ],
  },
] as const

const PLATFORM = [
  {
    icon: Sunrise,
    title: 'Follows the prayer day',
    body: 'The interface shifts with the day — still and blue at Fajr, warm at Asr, quiet after Isha.',
  },
  {
    icon: WifiOff,
    title: 'Works offline',
    body: 'Tick a habit with no signal; it syncs the moment you reconnect.',
  },
  {
    icon: Download,
    title: 'Installs like an app',
    body: 'Add it to your home screen — full screen, offline capable, no app store needed.',
  },
  {
    icon: Heart,
    title: 'Free, no ads',
    body: 'No adverts, no selling your data, no paywall on the things that matter.',
  },
]

const ACCENT: Record<string, string> = {
  emerald:
    'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 ring-emerald-200/70 dark:ring-emerald-800/50',
  teal:
    'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 ring-teal-200/70 dark:ring-teal-800/50',
  violet:
    'text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 ring-violet-200/70 dark:ring-violet-800/50',
}

export function Features() {
  const { t } = useT()

  return (
    <section
      id="features"
      className="scroll-mt-16 bg-slate-50 py-16 sm:py-20 lg:py-28 dark:bg-[#080c10]"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
            {t('marketing.featuresTitle')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-400">
            {t('marketing.featuresBody')}
          </p>
        </motion.div>

        {/* Groups */}
        <div className="mt-14 space-y-16 sm:mt-20 sm:space-y-20">
          {GROUPS.map((group, gi) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: gi * 0.05 }}
            >
              <div className="mb-8 max-w-2xl">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${ACCENT[group.accent]}`}
                >
                  {group.eyebrow}
                </span>
                <h3 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                  {group.title}
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-400">
                  {group.blurb}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 transition-colors hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
                    >
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${ACCENT[group.accent]}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <h4 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {item.body}
                      </p>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Platform capabilities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-16 rounded-3xl border border-slate-200/80 bg-white p-6 sm:mt-20 sm:p-8 dark:border-white/10 dark:bg-white/[0.03]"
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORM.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.title}>
                  <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                    {p.title}
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {p.body}
                  </p>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-14 text-center sm:mt-16"
        >
          <a
            href="/signup"
            /* white text in BOTH schemes — the previous button used
               text-slate-900 in light mode over a saturated emerald gradient,
               which was close to unreadable */
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-colors hover:bg-emerald-700 sm:text-base"
          >
            {t('marketing.getStarted')}
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
            {t('marketing.getStartedNote')}
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default Features
