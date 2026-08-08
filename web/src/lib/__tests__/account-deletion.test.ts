import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guards the properties of account deletion that are easy to break silently.
 *
 * Deletion is a *soft* delete: the row survives so the admin console keeps a
 * history. That design only holds if two things stay true — sign-in is refused
 * on every path, and nothing starts filtering deleted rows out of the admin
 * queries. Both are one-line changes away from being wrong, and neither would
 * fail loudly.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

describe('account deletion', () => {
  const auth = read('src/lib/auth.ts')

  it('refuses the credentials path for a deleted account', () => {
    expect(auth, 'authorize() must select deletedAt').toMatch(/deletedAt:\s*true/)
    expect(auth, 'authorize() must reject when deletedAt is set').toMatch(
      /if \(user\?\.deletedAt\)/
    )
  })

  it('never returns an OAuth sign-in to the closed account', () => {
    // A Google sign-in never reaches the credentials provider, so the signIn
    // callback is the only shared hook. It used to `return false` here, which
    // kept people out but also trapped Google-only users forever: no password to
    // sign in with, and the e-mail sign-up path blocked as well. It now releases
    // the address so a *new* account is created instead. Either way, the one
    // thing that must never happen is landing back in the closed account.
    const signIn = /async signIn\([^]*?\n {4}\}/.exec(auth)?.[0] ?? ''
    expect(signIn, 'signIn callback must check deletedAt').toContain('deletedAt')
    expect(signIn, 'signIn callback must act on a closed account').toMatch(
      /releaseDeletedEmail|return false/
    )
  })

  it('invalidates a JWT that is already in circulation', () => {
    // Otherwise closing the account on one device leaves another signed in
    // until the token expires.
    expect(auth).toMatch(/token\.deleted = true/)
  })

  const route = read('src/app/api/user/account/route.ts')

  it('verifies the confirmation email on the server, not just in the form', () => {
    expect(route).toContain('confirmEmail')
    expect(route, 'must compare the typed email against the account email').toMatch(
      /typed !== sanitizeEmail\(user\.email\)/
    )
  })

  it('soft-deletes rather than destroying the row', () => {
    expect(route, 'must set deletedAt').toMatch(/deletedAt,?/)
    expect(
      /prisma\.user\.delete\b/.test(route),
      'must not hard-delete the user — the admin console depends on the row'
    ).toBe(false)
  })

  it('revokes push and server sessions so the closure takes effect everywhere', () => {
    expect(route).toMatch(/pushSubscription\.deleteMany/)
    expect(route).toMatch(/session\.deleteMany/)
  })

  it('is idempotent, so a repeat call cannot move the timestamp', () => {
    expect(route).toMatch(/if \(user\.deletedAt\)/)
  })

  describe('signing up again with a closed account’s address', () => {
    /**
     * Closing an account must not ban the email address for good. It did:
     * `email` is unique and the soft-deleted row kept squatting it, so sign-up
     * answered "an account with this email already exists. Sign in instead" —
     * advice that could not work, because sign-in refuses deleted accounts.
     */
    const recycle = read('src/lib/account-recycle.ts')

    it('lets the sign-up code through for a closed account', () => {
      // This route is where the user actually hit the wall: the error came
      // before any code was ever sent.
      const send = read('src/app/api/auth/send-verification-code/route.ts')
      expect(send, 'must select deletedAt to be able to tell the difference').toMatch(
        /deletedAt:\s*true/
      )
      expect(send, 'must only block live accounts').toMatch(
        /!existingUser\.deletedAt/
      )
    })

    it('lets registration through for a closed account', () => {
      const register = read('src/app/api/auth/register/route.ts')
      expect(register, 'must only block live accounts').toMatch(
        /found\?\.password && !found\.deletedAt/
      )
      // The call, not the import — asserting the bare name passed even with the
      // call deleted, because `import { releaseDeletedEmail }` still matched.
      expect(register, 'must actually call the release').toMatch(
        /await releaseDeletedEmail\(/
      )
      // And it must fall through to the create branch afterwards, otherwise the
      // address is freed and no account is made.
      expect(register, 'must clear existingUser so registration creates').toMatch(
        /existingUser = null/
      )
    })

    it('releases rather than revives', () => {
      // Reviving the row would hand back data the person deliberately deleted
      // and erase the deletion from the admin console.
      expect(recycle, 'must not clear deletedAt').not.toMatch(/deletedAt:\s*null/)
      expect(recycle, 'must move the address aside').toMatch(/deletedEmail: user\.email/)
      expect(recycle, 'must tombstone the unique column').toMatch(/email: tombstoneEmail/)
    })

    it('drops the OAuth links along with the address', () => {
      // Releasing the email alone is not enough: the Google branch resolves the
      // account by (provider, providerAccountId) *before* it looks at the email
      // and returns early on a hit, so a leftover link signs the person back
      // into the closed account.
      expect(recycle).toMatch(/account\.deleteMany/)
      // And it must be atomic with the rename — a half-release leaves an
      // account reachable by OAuth under a tombstoned address.
      expect(recycle).toMatch(/\$transaction/)
    })

    it('refuses to rename an account that is not closed', () => {
      // The callers decide who is eligible; a mistake there must not be able to
      // rename a live user out of their own account.
      expect(recycle).toMatch(/if \(!user \|\| !user\.deletedAt\) return false/)
    })

    it('is idempotent, so a retried sign-up cannot lose the real address', () => {
      // Second call must not overwrite deletedEmail with the tombstone.
      expect(recycle).toMatch(/if \(user\.deletedEmail\) return false/)
    })

    it('uses a tombstone that can never collide with a real address', () => {
      // RFC 2606 reserves .invalid.
      expect(recycle).toMatch(/@account\.invalid/)
      expect(recycle, 'must be unique per row').toMatch(/\$\{userId\}/)
    })

    it('does not offer a password reset for a closed account', () => {
      // It would have emailed a code, accepted a new password, and then sign-in
      // would still refuse them.
      const forgot = read('src/app/api/auth/forgot-password/route.ts')
      expect(forgot).toMatch(/!user \|\| user\.deletedAt/)
    })

    it('still shows the admin console who the closed record was', () => {
      // After release, `email` is a tombstone, so the console has to read the
      // address from `deletedEmail` or the record becomes unidentifiable.
      const admin = read('src/app/api/admin/users/route.ts')
      expect(admin).toMatch(/deletedEmail:\s*true/)
      expect(admin).toMatch(/email: u\.deletedEmail \?\? u\.email/)
    })
  })

  it('keeps deleted users visible to the admin console', () => {
    const admin = read('src/app/api/admin/users/route.ts')
    expect(admin, 'admin must surface the deletion state').toMatch(/deletedAt:\s*true/)
    // The whole point of a soft delete here is retained history; a `where`
    // clause excluding deleted rows would quietly undo it.
    expect(
      /findMany\(\{\s*where:\s*\{[^}]*deletedAt/.test(admin),
      'admin user query must not filter out deleted accounts'
    ).toBe(false)
  })
})
