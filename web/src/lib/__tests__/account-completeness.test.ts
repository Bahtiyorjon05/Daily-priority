import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SESSION_MAX_AGE_SECONDS } from '@/lib/auth'
import { isPlaceholderEmail, telegramPlaceholderEmail } from '@/lib/telegram/account'

/**
 * Every account has a real address and a password.
 *
 * Signing in through Telegram used to CREATE an account: `tg12345@telegram.local`
 * and no password. Wrong in three ways at once — the person could not sign in
 * anywhere else, could not recover the account, and had an address on file that
 * nothing could ever send to. Four real people ended up in that state before it
 * was found, one of them with habits and prayers already recorded, so the fix
 * had to complete those accounts rather than delete them.
 *
 * Telegram is now a fast way back INTO an account, never a way to have one
 * without the parts that make it recoverable.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const account = strip(read('src/lib/telegram/account.ts'))
const auth = strip(read('src/lib/auth.ts'))
const middleware = strip(read('src/middleware.ts'))
const setPassword = strip(read('src/app/api/auth/set-password/route.ts'))

describe('telegram signs people in, it does not sign them up', () => {
  it('has no path that creates a user', () => {
    // The whole defect in one assertion.
    expect(account).not.toMatch(/prisma\.user\.create/)
    expect(account).toMatch(/export async function findTelegramAccount/)
  })

  it('refuses the sign-in when no account is linked', () => {
    /*
      Returning a user here would be the create path by another name. Failing
      sends them to the ordinary sign-up, which is the same one the website uses.
    */
    expect(auth).toMatch(/const account = await findTelegramAccount\(verified\.user\)/)
    expect(auth).toMatch(/if \(!account\) throw new Error\('Invalid credentials'\)/)
  })

  it('no longer exempts a Telegram account from having a password', () => {
    // That exemption was correct only while Telegram could create accounts.
    expect(auth).not.toMatch(/dbUser\.telegramId\) \{[\s\S]{0,200}needsPasswordSetup = false/)
  })

  it('releases the link from a closed account', () => {
    // Otherwise a closed account squats on the Telegram id forever and the
    // person can never come back — the same trap `deletedEmail` fixed for email.
    expect(account).toMatch(/data: \{ telegramId: null \}/)
  })
})

describe('an unusable address is treated as an unfinished sign-up', () => {
  it('recognises the placeholder', () => {
    expect(telegramPlaceholderEmail('42')).toBe('tg42@telegram.local')
    expect(isPlaceholderEmail('tg42@telegram.local')).toBe(true)
    expect(isPlaceholderEmail('someone@gmail.com')).toBe(false)
    expect(isPlaceholderEmail(null)).toBe(false)
  })

  it('flags it on the session', () => {
    expect(auth).toMatch(/token\.needsRealEmail = isPlaceholderEmail\(dbUser\.email\)/)
    // Decided from a field the query actually selects, or the branch is dead
    // code that always sees `undefined`.
    const start = auth.indexOf('onboardedAt: true')
    expect(auth.slice(start, auth.indexOf('})', start))).toMatch(/email: true/)
  })

  it('gates the app on it, exactly like a missing password', () => {
    expect(middleware).toMatch(
      /customToken\.needsPasswordSetup \|\| customToken\.needsRealEmail\) && pathname !== '\/set-password'/
    )
  })

  it('lets only those accounts change their address', () => {
    /*
      This endpoint is reached with a session and nothing else. Allowing any
      account to change its email here would turn a leaked session into an
      account takeover, so the door opens only for an address that is already
      unusable.
    */
    expect(setPassword).toMatch(/if \(isPlaceholderEmail\(sanitizedEmail\)\)/)
    expect(setPassword).toMatch(/\.\.\.\(nextEmail \? \{ email: nextEmail \} : \{\}\)/)
  })

  it('will not accept another placeholder, or a taken address', () => {
    expect(setPassword).toMatch(/if \(isPlaceholderEmail\(requested\)\)/)
    /*
      Anchored on the branch, not the message. Matching the error text was
      satisfied by `if (false) { ... 'That email is already in use' }` -- the
      string survives a mutation that removes the check entirely.
    */
    expect(setPassword).toMatch(/const taken = await prisma\.user\.findUnique/)
    expect(setPassword).toMatch(/if \(taken\) \{/)
    expect(setPassword).toMatch(/status: 409/)
  })
})

