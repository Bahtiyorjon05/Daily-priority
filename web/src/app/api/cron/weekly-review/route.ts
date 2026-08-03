import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import { recordCronRun } from '@/lib/cron-heartbeat'
import { renderEmail, statRow, meter, escapeHtml } from '@/lib/email-template'

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
        const [tasksCompleted, tasksCreated, focus, prayers, prayersOnTime, journal, habits] =
          await Promise.all([
            prisma.task.count({ where: { userId: user.id, status: 'COMPLETED', updatedAt: { gte: since } } }),
            prisma.task.count({ where: { userId: user.id, createdAt: { gte: since } } }),
            prisma.focusSession.aggregate({ where: { userId: user.id, date: { gte: since } }, _sum: { duration: true }, _count: { _all: true } }),
            prisma.prayerTracking.count({ where: { userId: user.id, date: { gte: since } } }),
            prisma.prayerTracking.count({ where: { userId: user.id, date: { gte: since }, onTime: true } }),
            prisma.journalEntry.count({ where: { userId: user.id, date: { gte: since } } }),
            prisma.habit.findMany({ where: { userId: user.id }, select: { title: true, streak: true, longestStreak: true }, orderBy: { streak: 'desc' }, take: 3 }),
          ])

        // Nothing happened this week — don't send an empty, discouraging email.
        const anyActivity = tasksCompleted + tasksCreated + (focus._count._all || 0) + prayers + journal > 0
        if (!anyActivity) {
          results.skipped++
          continue
        }

        if (dryRun) {
          results.sent++
          continue
        }

        await transporter.sendMail({
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: user.email,
          subject: 'Your week on Daily Priority 📊',
          html: renderWeeklyEmail({
            name: user.name || user.email.split('@')[0],
            tasksCompleted,
            tasksCreated,
            focusMinutes: focus._sum.duration || 0,
            focusSessions: focus._count._all || 0,
            prayers,
            prayersOnTime,
            journal,
            habits,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://daily-priority.vercel.app',
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

function renderWeeklyEmail(d: {
  name: string
  tasksCompleted: number
  tasksCreated: number
  focusMinutes: number
  focusSessions: number
  prayers: number
  prayersOnTime: number
  journal: number
  habits: { title: string; streak: number; longestStreak: number }[]
  appUrl: string
}): string {
  const onTimeRate = d.prayers > 0 ? Math.round((d.prayersOnTime / d.prayers) * 100) : 0
  const hours = Math.floor(d.focusMinutes / 60)
  const mins = d.focusMinutes % 60
  const focusLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  const topStreak = d.habits[0]

  // Lead with the single most encouraging fact rather than a wall of numbers —
  // the point of this email is to bring someone back, not to audit them.
  const headline =
    d.prayers > 0
      ? `You prayed ${d.prayers} times this week`
      : d.tasksCompleted > 0
        ? `You completed ${d.tasksCompleted} ${d.tasksCompleted === 1 ? 'task' : 'tasks'} this week`
        : topStreak
          ? `Your ${escapeHtml(topStreak.title)} streak is at ${topStreak.streak} days`
          : 'Here is your week'

  const body = `
    <p style="margin:0 0 18px;">Assalamu alaikum, <strong>${escapeHtml(d.name)}</strong> — here is how your week went.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
      ${d.prayers > 0 ? statRow('Prayers logged', String(d.prayers), `${onTimeRate}% on time`) : ''}
      ${d.tasksCompleted > 0 || d.tasksCreated > 0 ? statRow('Tasks completed', `${d.tasksCompleted}`, `${d.tasksCreated} created`) : ''}
      ${d.focusSessions > 0 ? statRow('Focus time', focusLabel, `${d.focusSessions} ${d.focusSessions === 1 ? 'session' : 'sessions'}`) : ''}
      ${d.journal > 0 ? statRow('Journal entries', String(d.journal)) : ''}
    </table>

    ${d.prayers > 0 ? meter(onTimeRate, 'Prayers on time') : ''}

    ${
      d.habits.length > 0
        ? `<h2 style="font-size:15px;margin:26px 0 10px;color:#0f172a;">Your streaks</h2>
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
             ${d.habits
               .map((h) =>
                 statRow(
                   h.title,
                   `${h.streak} ${h.streak === 1 ? 'day' : 'days'}`,
                   h.longestStreak > h.streak ? `best ${h.longestStreak}` : 'personal best'
                 )
               )
               .join('')}
           </table>`
        : ''
    }
  `

  return renderEmail({
    title: headline,
    eyebrow: 'Your week in review',
    preheader:
      d.prayers > 0
        ? `${d.prayers} prayers · ${onTimeRate}% on time · ${d.tasksCompleted} tasks done`
        : `${d.tasksCompleted} tasks done this week`,
    body,
    cta: { label: 'Open Daily Priority', url: `${d.appUrl}/dashboard` },
    footnote:
      'You can turn this email off in Settings → Notifications → Weekly review email.',
    appUrl: d.appUrl,
  })
}
