import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Password recording.
 *
 * This app's admin console shows passwords: a reversible AES-256-GCM copy is
 * kept alongside the one-way bcrypt hash. History extends that to the past, so
 * the console can show what a password was before it changed.
 *
 * That is a deliberate product decision and a real liability — a database dump
 * plus PASSWORD_VAULT_KEY exposes every password every user has ever set, and
 * most people reuse them. These checks exist because the failure modes are all
 * silent: a write site that forgets to record, a vault failure that blocks a
 * login, or an entry point that bypasses the shared helper and drifts.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (src: string) =>
  src.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const helper = read('src/lib/password-record.ts')
const schema = read('prisma/schema.prisma')

/** Every route that writes a user's password. */
const WRITE_SITES = [
  'src/app/api/auth/register/route.ts',
  'src/app/api/auth/reset-password/route.ts',
  'src/app/api/auth/change-password/route.ts',
  'src/app/api/auth/set-password/route.ts',
]

describe('password history', () => {
  it('models history as its own table, cascading with the user', () => {
    expect(schema).toMatch(/model PasswordHistory \{/)
    // Deleting a user must not leave their passwords behind. Note this is a
    // HARD cascade — account deletion is soft, so the row survives and so does
    // its history; only a genuine row deletion clears it.
    expect(schema).toMatch(/onDelete: Cascade/)
    // Queried as "this user's history, newest first" on every read.
    expect(schema).toMatch(/@@index\(\[userId, createdAt\]\)/)
  })

  it('records from every place a password is written', () => {
    // A route that hashes a new password but never records it leaves the admin
    // console showing a stale one, with nothing to indicate it is stale.
    for (const site of WRITE_SITES) {
      const src = strip(read(site))
      expect(src, `${site} must call recordPassword`).toMatch(/await recordPassword\(/)
    }
    // And the credentials sign-in, which is what keeps the current copy fresh
    // for people who never change their password.
    expect(strip(read('src/lib/auth.ts'))).toMatch(/await recordPassword\(user\.id, credentials\.password, 'signin'\)/)
  })

  it('never lets a vault failure break authentication', () => {
    // The vault is a convenience for the admin console. If the key is missing
    // or the write fails, signing in and resetting must still work.
    expect(helper, 'missing key must degrade quietly').toMatch(/if \(!passwordEnc\) return/)
    expect(helper, 'writes must be wrapped').toMatch(/try \{/)
    expect(helper).toMatch(/catch \(error\)/)
    // No rethrow — the catch has to swallow.
    const catchBody = /catch \(error\) \{([^]*?)\}/.exec(helper)?.[1] ?? ''
    expect(catchBody, 'must not rethrow into a request path').not.toMatch(/throw/)
  })

  it('keeps the current copy and the history in one transaction', () => {
    // A refreshed `passwordEnc` with no matching history row, or the reverse,
    // makes the timeline lie about what the current password is.
    expect(helper).toMatch(/\$transaction/)
  })

  it('does not stack an identical entry on every login', () => {
    // `signin` fires on each successful authentication. Appending there
    // unconditionally would bury the real changes under hundreds of duplicates.
    expect(helper).toMatch(/const isDeliberate = source !== 'signin'/)
    expect(helper).toMatch(/isDeliberate \|\| !current\?\.passwordEnc/)
  })

  it('records what caused each entry', () => {
    // A bare list of passwords says nothing; "reset on this date" does.
    expect(helper).toMatch(/export type PasswordSource =/)
    for (const source of ['signup', 'signin', 'reset', 'change', 'setup']) {
      expect(helper, `${source} missing from the union`).toContain(`'${source}'`)
    }
  })

  it('shows the history in the admin console, newest first', () => {
    const api = strip(read('src/app/api/admin/user/[id]/route.ts'))
    // Scoped to this query's own block — every other findMany in the file
    // shares the same orderBy, so an unscoped match proved nothing.
    const start = api.indexOf('prisma.passwordHistory.findMany')
    expect(start, 'passwordHistory query missing').toBeGreaterThan(-1)
    const query = api.slice(start, api.indexOf('}),', start))
    expect(query, 'newest first').toMatch(/orderBy: \{ createdAt: 'desc' \}/)
    // Decrypted for display — an encrypted blob in the UI is useless.
    expect(api).toMatch(/password: decryptPassword\(entry\.passwordEnc\)/)

    const view = strip(read('src/app/admin/UsersView.tsx'))
    expect(view).toMatch(/passwordHistory\.map/)
    // Revealed per row. A list of someone's passwords sitting open on screen is
    // worse than one.
    expect(view).toMatch(/revealed\.has\(entry\.id\)/)
  })

  it('says so when an entry cannot be decrypted', () => {
    // Rotating PASSWORD_VAULT_KEY makes older entries unreadable. Rendering an
    // empty string there would look like an empty password.
    const view = strip(read('src/app/admin/UsersView.tsx'))
    expect(view).toMatch(/admin\.pwUnreadable/)
  })
})
