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

  it('refuses the OAuth path too', () => {
    // A Google sign-in never reaches the credentials provider, so the signIn
    // callback is the only shared hook. Without this, deleting an account and
    // pressing "Continue with Google" lets you straight back in.
    const signIn = /async signIn\([^]*?\n {4}\}/.exec(auth)?.[0] ?? ''
    expect(signIn, 'signIn callback must check deletedAt').toContain('deletedAt')
    expect(signIn, 'signIn callback must be able to deny').toContain('return false')
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
