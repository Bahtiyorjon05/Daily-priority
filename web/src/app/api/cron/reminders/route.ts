import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserTranslator } from '@/lib/i18n/server'

/** Prayer names arrive as English slot labels; these map them to message keys. */
const PRAYER_KEY: Record<string, string> = {
  Fajr: 'prayer.fajr',
  Dhuhr: 'prayer.dhuhr',
  Asr: 'prayer.asr',
  Maghrib: 'prayer.maghrib',
  Isha: 'prayer.isha',
}
import { sendPushToUser, isPushConfigured, isQuietHour } from '@/lib/push'
import { sendMessage } from '@/lib/telegram/api'
import { todayKeyInTimeZone, localDayRange } from '@/lib/server-date'
import { recordCronRun } from '@/lib/cron-heartbeat'

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
  /*
    Push being unconfigured is no longer fatal: Telegram delivery does not need
    VAPID keys, and refusing the whole run would take the working channel down
    with the broken one.
  */
  const pushReady = isPushConfigured()

  const startedAt = Date.now()
  const now = new Date()
  const results = { prayer: 0, habit: 0, task: 0, usersChecked: 0, errors: 0 }

  try {
    /*
      Anyone reachable by ANY channel.

      This used to be push subscribers only, which quietly excluded every
      Telegram user -- and push reached 2 accounts out of 29 while a Telegram
      message needs no permission prompt and survives a reinstall. A reminder
      nobody receives is not a reminder.
    */
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { pushSubscriptions: { some: {} } },
          { telegramReminders: true, telegramChatId: { not: null } },
        ],
      },
      select: {
        id: true,
        name: true,
        timezone: true,
        notificationPreference: true,
        telegramChatId: true,
        telegramReminders: true,
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

      // Resolved once per user, not per notification: all three branches below
      // send to the same person, and this runs for every user every five
      // minutes.
      const { t } = await getUserTranslator(user.id)

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
                /*
                  Telegram as well as push, and with a button.

                  The reminder and the action it asks about end up in the same
                  place: "Asr in 10 minutes" with a tick that marks it, so the
                  answer never requires opening anything.
                */
                if (user.telegramReminders && user.telegramChatId) {
                  const slot = name.toLowerCase()
                  await sendMessage(
                    user.telegramChatId,
                    `🕌 <b>${t(PRAYER_KEY[name] ?? name)}</b> — ${hhmm}
${t('push.prayerTitle', {
                      prayer: t(PRAYER_KEY[name] ?? name),
                      minutes: lead,
                    })}`,
                    {
                      keyboard: [
                        [{ text: `✅ ${t(PRAYER_KEY[name] ?? name)}`, callback_data: `p:${slot}` }],
                      ],
                    }
                  ).catch(() => {
                    /* One unreachable chat must not stop the run for everyone
                       else; the daily job disables blocked chats. */
                  })
                }

                if (pushReady) await sendPushToUser(user.id, {
                  title: t('push.prayerTitle', { prayer: t(PRAYER_KEY[name] ?? name), minutes: lead }),
                  body: t('push.prayerBody', { prayer: t(PRAYER_KEY[name] ?? name), time: hhmm }),
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
            if (pushReady) await sendPushToUser(user.id, {
              title:
                pending.length === 1
                  ? t('push.habitsOne')
                  : t('push.habitsMany', { count: pending.length }),
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
            if (pushReady) await sendPushToUser(user.id, {
              title:
                overdue === 1 ? t('push.overdueOne') : t('push.overdueMany', { count: overdue }),
              body: t('push.overdueBody'),
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

    await recordCronRun('reminders', true, results, Date.now() - startedAt)
    return NextResponse.json({ ok: true, ...results })
  } catch (error) {
    console.error('[cron/reminders] failed', error)
    await recordCronRun('reminders', false, { error: (error as Error).message }, Date.now() - startedAt)
    return NextResponse.json({ error: 'Reminder run failed' }, { status: 500 })
  }
}
