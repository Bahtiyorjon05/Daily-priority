import { prisma } from '@/lib/prisma'
import { escapeHtml } from '@/lib/telegram/api'

/**
 * Who is using the bot, and the one command that reports it.
 *
 * The number that matters is the gap: starts say how many people the channel
 * sent, sign-ins say how many the app kept, and only the difference says which
 * of the two needs the work.
 *
 * EMOJI ARE WRITTEN AS \u ESCAPES, DELIBERATELY.
 *
 * The first version of this file had them as literals and they reached Telegram
 * as "\u00f0\u0178\u201c\u0160" -- double-encoded somewhere between the editor
 * and disk, so the whole report arrived as mojibake. An escape is plain ASCII in
 * the source: no editor, shell, patch tool or transfer can corrupt it, and what
 * you read here is exactly what the reader receives.
 */

/** Nobody but this Telegram id sees any of it. */
export function isAdmin(telegramId: string): boolean {
  const allowed = process.env.TELEGRAM_ADMIN_ID?.trim()
  /*
    Fails closed. With no id configured this must deny everyone rather than
    default to "no restriction", which is how a private command becomes a public
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
 * us, and a stale flag would keep them out of the active count forever. Never
 * throws -- failing to write a statistic must not cost somebody their reply.
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

/** How many people to list. A Telegram message caps at 4096 characters, and a
 *  wall of 300 rows is not a report. */
const LIST_LIMIT = 20

const DAY = 86_400_000

const E = {
  chart: '\u{1F4CA}',
  people: '\u{1F465}',
  tick: '\u2705',
  fire: '\u{1F525}',
  calendar: '\u{1F4C5}',
  blocked: '\u{1F6AB}',
  person: '\u{1F464}',
  speech: '\u{1F4AC}',
  clock: '\u{1F552}',
  rule: '\u2501'.repeat(18),
} as const

/** "hozir", "5 daqiqa oldin", "3 soat oldin", "2 kun oldin". */
function agoUz(from: Date, now: number): string {
  const mins = Math.max(0, Math.floor((now - from.getTime()) / 60_000))
  if (mins < 1) return 'hozir'
  if (mins < 60) return `${mins} daqiqa oldin`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} soat oldin`
  return `${Math.floor(hours / 24)} kun oldin`
}

/**
 * The report.
 *
 * Counts first, then the people. Someone reading this on a phone wants the
 * numbers immediately; the list is what they scroll to.
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
        messages: true, blocked: true, lastSeenAt: true,
      },
    }),
  ])

  /*
    Which of them signed in. One query over the ids on screen rather than a
    join, because TelegramChat deliberately has no relation to User -- most rows
    here will never have one.
  */
  const signedIn = new Set(
    (
      await prisma.user.findMany({
        where: { telegramId: { in: recent.map((r) => r.telegramId) } },
        select: { telegramId: true },
      })
    ).map((u) => u.telegramId)
  )

  const conversion = total > 0 ? Math.round((linked / total) * 100) : 0

  const header = [
    `${E.chart} <b>DAILY PRIORITY \u2014 bot statistikasi</b>`,
    '',
    `${E.people} Botni ochganlar: <b>${total}</b>`,
    `${E.tick} Ro'yxatdan o'tganlar: <b>${linked}</b> (${conversion}%)`,
    `${E.fire} Bugun faol: <b>${active1}</b>`,
    `${E.calendar} Shu hafta faol: <b>${active7}</b>`,
    `${E.blocked} Botni bloklaganlar: <b>${blocked}</b>`,
  ].join('\n')

  if (recent.length === 0) {
    return `${header}\n\n${E.rule}\n\nHali hech kim botni ochmagan.`
  }

  const people = recent.map((r) => {
    const full = [r.firstName, r.lastName].filter(Boolean).join(' ').trim()
    // Telegram allows a blank name, so fall through rather than print nothing.
    const name = escapeHtml(full || r.username || r.telegramId)
    const mark = r.blocked ? E.blocked : signedIn.has(r.telegramId) ? E.tick : E.person
    const status = r.blocked
      ? 'bloklagan'
      : signedIn.has(r.telegramId)
        ? "ro'yxatdan o'tgan"
        : 'faqat ochgan'

    const handle = r.username ? `@${escapeHtml(r.username)}` : "username yo'q"

    return (
      `${mark} <b>${name}</b> \u2014 ${status}\n` +
      `${handle}  \u00b7  <code>${r.telegramId}</code>\n` +
      `${E.speech} ${r.messages} ta xabar  \u00b7  ${E.clock} ${agoUz(r.lastSeenAt, now)}`
    )
  })

  const shown =
    total > LIST_LIMIT
      ? `Oxirgi ${recent.length} ta (jami ${total})`
      : `Barcha ${recent.length} ta`

  return `${header}\n\n${E.rule}\n<b>${shown}</b>\n\n${people.join('\n\n')}`
}
