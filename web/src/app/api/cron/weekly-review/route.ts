import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { recordCronRun } from '@/lib/cron-heartbeat'
import { renderEmail, statRow, meter, escapeHtml } from '@/lib/email-template'
import { forRecipient } from '@/lib/email'
import { emailBaseUrl } from '@/lib/email-url'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Weekly review email — a Sunday digest of the last 7 days per user.
 * Invoked by Vercel Cron with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  const provided = auth?.replace(/^Bearer\s+/i, '') || new URL(request.url).searchParams.get('secret')
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1'
  const startedAt = Date.now()
  const since = new Date(Date.now() - 7 * 864e5)
  const results = { considered: 0, sent: 0, skipped: 0, errors: 0 }

  try {
    const users = await prisma.user.findMany({
      where: { emailVerified: { not: null } },
      select: {
        id: true,
        email: true,
        name: true,
        notificationPreference: { select: { weeklyReviewEmail: true } },
      },
    })

    const transporter = buildTransport()

    for (const user of users) {
      results.considered++
      if (user.notificationPreference?.weeklyReviewEmail === false) {
        results.skipped++
        continue
      }

      try {
        const [
          tasksCompleted, tasksCreated, focus, prayers, prayersOnTime, journal, habits,
          habitCheckIns, habitCount, goalsTotal, goalsCompleted,
        ] = await Promise.all([
            prisma.task.count({ where: { userId: user.id, status: 'COMPLETED', updatedAt: { gte: since } } }),
            prisma.task.count({ where: { userId: user.id, createdAt: { gte: since } } }),
            prisma.focusSession.aggregate({ where: { userId: user.id, date: { gte: since } }, _sum: { duration: true }, _count: { _all: true } }),
            prisma.prayerTracking.count({ where: { userId: user.id, date: { gte: since } } }),
            prisma.prayerTracking.count({ where: { userId: user.id, date: { gte: since }, onTime: true } }),
            prisma.journalEntry.count({ where: { userId: user.id, date: { gte: since } } }),
            prisma.habit.findMany({ where: { userId: user.id }, select: { title: true, streak: true, longestStreak: true }, orderBy: { streak: 'desc' }, take: 3 }),
            // Habit check-ins and goals were missing entirely: the digest talked
            // about prayers and tasks while two of the app's four trackers went
            // unmentioned.
            prisma.habitCompletion.count({ where: { habit: { userId: user.id }, date: { gte: since } } }),
            prisma.habit.count({ where: { userId: user.id } }),
            prisma.goal.count({ where: { userId: user.id } }),
            prisma.goal.count({ where: { userId: user.id, status: 'COMPLETED' } }),
          ])

        // Nothing happened this week — don't send an empty, discouraging email.
        const anyActivity =
          tasksCompleted + tasksCreated + (focus._count._all || 0) + prayers + journal + habitCheckIns > 0
        if (!anyActivity) {
          results.skipped++
          continue
        }

        if (dryRun) {
          results.sent++
          continue
        }

        // Every other email in the app already goes out in the recipient's
        // language; this one was hard-coded English throughout, including the
        // greeting and every stat label.
        const { locale, t } = await forRecipient(user.email)

        await transporter.sendMail({
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: user.email,
          subject: t('email.weekly.subject'),
          html: renderWeeklyEmail({
            locale,
            t,
            name: user.name || user.email.split('@')[0],
            tasksCompleted,
            tasksCreated,
            focusMinutes: focus._sum.duration || 0,
            focusSessions: focus._count._all || 0,
            prayers,
            prayersOnTime,
            journal,
            habits,
            habitCheckIns,
            habitCount,
            goalsTotal,
            goalsCompleted,
            appUrl: emailBaseUrl(),
          }),
        })
        results.sent++
      } catch (err) {
        results.errors++
        console.error('[cron/weekly-review] user failed', user.id, (err as Error).message)
      }
    }

    await recordCronRun('weekly-review', true, { dryRun, ...results }, Date.now() - startedAt)
    return NextResponse.json({ ok: true, dryRun, ...results })
  } catch (error) {
    console.error('[cron/weekly-review] failed', error)
    await recordCronRun('weekly-review', false, { error: (error as Error).message }, Date.now() - startedAt)
    return NextResponse.json({ error: 'Weekly review failed' }, { status: 500 })
  }
}

function buildTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

/**
 * The weekly digest.
 *
 * Rewritten for two reasons.
 *
 * It was hard-coded English end to end — the greeting, every stat label, the
 * streak section, the CTA and the footnote — while every other email in the app
 * already went out in the recipient's language. And it led with prayers, which
 * made it read as a prayer report; tasks and habits are what most people use the
 * app for day to day, so those come first and prayers sit among the other stats.
 *
 * Habit check-ins and goals were absent altogether: two of the four things the
 * app tracks went unmentioned in the summary of what you did.
 */
