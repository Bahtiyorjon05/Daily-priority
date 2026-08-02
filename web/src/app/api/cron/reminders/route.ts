import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPushToUser, isPushConfigured, isQuietHour } from '@/lib/push'
import { todayKeyInTimeZone, localDayRange } from '@/lib/server-date'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Reminder dispatcher, invoked by Vercel Cron (or any scheduler) via GET.
 *
 * Authenticated with CRON_SECRET: Vercel sends `Authorization: Bearer <secret>`
 * for configured cron jobs; a `?secret=` query param is accepted for manual runs.
 *
 * Idempotency: each notification carries a stable `tag` (user+kind+day+slot), so
 * a browser showing the same tag twice replaces rather than duplicates it. Safe
 * to run on a tight schedule.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  const provided = auth?.replace(/^Bearer\s+/i, '') || new URL(request.url).searchParams.get('secret')

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isPushConfigured()) {
    return NextResponse.json({ error: 'Push not configured (missing VAPID keys)' }, { status: 503 })
  }

  const now = new Date()
  const results = { prayer: 0, habit: 0, task: 0, usersChecked: 0, errors: 0 }

  try {
    // Only users who have at least one push endpoint are worth processing.
    const users = await prisma.user.findMany({
      where: { pushSubscriptions: { some: {} } },
      select: {
        id: true,
        name: true,
        timezone: true,
        notificationPreference: true,
      },
    })

    for (const user of users) {
      results.usersChecked++
      const tz = user.timezone || 'UTC'
      const prefs = user.notificationPreference
      // Absent preferences => sensible defaults (reminders on).
      const prayerOn = prefs?.prayerReminders ?? true
      const habitOn = prefs?.habitReminders ?? true
      const taskOn = prefs?.taskReminders ?? true
      const lead = prefs?.prayerLeadMinutes ?? 10

      // Local wall-clock for this user.
      const localHour = Number(
        new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', hour12: false }).format(now)
      )
      const localMinute = Number(
        new Intl.DateTimeFormat('en-US', { timeZone: tz, minute: '2-digit' }).format(now)
      )
      if (isQuietHour(localHour, prefs?.quietHoursStart, prefs?.quietHoursEnd)) continue

      const dayKey = todayKeyInTimeZone(tz)
      const nowMinutes = localHour * 60 + localMinute

      try {
        // --- Prayer reminders -------------------------------------------------
        if (prayerOn) {
          const range = localDayRange(dayKey, tz)
          const times = await prisma.prayerTime.findFirst({
            where: { userId: user.id, date: { gte: range.gte, lt: range.lt } },
          })
          if (times) {
            const slots: [string, string][] = [
              ['Fajr', times.fajr],
              ['Dhuhr', times.dhuhr],
              ['Asr', times.asr],
              ['Maghrib', times.maghrib],
              ['Isha', times.isha],
            ]
            for (const [name, hhmm] of slots) {
              const [h, m] = String(hhmm).split(':').map(Number)
              if (Number.isNaN(h) || Number.isNaN(m)) continue
              const target = h * 60 + m - lead
              // Fire once inside a 5-minute window around the target.
              if (nowMinutes >= target && nowMinutes < target + 5) {
                await sendPushToUser(user.id, {
                  title: `${name} in ${lead} minutes`,
                  body: `${name} is at ${hhmm}. Time to prepare. 🕌`,
                  url: '/prayers',
                  tag: `prayer-${user.id}-${dayKey}-${name}`,
                })
                results.prayer++
              }
            }
          }
        }

        // --- Habit reminder (once, at the user's chosen hour) -----------------
        if (habitOn && localHour === (prefs?.habitReminderHour ?? 20) && localMinute < 5) {
          const range = localDayRange(dayKey, tz)
          const habits = await prisma.habit.findMany({
            where: { userId: user.id, frequency: 'DAILY' },
            select: { id: true, title: true, completions: { where: { date: { gte: range.gte, lt: range.lt } }, select: { id: true }, take: 1 } },
          })
          const pending = habits.filter((h) => h.completions.length === 0)
          if (pending.length > 0) {
            await sendPushToUser(user.id, {
              title: pending.length === 1 ? 'One habit left today' : `${pending.length} habits left today`,
              body: pending.slice(0, 3).map((h) => h.title).join(', ') + (pending.length > 3 ? '…' : ''),
              url: '/habits',
              tag: `habit-${user.id}-${dayKey}`,
            })
            results.habit++
          }
        }

        // --- Overdue task digest (morning) ------------------------------------
        if (taskOn && localHour === 9 && localMinute < 5) {
          const overdue = await prisma.task.count({
            where: { userId: user.id, status: { in: ['TODO', 'IN_PROGRESS'] }, dueDate: { not: null, lt: now } },
          })
          if (overdue > 0) {
            await sendPushToUser(user.id, {
              title: `${overdue} overdue ${overdue === 1 ? 'task' : 'tasks'}`,
              body: 'Open Daily Priority to catch up.',
              url: '/dashboard',
              tag: `tasks-${user.id}-${dayKey}`,
            })
            results.task++
          }
        }
      } catch (err) {
        results.errors++
        console.error('[cron/reminders] user failed', user.id, (err as Error).message)
      }
    }

    return NextResponse.json({ ok: true, ...results })
  } catch (error) {
    console.error('[cron/reminders] failed', error)
    return NextResponse.json({ error: 'Reminder run failed' }, { status: 500 })
  }
}
