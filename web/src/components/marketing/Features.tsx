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
    eyebrowKey: 'feat.worship',
    titleKey: 'feat.builtAroundTheFivePrayers',
    blurbKey: 'feat.yourDayAlreadyHasAShapeTheAppFollowsItInstea',
    accent: 'emerald',
    items: [
      {
        icon: Moon,
        titleKey: 'ui.prayerTimesTracking',
        bodyKey: 'feat.accurateTimesForYourLocationOneTapToLogEachP',
      },
      {
        icon: Bell,
        titleKey: 'feat.adhanReminders',
        bodyKey: 'feat.aQuietNudgeBeforeEachPrayerAndTheAdhanWhenTh',
      },
      {
        icon: BookHeart,
        titleKey: 'nav.adhkar',
        bodyKey: 'feat.morningAndEveningRemembranceWithACounterThat',
      },
      {
        icon: Compass,
        titleKey: 'feat.qiblaHijriCalendar',
        bodyKey: 'feat.qiblaDirectionFromWhereverYouArePlusHijriDat',
      },
    ],
  },
  {
    id: 'discipline',
    eyebrowKey: 'feat.discipline',
    titleKey: 'feat.smallThingsDoneConsistently',
    blurbKey: 'feat.consistencyBeatsAmbitionSoTheseAreDeliberate',
    accent: 'teal',
    items: [
      {
        icon: Repeat,
        titleKey: 'feat.habitsWithStreakFreezes',
        bodyKey: 'feat.dailyHabitsWithStreaksAndTwoGraceDaysAMonthS',
      },
      {
        icon: Timer,
        titleKey: 'feat.focusSessions',
        bodyKey: 'feat.aPomodoroTimerWithOptionalAmbientSoundItRuns',
      },
      {
        icon: CheckSquare,
        titleKey: 'feat.tasksPriorities',
        bodyKey: 'feat.planTheDayWithPrioritiesDueDatesAndSubtasksO',
      },
      {
        icon: Heart,
        titleKey: 'feat.gentleNotNagging',
        bodyKey: 'feat.remindersYouControlStreaksThatForgiveAndNoGu',
      },
    ],
  },
  {
    id: 'reflection',
    eyebrowKey: 'feat.reflection',
    titleKey: 'feat.seeHowTheWeekActuallyWent',
    blurbKey: 'feat.honestNumbersRatherThanVanityCharts',
    accent: 'violet',
    items: [
      {
        icon: BookOpen,
        titleKey: 'nav.journal',
        bodyKey: 'feat.gratitudeLessonsAndDuInOnePlaceDatedInBothCa',
      },
      {
        icon: Target,
        titleKey: 'feat.dunyaAkhirahGoals',
        bodyKey: 'feat.trackWorldlyAndSpiritualGoalsSideBySideWithM',
      },
      {
        icon: BarChart3,
        titleKey: 'nav.analytics',
        bodyKey: 'feat.trendsAcrossPrayersHabitsFocusAndTasksEnough',
      },
      {
        icon: Sunrise,
        titleKey: 'feat.weeklyReview',
        bodyKey: 'feat.aShortSundayEmailSummarisingYourWeekWithYour',
      },
    ],
  },
] as const

const PLATFORM = [
  {
    icon: Sunrise,
    titleKey: 'feat.followsThePrayerDay',
    bodyKey: 'feat.theInterfaceShiftsWithTheDayStillAndBlueAtFa',
  },
  {
    icon: WifiOff,
    titleKey: 'feat.worksOffline',
    bodyKey: 'feat.tickAHabitWithNoSignalItSyncsTheMomentYouRec',
  },
  {
    icon: Download,
    titleKey: 'feat.installsLikeAnApp',
    bodyKey: 'feat.addItToYourHomeScreenFullScreenOfflineCapabl',
  },
  {
    icon: Heart,
    titleKey: 'feat.freeNoAds',
    bodyKey: 'feat.noAdvertsNoSellingYourDataNoPaywallOnTheThin',
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
                  {t(group.eyebrowKey)}
                </span>
                <h3 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                  {t(group.titleKey)}
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 sm:text-base dark:text-slate-400">
                  {t(group.blurbKey)}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.titleKey}
                      className="rounded-2xl border border-slate-200/80 bg-white p-5 transition-colors hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
                    >
                      <span
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${ACCENT[group.accent]}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <h4 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                        {t(item.titleKey)}
                      </h4>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                        {t(item.bodyKey)}
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
                <div key={p.titleKey}>
                  <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                  <h4 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                    {t(p.titleKey)}
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {t(p.bodyKey)}
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