describe('how long a sign-in lasts', () => {
  it('is one week, everywhere', () => {
    expect(SESSION_MAX_AGE_SECONDS).toBe(7 * 24 * 60 * 60)
    expect(auth).toMatch(/maxAge: SESSION_MAX_AGE_SECONDS/)
    /*
      Three places, and all three must agree or they contradict each other: the
      session, the JWT, and the cookie that carries it. The cookie one is the
      easiest to forget and the one whose absence looks exactly like "closing
      the tab signs you out".
    */
    expect((auth.match(/maxAge: SESSION_MAX_AGE_SECONDS/g) ?? []).length).toBe(3)
  })

  it('measures the week from signing in, not from the last visit', () => {
    /*
      `maxAge` alone is a rolling window: every rotation pushes the expiry out,
      so somebody who opens the app daily is never asked to sign in again. That
      is convenient and wrong for a shared or lost phone.
    */
    expect(auth).toMatch(/token\.loginAt = Date\.now\(\)/)
    expect(auth).toMatch(
      /Date\.now\(\) - token\.loginAt > SESSION_MAX_AGE_SECONDS \* 1000/
    )
    expect(auth).toMatch(/token\.expired = true/)
  })

  it('does not sign out everyone the moment it ships', () => {
    // Tokens issued before this existed carry no `loginAt`; they are stamped on
    // first sight rather than treated as ancient.
    expect(auth).toMatch(/if \(typeof token\.loginAt !== 'number'\) \{\s*\n\s*token\.loginAt = Date\.now\(\)/)
  })

  it('is enforced, not merely recorded', () => {
    expect(middleware).toMatch(/customToken\.expired/)
    expect(middleware).toMatch(/Session expired/)
  })

  it('keeps you signed in across a closed tab or a closed Mini App', () => {
    /*
      Nothing here may make the cookie session-scoped. Closing a tab is not a
      sign-out, and in the Mini App it is the single most common way to leave.

      Declaring `cookies` replaces the defaults NextAuth derives from
      `session.maxAge`, so the cookie needs its own `maxAge` -- without it the
      browser drops the session on close, which is exactly the bug this whole
      block exists to prevent.
    */
    expect(auth).not.toMatch(/maxAge: 0/)
    expect(auth).toMatch(/strategy: 'jwt'/)
    const cookies = auth.slice(auth.indexOf('cookies: {'))
    expect(cookies.slice(0, 600)).toMatch(/maxAge: SESSION_MAX_AGE_SECONDS/)
  })

  it('sends the session cookie inside a Telegram iframe', () => {
    /*
      The reason a signed-in person kept seeing the login page.

      NextAuth defaults to SameSite=Lax, and a Lax cookie is NOT sent on
      requests made inside a cross-site iframe -- which is what Telegram Web and
      Desktop run a Mini App in. The session existed and was never presented, so
      every open looked like a first visit.
    */
    const cookies = auth.slice(auth.indexOf('cookies: {'))
    /*
      EVERY cookie, not one of them. There are three -- session, callback url
      and CSRF -- and sign-in inside the iframe needs all three to arrive.
      Requiring the pattern to appear merely somewhere was satisfied while the
      session cookie itself had been set back to Lax.
    */
    const sameSite = cookies.match(/sameSite: /g) ?? []
    const conditional = cookies.match(/sameSite: isProduction \? 'none' : 'lax'/g) ?? []
    expect(sameSite.length).toBe(3)
    expect(conditional.length).toBe(sameSite.length)
    // SameSite=None is only honoured on a Secure cookie.
    expect((cookies.match(/secure: isProduction/g) ?? []).length).toBe(3)
    // Lax stays in development, where there is no HTTPS to make Secure work.
    expect(auth).toMatch(/const isProduction = process\.env\.NODE_ENV === 'production'/)
  })

  it('does not send an already signed-in visitor back to sign in', () => {
    /*
      /tg attempts a Telegram sign-in, which fails when that Telegram account is
      not linked to anything. Treating that failure as "not signed in" bounced
      people who plainly were.
    */
    const entry = strip(read('src/app/tg/page.tsx'))
    expect(entry).toMatch(/if \(status === 'authenticated'\)/)
    expect(entry.indexOf("status === 'authenticated'")).toBeLessThan(
      entry.indexOf("signIn('telegram'")
    )
  })
})