function renderWeeklyEmail(d: {
  locale: string
  t: (key: string, params?: Record<string, string | number>) => string
  name: string
  tasksCompleted: number
  tasksCreated: number
  focusMinutes: number
  focusSessions: number
  prayers: number
  prayersOnTime: number
  journal: number
  habits: { title: string; streak: number; longestStreak: number }[]
  habitCheckIns: number
  habitCount: number
  goalsTotal: number
  goalsCompleted: number
  appUrl: string
}): string {
  const { t } = d

  const onTimeRate = d.prayers > 0 ? Math.round((d.prayersOnTime / d.prayers) * 100) : 0
  const taskRate =
    d.tasksCreated > 0 ? Math.min(100, Math.round((d.tasksCompleted / d.tasksCreated) * 100)) : 0

  const hours = Math.floor(d.focusMinutes / 60)
  const mins = d.focusMinutes % 60
  const focusLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`

  const topStreak = d.habits.find((h) => h.streak > 0)

  /*
    Lead with the most encouraging true fact, in the order that matters to most
    people. The point of this email is to bring someone back, not to audit them —
    so it never opens on something they did badly.
  */
  const headline =
    d.tasksCompleted > 0
      ? t('email.weekly.headlineTasks', { count: d.tasksCompleted })
      : topStreak
        ? t('email.weekly.headlineHabits', { habit: topStreak.title, days: topStreak.streak })
        : d.focusSessions > 0
          ? t('email.weekly.headlineFocus', { duration: focusLabel })
          : d.prayers > 0
            ? t('email.weekly.headlinePrayers', { count: d.prayers })
            : t('email.weekly.headlineQuiet')

  // Only rows with something in them. A column of zeroes is a reason to close
  // the email.
  const rows = [
    d.tasksCompleted > 0 || d.tasksCreated > 0
      ? statRow(
          t('email.weekly.tasks'),
          String(d.tasksCompleted),
          t('email.weekly.tasksHint', { count: d.tasksCreated })
        )
      : '',
    d.habitCheckIns > 0
      ? statRow(
          t('email.weekly.habits'),
          String(d.habitCheckIns),
          t('email.weekly.habitsHint', { count: d.habitCount })
        )
      : '',
    d.focusSessions > 0
      ? statRow(
          t('email.weekly.focus'),
          focusLabel,
          t('email.weekly.focusHint', { count: d.focusSessions })
        )
      : '',
    d.goalsTotal > 0
      ? statRow(
          t('email.weekly.goals'),
          String(d.goalsCompleted),
          t('email.weekly.goalsHint', { count: d.goalsTotal })
        )
      : '',
    d.journal > 0 ? statRow(t('email.weekly.journal'), String(d.journal)) : '',
    d.prayers > 0
      ? statRow(
          t('email.weekly.prayers'),
          String(d.prayers),
          t('email.weekly.prayersHint', { percent: onTimeRate })
        )
      : '',
  ]
    .filter(Boolean)
    .join('')

  const streaks =
    d.habits.filter((h) => h.streak > 0).length > 0
      ? `<h2 style="font-size:15px;margin:26px 0 10px;color:#0f172a;">${escapeHtml(
          t('email.weekly.sectionStreaks')
        )}</h2>
         <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
           ${d.habits
             .filter((h) => h.streak > 0)
             .map((h) =>
               statRow(
                 escapeHtml(h.title),
                 t('email.weekly.days', { count: h.streak }),
                 h.longestStreak > h.streak
                   ? t('email.weekly.bestHint', { count: h.longestStreak })
                   : t('email.weekly.personalBest')
               )
             )
             .join('')}
         </table>`
      : ''

  const body = `
    <p style="margin:0 0 18px;">${escapeHtml(t('email.weekly.greeting', { name: d.name }))}</p>

    ${
      rows
        ? `<h2 style="font-size:15px;margin:0 0 10px;color:#0f172a;">${escapeHtml(
            t('email.weekly.sectionDoing')
          )}</h2>
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
             ${rows}
           </table>`
        : `<p style="margin:0 0 18px;color:#475569;">${escapeHtml(t('email.weekly.quiet'))}</p>`
    }

    ${d.tasksCreated > 0 ? meter(taskRate, t('email.weekly.completionMeter')) : ''}
    ${d.prayers > 0 ? meter(onTimeRate, t('email.weekly.onTimeMeter')) : ''}

    ${streaks}
  `

  // Preheader leads on the same fact as the headline, so the inbox preview and
  // the email agree.
  const preheader =
    d.tasksCompleted > 0
      ? t('email.weekly.headlineTasks', { count: d.tasksCompleted })
      : t('email.weekly.eyebrow')

  return renderEmail({
    title: headline,
    eyebrow: t('email.weekly.eyebrow'),
    preheader,
    body,
    cta: { label: t('email.openApp'), url: `${d.appUrl}/dashboard` },
    footnote: t('email.weekly.footnote'),
    appUrl: d.appUrl,
    locale: d.locale as 'en' | 'uz',
  })
}
