import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMessage } from '@/lib/telegram/api'
import { dailySnapshot } from '@/lib/telegram/actions'
import { dailyMessage, type Lang } from '@/lib/telegram/messages'
import { langOf } from '@/lib/telegram/bot'
import { todayKeyInTimeZone } from '@/lib/server-date'

/**
 * The daily message.
 *
 * One message a day, to the people who asked for it, saying what is actually
 * waiting: open tasks, unticked habits, prayers marked, whether the Quran has
 * been opened. With buttons to deal with all of it without leaving the chat.
 *
 * Why this exists at all: web push reached 2 of 29 accounts. A Telegram message
 * needs no permission prompt, survives a reinstall, and lands in a chat the
 * person already has open. It is the only reminder channel here that actually
 * reaches anyone.
 *
 * Opt-in only, through /reminders. An unrequested daily message is how a bot
 * gets blocked, and a blocked bot cannot be un-blocked by shipping a fix.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** The local hour the message should land in. Early enough to shape the day,
 *  late enough that it is not sitting there at Fajr. */
const SEND_HOUR = 8

/** Telegram allows ~30 messages a second to different chats. This stays far
 *  below that and keeps the function well inside its time budget. */
const BATCH = 20

/** The hour it currently is for this user, in their own timezone. */
function localHour(timeZone: string): number {
  try {
    return Number(
      new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hour12: false }).format(new Date())
    )
  } catch {
    return Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false }).format(new Date()))
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  const provided =
    auth?.replace(/^Bearer\s+/i, '') || new URL(request.url).searchParams.get('secret')

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  /*
    `force` runs the send regardless of the local hour, for testing a real
    delivery without waiting for 8am somewhere. It cannot be reached without the
    cron secret.
  */
  const force = new URL(request.url).searchParams.get('force') === '1'

  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        telegramReminders: true,
        telegramChatId: { not: null },
      },
      select: { id: true, name: true, timezone: true, telegramChatId: true },
    })

    let sent = 0
    let skipped = 0
    let failed = 0

    for (let i = 0; i < users.length; i += BATCH) {
      const batch = users.slice(i, i + BATCH)
      await Promise.all(
        batch.map(async (user) => {
          const tz = user.timezone || 'UTC'
          /*
            Sent at 8am in the READER's timezone, not the server's. This cron runs
            hourly and each user is only sent to in their own 8 o'clock hour --
            a single fixed UTC time would reach half the users in the middle of
            the night.
          */
          if (!force && localHour(tz) !== SEND_HOUR) {
            skipped++
            return
          }

          try {
            const snapshot = await dailySnapshot(user.id)
            // Language follows the app's own preference where there is one; the
            // bot has no Telegram locale to read outside a live update.
            const lang: Lang = langOf(tz.startsWith('Asia/Tashkent') ? 'uz' : undefined)
            const { text, keyboard } = dailyMessage(snapshot, lang, { name: user.name ?? undefined })
            const result = await sendMessage(user.telegramChatId!, text, { keyboard })
            if (result.ok) sent++
            else {
              failed++
              /*
                A blocked bot reports "bot was blocked by the user". Keeping the
                flag on would make us retry it every day forever, so it is turned
                off -- they can send /reminders again whenever they want it back.
              */
              if (/blocked|chat not found|deactivated/i.test(result.error)) {
                await prisma.user.update({
                  where: { id: user.id },
                  data: { telegramReminders: false },
                })
              }
            }
          } catch (error) {
            failed++
            console.error('[cron/telegram-daily] user failed', user.id, (error as Error).message)
          }
        })
      )
    }

    return NextResponse.json({
      success: true,
      day: todayKeyInTimeZone('UTC'),
      candidates: users.length,
      sent,
      skipped,
      failed,
    })
  } catch (error) {
    console.error('[cron/telegram-daily] failed', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
