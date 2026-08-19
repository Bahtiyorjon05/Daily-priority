import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The app's own security headers were blocking the Mini App.
 *
 * Every Telegram feature was dead and nothing anywhere said why: no error, no
 * failed request in any log we keep, a page that loaded and behaved perfectly.
 * The database told the story — zero accounts had ever been linked, meaning the
 * bridge had never once run.
 *
 *  - `script-src 'self' 'unsafe-inline'` blocks telegram.org, so
 *    telegram-web-app.js never loaded, `window.Telegram` never existed, and
 *    there was no `initData` to sign anyone in with.
 *  - `frame-ancestors 'none'` (and `X-Frame-Options: DENY`, twice over) forbids
 *    the iframe that Telegram Web and Desktop render a Mini App inside.
 *
 * A page that works while the half that makes it a Mini App does not is the
 * hardest kind of failure to see, so it is pinned here.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const config = read('next.config.ts')
const vercel = read('vercel.json')

describe('the Mini App bridge is allowed to load', () => {
  it('permits telegram.org in script-src', () => {
    const scriptSrc = config.match(/"script-src[^"]*"/g) ?? []
    expect(scriptSrc.length, 'expected script-src directives').toBeGreaterThan(0)
    for (const directive of scriptSrc) {
      expect(directive, `"${directive}" would block the bridge`).toContain('https://telegram.org')
    }
  })

  it('permits Telegram to frame the app', () => {
    /*
      Mobile uses a webview and is unaffected, which is why this can look fine
      while every Telegram Web and Desktop user sees a blank frame.
    */
    const frameAncestors = config.match(/"frame-ancestors[^"]*"/)?.[0] ?? ''
    expect(frameAncestors).toBeTruthy()
    expect(frameAncestors).not.toContain("'none'")
    expect(frameAncestors).toContain('telegram.org')
  })

  it('does not re-block framing with X-Frame-Options', () => {
    /*
      That header has no allow-list syntax, and DENY overrides frame-ancestors in
      browsers honouring both. It was set in TWO places, so removing one would
      have fixed nothing and looked like it should have.
    */
    expect(vercel).not.toMatch(/"X-Frame-Options"/)
    const configHeaders = config.slice(config.indexOf('return ['))
    expect(configHeaders).not.toMatch(/key: 'X-Frame-Options'/)
  })

  it('still refuses everyone else', () => {
    // The loosening is Telegram's domains, not a free-for-all: this is the
    // clickjacking defence.
    const frameAncestors = config.match(/"frame-ancestors[^"]*"/)?.[0] ?? ''
    expect(frameAncestors).not.toContain('*;')
    expect(frameAncestors.trim()).not.toMatch(/frame-ancestors\s+\*/)

    const scriptSrc = config.match(/"script-src[^"]*"/g) ?? []
    for (const directive of scriptSrc) {
      expect(directive).not.toContain("'unsafe-hashes'")
      expect(directive).not.toMatch(/script-src[^;]*\*[^.]/)
    }
  })

  it('loads the bridge from the same origin the CSP allows', () => {
    // A mismatch here re-creates the bug with the allow-list looking correct.
    const layout = read('src/app/layout.tsx')
    const src = layout.match(/src="(https:\/\/telegram\.org[^"]*)"/)?.[1] ?? ''
    expect(src, 'layout must load the bridge from telegram.org').toBeTruthy()
    expect(new URL(src).origin).toBe('https://telegram.org')
  })
})

describe('the link window survives a real sign-in', () => {
  it('is long enough to read a page and type a password', () => {
    /*
      `initData` is stamped when the Mini App opens and never refreshes. Five
      minutes expired while someone was signing up, so the account was never
      linked and every bot command answered "open the app first" forever.
    */
    const initData = read('src/lib/telegram/init-data.ts')
    const value = initData.match(/MAX_AUTH_AGE_SECONDS = ([^\n]+)/)?.[1] ?? ''
    expect(value).toBeTruthy()
    // eslint-disable-next-line no-eval
    const seconds = eval(value.replace(/[^0-9*+ ]/g, '')) as number
    expect(seconds).toBeGreaterThanOrEqual(30 * 60)
    // Still bounded: a captured blob must not be a permanent key.
    expect(seconds).toBeLessThanOrEqual(24 * 60 * 60)
  })
})
