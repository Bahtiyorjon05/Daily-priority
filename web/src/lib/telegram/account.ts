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
}

/**
 * Find the account this Telegram user has already linked. Never creates one.
 *
 * It used to create an account with a `tg12345@telegram.local` address and no
 * password, and that was wrong in three ways at once: the person could never
 * sign in anywhere else, could never recover the account, and had a fake email
 * on file that nothing could ever send to. Four real people ended up in that
 * state.
 *
 * Signing up is now the same everywhere -- a real email or Google, and always a
 * password. Telegram is a fast way back IN to an account, not a way to have one
 * without the parts that make it recoverable.
 */
export async function findTelegramAccount(tg: TelegramUser): Promise<ResolvedAccount | null> {
  const existing = await prisma.user.findUnique({
    where: { telegramId: tg.id },
    select: { id: true, email: true, deletedAt: true },
  })

  if (!existing) return null

  if (existing.deletedAt) {
    /*
      The link belongs to a closed account. Release it so the same Telegram
      account can sign up again -- the same problem `deletedEmail` solves for
      email sign-ups, which shipped after somebody hit it.
    */
    await prisma.user.update({
      where: { id: existing.id },
      data: { telegramId: null },
    })
    return null
  }

  // Keep the username current: people change them, and both the admin console
  // and the stats report show it.
  await prisma.user.update({
    where: { id: existing.id },
    data: { telegramUsername: tg.username ?? null },
  })

  return { userId: existing.id, email: existing.email }
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
