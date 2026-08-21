import { prisma } from '@/lib/prisma'
import { escapeHtml } from '@/lib/telegram/api'

/**
 * Who is using the bot, and the private command that reports it.
 *
 * The number that matters is the gap: starts say how many people the channel
 * sent, sign-ins say how many the app kept, and only the difference says which
 * of the two needs the work.
 *
 * EMOJI ARE WRITTEN AS \u ESCAPES, DELIBERATELY.
 *
 * The first version of this file had them as literals and they reached Telegram
 * as "\u00F0\u0178\u201C\u0160" -- double-encoded somewhere between the editor
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
  /** Only present when the person shares their contact; see the note below. */
  phone?: string
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
      create: {
        telegramId: identity.telegramId,
        ...common,
        ...(identity.phone ? { phone: identity.phone } : {}),
      },
      update: {
        ...common,
        /*
          A phone number is only ever written, never cleared. Telegram sends it
          once, in the update where the person shares their contact, and every
          message after that has no phone on it -- so overwriting with null would
          erase it the moment they said anything else.
        */
        ...(identity.phone ? { phone: identity.phone } : {}),
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

/**
 * People per page.
 *
 * Each entry runs to four or five lines and a Telegram message dies past 4096
 * characters. Six keeps a page comfortably inside that even when every name,
 * username and email is long.
 */
const PAGE_SIZE = 6

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
  phone: '\u{1F4F1}',
  mail: '\u{1F4E7}',
  globe: '\u{1F310}',
  left: '\u25C0\uFE0F',
  right: '\u25B6\uFE0F',
  bullet: '\u2022',
  dot: '\u00B7',
  dash: '\u2014',
  rule: '\u2501'.repeat(18),
} as const

/** Which slice of people to show. */
export type StatsFilter = 'all' | 'in' | 'out' | 'blocked'

const FILTER_LABEL: Record<StatsFilter, string> = {
  all: 'Hammasi',
  in: 'Ro\u2018yxatda',
  out: 'Ochgan',
  blocked: 'Bloklagan',
}

const STATUS: Record<'in' | 'out' | 'blocked', string> = {
  in: 'ro\u2018yxatdan o\u2018tgan',
  out: 'faqat ochgan',
  blocked: 'bloklagan',
}

