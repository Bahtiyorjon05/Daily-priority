import { prisma } from '@/lib/prisma'
import { createLogger } from '@/lib/logger'

const logger = createLogger('AccountRecycle')

/**
 * Letting someone sign up again after closing their account.
 *
 * Deleting an account is a soft delete: the row and every task, habit, goal and
 * journal entry stay, so the admin console keeps the full history. But `email`
 * is unique, so that closed row went on squatting the address — and signing up
 * again answered "an account with this email already exists. Sign in instead",
 * which was both wrong and a dead end, because signing in is refused too.
 *
 * The fix is to move the address off the closed row rather than to revive it.
 * Reviving would be worse: it would resurrect data the person deliberately
 * deleted, and it would erase the deletion from the admin console. So `email`
 * becomes a tombstone, the real address moves to `deletedEmail`, and the new
 * sign-up creates a genuinely new account that starts empty.
 *
 * Only ever called for a row that already has `deletedAt` set, and only after
 * the caller has proven control of the address — a verification code on the
 * email path, Google's own assertion on the OAuth path. That is the same proof
 * a first-time sign-up needs, so this grants nothing extra.
 */

/** RFC 2606 reserves `.invalid`, so this can never collide with a real address. */
export const tombstoneEmail = (userId: string) => `deleted+${userId}@account.invalid`

/**
 * Frees a soft-deleted account's email address. Idempotent, and a no-op for any
 * account that is not deleted — the caller decides who is eligible, but getting
 * that wrong must not be able to rename a live user out of their own account.
 *
 * Returns true when an address was actually released.
 */
export async function releaseDeletedEmail(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, deletedAt: true, deletedEmail: true },
  })

  if (!user || !user.deletedAt) return false
  // Already released by an earlier attempt; the address is free.
  if (user.deletedEmail) return false

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        deletedEmail: user.email,
        email: tombstoneEmail(user.id),
      },
    }),
    // The OAuth links have to go with the address, and releasing the email alone
    // is not enough. The Google branch of the JWT callback looks the account up
    // by (provider, providerAccountId) *before* it looks at the email, and
    // returns early on a hit — so a leftover link would have signed the person
    // straight back into the closed account, resurrecting exactly the data they
    // deleted. `@@unique([provider, providerAccountId])` would also reject the
    // new link.
    //
    // Only credentials are dropped here. Tasks, habits, goals, journal entries,
    // prayer tracking and focus sessions all stay on the closed row.
    prisma.account.deleteMany({ where: { userId: user.id } }),
  ])

  logger.info('Released email from a closed account so it can be reused', {
    userId: user.id,
  })
  return true
}

/**
 * Looks up an account by email for the sign-up paths.
 *
 * A closed account must not read as "taken" — but it must also not be treated
 * as absent while it still holds the address, or `user.create` hits the unique
 * index and the user sees a 500. So callers get both facts.
 */
export async function findSignupConflict(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      password: true,
      emailVerified: true,
      deletedAt: true,
    },
  })

  if (!user) return { user: null, closed: false as const }
  return { user, closed: user.deletedAt != null }
}
