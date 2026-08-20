import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { miniAppUrl, openKeyboard, mainKeyboard, prayersMessage } from '@/lib/telegram/messages'

/**
 * How the Mini App is entered, and what the bot answers with.
 *
 * The entry bug, which took days to find and explains every symptom:
 *
 *   Telegram appends `initData` to the Mini App URL as a FRAGMENT. A fragment
 *   does not survive a server-side redirect inside Telegram's webview, and
 *   `/dashboard` is behind auth — so every open went 307 to /signin and the
 *   sign-in blob was gone before a line of our JavaScript ran. The app looked
 *   perfect, the person was asked to log in, and the bot never learned who they
 *   were. Nothing in any log said a word.
 *
 * The fix is structural: one public route that never redirects.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) => s.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '').replace(/^\s*\/\/.*$/gm, '')

const middleware = strip(read('src/middleware.ts'))
const entry = strip(read('src/app/tg/page.tsx'))
const setup = strip(read('scripts/telegram-setup.ts'))
const bot = strip(read('src/lib/telegram/bot.ts'))

describe('the mini app entry route', () => {
  it('is public, so nothing can redirect the fragment away', () => {
    expect(middleware).toMatch(/'\/tg'/)
  })

  it('is where every Mini App button points', () => {
    /*
      A single button still aimed at a protected path re-creates the bug for
      whichever feature it opens, and only for that one — the worst kind of
      partial fix.
    */
    expect(miniAppUrl('/quran')).toContain('/tg?to=')
    expect(miniAppUrl('/quran')).toContain(encodeURIComponent('/quran'))

    const buttons = [
      ...openKeyboard('uz').flat(),
      ...openKeyboard('en', '/habits').flat(),
      ...mainKeyboard('uz').flat(),
      ...mainKeyboard('en').flat(),
    ].filter((b) => b.web_app)

    expect(buttons.length).toBeGreaterThan(0)
    for (const b of buttons) {
      expect(b.web_app!.url, `${b.text} bypasses the entry route`).toContain('/tg?to=')
    }
  })

  it('is what the menu button opens', () => {
    expect(setup).toMatch(/\/tg\?to=/)
    expect(setup).not.toMatch(/web_app: \{ url: `\$\{APP_URL\}\/dashboard` \}/)
  })

  it('only forwards to somewhere on this site', () => {
    // `to` arrives in a URL anyone can craft, and an open redirect out of a
    // Telegram Mini App is a phishing primitive.
    expect(entry).toMatch(/raw\.startsWith\('\/'\) && !raw\.startsWith\('\/\/'\)/)
  })

  it('does not sit on a spinner when there is nothing to sign in with', () => {
    // Opened outside Telegram it must hand over to the normal sign-in page.
    expect(entry).toMatch(/if \(!app\?\.initData\)/)
    expect(entry).toMatch(/router\.replace\(`\/signin\?callbackUrl=/)
  })

  it('shows the reason when sign-in fails', () => {
    // Every previous version of this failed silently, and silence is what cost
    // the time.
    expect(entry).toMatch(/setError\(/)
    expect(entry).toMatch(/console\.error\('\[tg\] signIn failed'/)
  })
})

describe('prayer times in the chat', () => {
  const rows = [
    { name: 'fajr', time: '04:12', done: true, next: false },
    { name: 'dhuhr', time: '12:30', done: false, next: true },
    { name: 'asr', time: '17:16', done: false, next: false },
    { name: 'maghrib', time: '19:02', done: false, next: false },
    { name: 'isha', time: '20:31', done: false, next: false },
  ]

  it('prints the actual times', () => {
    /*
      This used to be a heading and a button, which is not an answer to "what
      time is Asr" -- it is a link to something that knows.
    */
    const { text } = prayersMessage(rows, 'en')
    for (const t of ['04:12', '12:30', '17:16', '19:02', '20:31']) {
      expect(text).toContain(t)
    }
  })

  it('uses the Uzbek prayer names', () => {
    // Bomdod and Xufton, not transliterated Arabic — the same names the app uses.
    const { text } = prayersMessage(rows, 'uz')
    expect(text).toContain('Bomdod')
    expect(text).toContain('Peshin')
    expect(text).toContain('Shom')
    expect(text).toContain('Xufton')
  })

  it('marks what is done and what is next', () => {
    const { text } = prayersMessage(rows, 'en')
    expect(text).toMatch(/✅ Fajr/)
    expect(text).toMatch(/➡️ <b>Dhuhr<\/b>/)
    expect(text).toContain('1/5')
  })

  it('says it needs a location rather than inventing times', () => {
    /*
      Times for the wrong city are worse than none: this is a prayer app and a
      wrong Asr is not a cosmetic bug.
    */
    const { text } = prayersMessage(null, 'uz')
    expect(text).toMatch(/joylashuv/i)
    expect(text).not.toMatch(/\d\d:\d\d/)
  })

  it('is answered from the stored row, not a fresh calculation', () => {
    // The bot must never show a different Asr from the screen: same row, same
    // madhab, same city.
    const actions = strip(read('src/lib/telegram/actions.ts'))
    expect(actions).toMatch(/prisma\.prayerTime\.findFirst/)
    expect(bot).toMatch(/prayersMessage\(await todayPrayers\(user\.id\), lang\)/)
  })
})