/** "hozir", "5 daqiqa oldin", "3 soat oldin", "2 kun oldin". */
function agoUz(from: Date, now: number): string {
  const mins = Math.max(0, Math.floor((now - from.getTime()) / 60_000))
  if (mins < 1) return 'hozir'
  if (mins < 60) return `${mins} daqiqa oldin`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} soat oldin`
  return `${Math.floor(hours / 24)} kun oldin`
}

/** Callback payload for a page. Admin-only, re-checked when it arrives. */
export const statsCallback = (filter: StatsFilter, page: number) => `as:${filter}:${page}`

export function parseStatsCallback(
  data: string
): { filter: StatsFilter; page: number } | null {
  const [prefix, filter, page] = data.split(':')
  if (prefix !== 'as') return null
  if (!['all', 'in', 'out', 'blocked'].includes(filter)) return null
  const n = Number(page)
  /*
    Callback data is client-controlled even on a button only one person can see,
    so the page is bounded here rather than trusted -- an unbounded `skip` is a
    database scan whose size somebody else chooses.
  */
  if (!Number.isInteger(n) || n < 0 || n > 10_000) return null
  return { filter: filter as StatsFilter, page: n }
}

export type StatsView = {
  text: string
  keyboard: { text: string; callback_data: string }[][]
}

/**
 * One page of the report.
 *
 * The counts sit on every page rather than only the first: whoever is reading
 * page four still wants the total they are four pages into.
 */
export async function statsPage(
  filter: StatsFilter = 'all',
  page = 0
): Promise<StatsView> {
  const now = Date.now()

  const [total, blocked, active7, active1, linkedCount] = await Promise.all([
    prisma.telegramChat.count(),
    prisma.telegramChat.count({ where: { blocked: true } }),
    prisma.telegramChat.count({
      where: { blocked: false, lastSeenAt: { gte: new Date(now - 7 * DAY) } },
    }),
    prisma.telegramChat.count({
      where: { blocked: false, lastSeenAt: { gte: new Date(now - DAY) } },
    }),
    prisma.user.count({ where: { telegramId: { not: null }, deletedAt: null } }),
  ])

  /*
    Who has an app account, as one lookup rather than a join.

    `TelegramChat` deliberately has no relation to `User` -- most rows here will
    never have one -- so "signed in" is answered by intersecting ids. That also
    keeps the filters honest: a page of "signed in" is a page of people who
    really are, not people we assumed.
  */
  const linkedRows = await prisma.user.findMany({
    where: { telegramId: { not: null }, deletedAt: null },
    select: { telegramId: true, email: true },
  })
  const linked = new Map(linkedRows.map((u) => [u.telegramId as string, u.email]))
  const linkedIds = [...linked.keys()]

  const where =
    filter === 'blocked'
      ? { blocked: true }
      : filter === 'in'
        ? { telegramId: { in: linkedIds } }
        : filter === 'out'
          ? { blocked: false, telegramId: { notIn: linkedIds } }
          : {}

  const matching = await prisma.telegramChat.count({ where })
  const pages = Math.max(1, Math.ceil(matching / PAGE_SIZE))
  // A stale button from a longer list must not open an empty page.
  const current = Math.min(Math.max(0, page), pages - 1)

  const rows = await prisma.telegramChat.findMany({
    where,
    orderBy: { lastSeenAt: 'desc' },
    skip: current * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      telegramId: true, firstName: true, lastName: true, username: true,
      phone: true, languageCode: true, messages: true, blocked: true,
      lastSeenAt: true,
    },
  })

  const conversion = total > 0 ? Math.round((linkedCount / total) * 100) : 0

  const header = [
    `${E.chart} <b>DAILY PRIORITY ${E.dash} bot</b>`,
    '',
    `${E.people} Botni ochganlar: <b>${total}</b>`,
    `${E.tick} Ro\u2018yxatdan o\u2018tganlar: <b>${linkedCount}</b> (${conversion}%)`,
    `${E.fire} Bugun faol: <b>${active1}</b>  ${E.dot}  ${E.calendar} Shu hafta: <b>${active7}</b>`,
    `${E.blocked} Bloklaganlar: <b>${blocked}</b>`,
  ].join('\n')

  const people = rows.map((r, i) => {
    const number = current * PAGE_SIZE + i + 1
    const full = [r.firstName, r.lastName].filter(Boolean).join(' ').trim()
    // Telegram allows a blank name, so fall through rather than print nothing.
    const name = escapeHtml(full || r.username || r.telegramId)
    const email = linked.get(r.telegramId)

    const state = r.blocked ? 'blocked' : email ? 'in' : 'out'
    const mark = r.blocked ? E.blocked : email ? E.tick : E.person

    const lines = [
      `<b>${number}. ${mark} ${name}</b>`,
      `${STATUS[state]}  ${E.dot}  ${
        r.username ? `@${escapeHtml(r.username)}` : 'username yo\u2018q'
      }`,
      `<code>${r.telegramId}</code>`,
    ]
    // Only what exists: a row of empty labels reads as broken data.
    if (email) lines.push(`${E.mail} ${escapeHtml(email)}`)
    if (r.phone) lines.push(`${E.phone} ${escapeHtml(r.phone)}`)
    lines.push(
      `${E.speech} ${r.messages} ta xabar  ${E.dot}  ${E.clock} ${agoUz(r.lastSeenAt, now)}` +
        (r.languageCode ? `  ${E.dot}  ${E.globe} ${escapeHtml(r.languageCode)}` : '')
    )
    return lines.join('\n')
  })

  const body =
    rows.length === 0
      ? `\n${E.rule}\n\n<b>${FILTER_LABEL[filter]}</b>\nBu ro\u2018yxat bo\u2018sh.`
      : `\n${E.rule}\n<b>${FILTER_LABEL[filter]}</b>  ${E.dot}  ${current + 1}/${pages}-sahifa` +
        `  ${E.dot}  ${matching} ta\n\n${people.join('\n\n')}`

  /*
    Filters first, then the pager.

    "Who never signed in" is the question this report exists to answer, so the
    filter that shows it sits above the paging rather than below it.
  */
  const keyboard: StatsView['keyboard'] = [
    (['all', 'in', 'out', 'blocked'] as StatsFilter[]).map((f) => ({
      text: f === filter ? `${E.bullet} ${FILTER_LABEL[f]}` : FILTER_LABEL[f],
      callback_data: statsCallback(f, 0),
    })),
  ]

  if (pages > 1) {
    const nav: { text: string; callback_data: string }[] = []
    if (current > 0) nav.push({ text: E.left, callback_data: statsCallback(filter, current - 1) })
    nav.push({ text: `${current + 1}/${pages}`, callback_data: statsCallback(filter, current) })
    if (current < pages - 1) {
      nav.push({ text: E.right, callback_data: statsCallback(filter, current + 1) })
    }
    keyboard.push(nav)
  }

  return { text: `${header}\n${body}`, keyboard }
}
