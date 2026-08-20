import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  resolveLocale,
  normalizeLocale,
  localeFromAcceptLanguage,
} from '@/lib/i18n/locales'

/**
 * The app opens in Uzbek.
 *
 * Every user is in Uzbekistan, and English was the default purely because it is
 * the usual one — so the entire product opened in the wrong language for
 * everybody and asked each of them to go and change it. A default is a guess,
 * and this is the guess that is right almost every time.
 *
 * What must not break: an explicit choice still wins, and it wins forever.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

describe('the default language', () => {
  it('is Uzbek', () => {
    expect(DEFAULT_LOCALE).toBe('uz')
  })

  it('is what a visitor with no signal gets', () => {
    expect(resolveLocale({})).toBe('uz')
    expect(resolveLocale({ acceptLanguage: null })).toBe('uz')
    expect(resolveLocale({ acceptLanguage: 'de,fr;q=0.8' })).toBe('uz')
    expect(normalizeLocale(undefined)).toBe('uz')
    expect(normalizeLocale('klingon')).toBe('uz')
  })

  it('treats a Russian phone as a vote for Uzbek', () => {
    /*
      A great many phones in Uzbekistan run Russian. Uzbek is far closer for that
      reader than English, and without this they land on English purely because
      `ru` is not one of the two locales this app ships.
    */
    expect(localeFromAcceptLanguage('ru-RU,ru;q=0.9')).toBe('uz')
    expect(resolveLocale({ acceptLanguage: 'ru-RU,ru;q=0.9,en;q=0.5' })).toBe('uz')
  })

  it('still honours an explicit English browser', () => {
    // The default is a guess; a stated preference is not.
    expect(localeFromAcceptLanguage('en-GB,en;q=0.9')).toBe('en')
    expect(resolveLocale({ acceptLanguage: 'en-US,en;q=0.9' })).toBe('en')
  })

  it('lets a choice beat everything, forever', () => {
    /*
      The whole point of changing a default is that it must stay overridable.
      Stored preference beats cookie beats header, and either beats the default.
    */
    expect(resolveLocale({ cookie: 'en' })).toBe('en')
    expect(resolveLocale({ stored: 'en', cookie: 'uz' })).toBe('en')
    expect(resolveLocale({ stored: 'en', acceptLanguage: 'ru-RU' })).toBe('en')
    expect(resolveLocale({ cookie: 'en', acceptLanguage: 'ru-RU' })).toBe('en')
  })

  it('agrees with the bot', () => {
    // Two defaults that disagree would give somebody an Uzbek chat and an
    // English app, or the reverse.
    const bot = read('src/lib/telegram/bot.ts')
    expect(bot).toMatch(/if \(!code\) return 'uz'/)
  })
})

describe('a telegram account needs no password', () => {
  it('is exempt from the set-password gate', () => {
    /*
      Telegram IS the credential: every sign-in re-verifies a blob signed with
      the bot token. Demanding a password bounced the person to /set-password
      before they saw the app, and made every API call answer 403 -- including
      the one that links their Telegram account, so they could not get out of
      the loop either.
    */
    const auth = read('src/lib/auth.ts')
    expect(auth).toMatch(/else if \(dbUser\.telegramId\) \{[\s\S]*?needsPasswordSetup = false/)
    /*
      And the flag is decided from a field the query actually selects. Without
      this the branch above is dead code that always sees `undefined`, which
      looks correct and behaves exactly like the bug.
    */
    // Anchored on `onboardedAt`, which only the JWT-refresh select carries --
    // `mustResetPassword` appears first in the credentials authorize query,
    // which does not decide this flag.
    const start = auth.indexOf('onboardedAt: true')
    const selectBlock = auth.slice(start, auth.indexOf('})', start))
    expect(selectBlock).toMatch(/telegramId: true/)
  })

  it('still requires one from everybody else', () => {
    const auth = read('src/lib/auth.ts')
    expect(auth).toMatch(/token\.needsPasswordSetup = true/)
  })
})
