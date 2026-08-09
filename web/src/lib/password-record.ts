import { prisma } from '@/lib/prisma'
import { encryptPassword } from '@/lib/password-vault'
import { createLogger } from '@/lib/logger'

const logger = createLogger('PasswordRecord')

/** What caused a password to be written, for the admin timeline. */
export type PasswordSource = 'signup' | 'signin' | 'reset' | 'change' | 'setup'

/**
 * Records a plaintext password to the reversible vault.
 *
 * One place so every entry point behaves the same: it refreshes
 * `User.passwordEnc` (the current password the admin console shows) AND appends
 * a `PasswordHistory` row, so the console can also show what came before.
 *
 * Best-effort by design — a vault write must never block a sign-in or a reset.
 * If the vault key is missing, nothing is stored and the caller carries on with
 * the bcrypt hash, exactly as before this existed.
 *
 * Deliberately reversible. See the note on the PasswordHistory model: this is
 * the admin-sees-passwords design of the app, extended to the past, and it
 * widens what a database leak exposes.
 */
export async function recordPassword(
  userId: string,
  plaintext: string,
  source: PasswordSource
): Promise<void> {
  if (!plaintext) return

  const passwordEnc = encryptPassword(plaintext)
  if (!passwordEnc) return // vault key not configured; degrade quietly

  try {
    // Skip a duplicate: signing in with the same password should not stack an
    // identical entry every time. Compare against the current password rather
    // than the whole history, so a genuine reuse of an OLD password is still
    // recorded as a new event in the timeline.
    const current = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordEnc: true },
    })

    // Ciphertext differs every time (random IV), so equal encrypted strings do
    // not mean equal passwords. Decrypt-compare is overkill on the hot path;
    // instead only the writers that represent a *deliberate* change (reset,
    // change, setup, signup) always append, while `signin` — which fires on
    // every login with an unchanged password — appends only when there is no
    // current vault copy yet. That keeps the timeline meaningful without a
    // decrypt on each request.
    const isDeliberate = source !== 'signin'
    const shouldAppend = isDeliberate || !current?.passwordEnc

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordEnc },
      }),
      ...(shouldAppend
        ? [
            prisma.passwordHistory.create({
              data: { userId, passwordEnc, source },
            }),
          ]
        : []),
    ])
  } catch (error) {
    logger.error('Failed to record password', error as Error)
  }
}
