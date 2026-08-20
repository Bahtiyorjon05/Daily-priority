import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { miniAppUrl } from '@/lib/telegram/bot'

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

  it('is where every Mini App link points', () => {
    /*
      One link now, where there were four keyboards' worth. It still has to go
      through /tg: a button aimed straight at a protected path re-creates the
      bug that made the Mini App impossible to sign into.
    */
    expect(miniAppUrl()).toContain('/tg?to=')
    expect(miniAppUrl('/quran')).toContain(encodeURIComponent('/quran'))

    const bot = strip(read('src/lib/telegram/bot.ts'))
    expect(bot).toMatch(/web_app: \{ url: miniAppUrl\(\) \}/)
    expect(bot).not.toMatch(/web_app: \{ url: `\$\{APP_URL\}\/dashboard` \}/)
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
