import { prisma } from '@/lib/prisma'
import { escapeHtml } from '@/lib/telegram/api'

/**
 * Who is using the bot, and the one command that reports it.
 *
 * Every person who messages the bot is recorded here, whether or not they ever
 * sign in. That gap is the interesting number: starts tell you how many people
 * the channel sent, sign-ins tell you how many of them the app kept, and only
 * the difference tells you which of the two needs work.
 */

/** Nobody but this Telegram id sees any of it. */
export function isAdmin(telegramId: string): boolean {
  const allowed = process.env.TELEGRAM_ADMIN_ID?.trim()
  /*
    Fails closed. With no id configured this must deny everyone rather than
    default to "no restriction", which is how an admin command becomes a public
    one after an environment variable is renamed.
  */
  if (!allowed) return false
  return telegramId === allowed
}

export type ChatIdentity = {
  telegramId: string
  chatId: string | number
  firstName?: string
  lastName?: string
  username?: string
  languageCode?: string
}

/**
 * Record that this person just used the bot.
 *
 * Also clears `blocked`: someone messaging us is, by definition, not blocking
 * us, and a stale block would keep them out of the active count forever. Never
 * throws — failing to write a statistic must not cost somebody their reply.
 */
export async function recordChat(identity: ChatIdentity): Promise<void> {
  try {
    const common = {
      chatId: String(identity.chatId),
      firstName: identity.firstName ?? null,
      lastName: identity.lastName ?? null,
      username: identity.username ?? null,
      languageCode: identity.languageCode ?? null,
    }
    await prisma.telegramChat.upsert({
      where: { telegramId: identity.telegramId },
      create: { telegramId: identity.telegramId, ...common },
      update: {
        ...common,
        lastSeenAt: new Date(),
        messages: { increment: 1 },
        blocked: false,
        blockedAt: null,
      },
    })
  } catch (error) {
    console.error('[telegram] chat record failed', error)
  }
}

/** Telegram announces a block through `my_chat_member`; this records it. */
export async function setBlocked(telegramId: string, blocked: boolean): Promise<void> {
  try {
    await prisma.telegramChat.updateMany({
      where: { telegramId },
      data: { blocked, blockedAt: blocked ? new Date() : null },
    })
  } catch (error) {
    console.error('[telegram] block record failed', error)
  }
}

/** How many names to list. A Telegram message caps at 4096 characters, and a
 *  wall of 300 rows is not a report. */
const LIST_LIMIT = 25

const DAY = 86_400_000

/**
 * The report.
 *
 * Counts first, then the most recent people. Someone reading this on a phone
 * wants the four numbers immediately; the list is what they scroll to.
 */
export async function statsMessage(): Promise<string> {
  const now = Date.now()
  const [total, blocked, active7, active1, linked, recent] = await Promise.all([
    prisma.telegramChat.count(),
    prisma.telegramChat.count({ where: { blocked: true } }),
    prisma.telegramChat.count({
      where: { blocked: false, lastSeenAt: { gte: new Date(now - 7 * DAY) } },
    }),
    prisma.telegramChat.count({
      where: { blocked: false, lastSeenAt: { gte: new Date(now - DAY) } },
    }),
    prisma.user.count({ where: { telegramId: { not: null }, deletedAt: null } }),
    prisma.telegramChat.findMany({
      orderBy: { lastSeenAt: 'desc' },
      take: LIST_LIMIT,
      select: {
        telegramId: true, firstName: true, lastName: true, username: true,
        messages: true, blocked: true, startedAt: true, lastSeenAt: true,
      },
    }),
  ])

  /*
    Which of them signed in. Done as one query over the ids on screen rather than
    a join, because TelegramChat deliberately has no relation to User -- most
    rows here will never have one.
  */
  const signedIn = new Set(
    (
      await prisma.user.findMany({
        where: { telegramId: { in: recent.map((r) => r.telegramId) } },
        select: { telegramId: true },
      })
    ).map((u) => u.telegramId)
  )

  const ago = (d: Date) => {
    const mins = Math.floor((now - d.getTime()) / 60_000)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    return `${Math.floor(hours / 24)}d`
  }

  const lines = recent.map((r) => {
    const name = escapeHtml([r.firstName, r.lastName].filter(Boolean).join(' ') || 'â€”')
    const handle = r.username ? `@${escapeHtml(r.username)}` : 'â€”'
    // One glyph carries the state: blocked, signed in, or started only.
    const mark = r.blocked ? 'ðŸš«' : signedIn.has(r.telegramId) ? 'âœ…' : 'ðŸ‘¤'
    return `${mark} <b>${name}</b> Â· ${handle}\n   <code>${r.telegramId}</code> Â· ${r.messages} msg Â· ${ago(r.lastSeenAt)}`
  })

  const conversion = total > 0 ? Math.round((linked / total) * 100) : 0

  return (
    `<b>ðŸ“Š Bot stats</b>\n\n` +
    `ðŸ‘¥ Started: <b>${total}</b>\n` +
    `âœ… Signed in: <b>${linked}</b> (${conversion}%)\n` +
    `ðŸ”¥ Active 24h: <b>${active1}</b> Â· 7d: <b>${active7}</b>\n` +
    `ðŸš« Blocked: <b>${blocked}</b>\n\n` +
    `<b>Recent ${Math.min(LIST_LIMIT, recent.length)}${total > LIST_LIMIT ? ` of ${total}` : ''}</b>\n` +
    (lines.length ? lines.join('\n') : 'Nobody yet.')
  )
}
