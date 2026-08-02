import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json({ ok: true, dryRun, ...results })
  } catch (error) {
    console.error('[cron/weekly-review] failed', error)
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

  const stat = (label: string, value: string) => `
    <td style="padding:12px;background:#f8fafc;border-radius:10px;text-align:center;width:25%">
      <div style="font-size:22px;font-weight:700;color:#0f766e">${value}</div>
      <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.04em">${label}</div>
    </td>`

  return `
  <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
    <div style="background:linear-gradient(135deg,#10b981,#0d9488);color:#fff;padding:28px;text-align:center;border-radius:12px 12px 0 0">
      <h1 style="margin:0;font-size:24px">Your week in review</h1>
      <p style="margin:8px 0 0;opacity:.9">Assalamu alaikum, ${escapeHtml(d.name)}</p>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:22px">
      <table style="width:100%;border-spacing:8px;border-collapse:separate">
        <tr>
          ${stat('Tasks done', String(d.tasksCompleted))}
          ${stat('Focus', hours > 0 ? `${hours}h ${mins}m` : `${mins}m`)}
          ${stat('Prayers', String(d.prayers))}
          ${stat('Journal', String(d.journal))}
        </tr>
      </table>

      ${d.prayers > 0 ? `<p style="color:#334155;font-size:14px;margin:18px 0 0">
        🕌 You logged <strong>${d.prayers}</strong> prayers, <strong>${onTimeRate}%</strong> on time.
      </p>` : ''}

      ${d.focusSessions > 0 ? `<p style="color:#334155;font-size:14px;margin:8px 0 0">
        🎯 <strong>${d.focusSessions}</strong> focus sessions completed.
      </p>` : ''}

      ${d.habits.length > 0 ? `
        <h3 style="font-size:14px;color:#0f172a;margin:22px 0 8px">Top streaks</h3>
        <ul style="padding-left:18px;color:#334155;font-size:14px;margin:0">
          ${d.habits.map((h) => `<li>${escapeHtml(h.title)} — 🔥 ${h.streak} days (best ${h.longestStreak})</li>`).join('')}
        </ul>` : ''}

      <div style="text-align:center;margin-top:26px">
        <a href="${d.appUrl}/dashboard" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600">Open Daily Priority</a>
      </div>
      <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:18px">
        Don't want these? Turn off weekly review in Settings → Notifications.
      </p>
    </div>
  </div>`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
