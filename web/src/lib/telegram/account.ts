import { prisma } from '@/lib/prisma'
import type { TelegramUser } from '@/lib/telegram/init-data'

/**
 * Turning a verified Telegram identity into an app account.
 *
 * Only ever called with a `TelegramUser` that came out of `verifyInitData`, so
 * the id here is one Telegram signed for. Nothing in this file re-checks that;
 * it would be checking the wrong thing in the wrong place. The single rule is:
 * never call it with unverified input.
 */

/**
 * Telegram accounts have no email, and `User.email` is unique and required.
 *
 * A placeholder in a domain nobody can receive mail at is deliberate: it must be
 * unmistakably not-a-real-address so nothing ever tries to send to it, and it
 * must be stable so re-opening the app finds the same row. The person can add a
 * real address later, which is what `isPlaceholderEmail` is for.
 */
export const TELEGRAM_EMAIL_DOMAIN = 'telegram.local'

export function telegramPlaceholderEmail(telegramId: string): string {
  return `tg${telegramId}@${TELEGRAM_EMAIL_DOMAIN}`
}

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return Boolean(email?.endsWith(`@${TELEGRAM_EMAIL_DOMAIN}`))
}

/** The display name to greet someone by, from whatever Telegram gave us. */
export function telegramDisplayName(user: TelegramUser): string {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return full || user.username || 'Friend'
}

export type ResolvedAccount = {
  userId: string
  email: string
  /** True when this call created the account, so the caller can route to onboarding. */
  created: boolean
}

/**
 * Find the account for this Telegram user, or make one.
 *
 * A closed account is not reopened here. Someone who deleted their account and
 * comes back through Telegram gets a fresh one rather than silently resurrecting
 * a record they asked to be rid of -- and `deletedAt` is checked in the auth
 * layer anyway, so returning it would just fail the login with no explanation.
 */
export async function resolveTelegramAccount(
  tg: TelegramUser,
  opts: { chatId?: string } = {}
): Promise<ResolvedAccount> {
  const existing = await prisma.user.findUnique({
    where: { telegramId: tg.id },
    select: { id: true, email: true, deletedAt: true },
  })

  if (existing && !existing.deletedAt) {
    // Keep the username current -- people change them, and the admin console and
    // the bot both show it.
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        telegramUsername: tg.username ?? null,
        ...(opts.chatId ? { telegramChatId: opts.chatId } : {}),
      },
    })
    return { userId: existing.id, email: existing.email, created: false }
  }

  if (existing?.deletedAt) {
    /*
      The link belongs to a closed account. Release it, so the same Telegram
      account can start again -- exactly the problem `deletedEmail` solves for
      email sign-ups, which shipped after someone hit it.
    */
    await prisma.user.update({
      where: { id: existing.id },
      data: { telegramId: null },
    })
  }

  const email = telegramPlaceholderEmail(tg.id)
  const created = await prisma.user.create({
    data: {
      email,
      name: telegramDisplayName(tg),
      telegramId: tg.id,
      telegramUsername: tg.username ?? null,
      telegramLinkedAt: new Date(),
      ...(opts.chatId ? { telegramChatId: opts.chatId } : {}),
      // No password: this account cannot be signed into with one, and
      // `authorize` refuses a credentials login when `password` is null.
      emailVerified: null,
    },
    select: { id: true, email: true },
  })

  return { userId: created.id, email: created.email, created: true }
}

/**
 * Attach a Telegram account to someone already signed in.
 *
 * Refuses if that Telegram account is already attached to somebody else --
 * without the check, opening the Mini App on a shared phone could move another
 * person's Telegram identity onto your account.
 */
export async function linkTelegramToUser(
  userId: string,
  tg: TelegramUser,
  opts: { chatId?: string } = {}
): Promise<{ ok: true } | { ok: false; reason: 'taken' }> {
  const holder = await prisma.user.findUnique({
    where: { telegramId: tg.id },
    select: { id: true },
  })
  if (holder && holder.id !== userId) return { ok: false, reason: 'taken' }

  await prisma.user.update({
    where: { id: userId },
    data: {
      telegramId: tg.id,
      telegramUsername: tg.username ?? null,
      telegramLinkedAt: new Date(),
      ...(opts.chatId ? { telegramChatId: opts.chatId } : {}),
    },
  })
  return { ok: true }
}
