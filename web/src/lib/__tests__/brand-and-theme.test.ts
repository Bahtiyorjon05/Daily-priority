import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Two failure modes that keep coming back, neither of which breaks a build.
 *
 * 1. A control that sets a background and a hover colour but no *resting* text
 *    colour. It inherits, so it looks right in one theme and vanishes in the
 *    other. This is what made "View All Prayer Times" white in light mode, and
 *    then the 6-digit sign-up code input.
 *
 * 2. A stand-in for the app icon. The install card promised a moon; the icon
 *    that lands on the home screen is the emblem. And when the emblem replaced
 *    the old tick, the service worker went on serving the tick from a cache
 *    whose name had not changed.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const exists = (p: string) => existsSync(join(process.cwd(), p))

describe('controls state their own resting colour', () => {
  it('every Button variant sets a text colour, not just a hover one', () => {
    const button = read('src/components/ui/button.tsx')
    const variants = /const variants = \{([^]*?)\n {4}\}/.exec(button)?.[1] ?? button

    for (const name of ['outline', 'ghost']) {
      const line = variants.split('\n').find((l) => l.trim().startsWith(`${name}:`))
      expect(line, `${name} variant not found`).toBeTruthy()
      // `hover:text-…` does not count: the resting state is the one that has to
      // be readable, and hover is not reachable on touch at all.
      const resting = (line ?? '').replace(/hover:[\w:/.[\]-]+/g, '')
      expect(resting, `${name} must set a resting text colour`).toMatch(/\btext-[\w-]+/)
    }
  })

  it('the base Input sets a text colour', () => {
    // Without this, callers hand-patch `text-gray-900 dark:text-white` one input
    // at a time — and the one that forgets has no fallback.
    const input = read('src/components/ui/input.tsx')
    expect(input).toMatch(/bg-background text-foreground/)
  })

  it('the sign-up code input is not left to inherit', () => {
    const form = read('src/components/auth/SignUpForm.tsx')
    const otp = form.slice(form.indexOf('maxLength={6}'), form.indexOf('{errors.code &&'))
    expect(otp, 'the 6-digit code must state its colour').toMatch(
      /text-gray-900 dark:text-white/
    )
  })
})

describe('the app icon is the real one everywhere', () => {
  const ICON = '/icon-192.png'

  it('ships every icon the manifest promises', () => {
    const manifest = JSON.parse(read('public/manifest.json')) as {
      icons: { src: string }[]
    }
    for (const { src } of manifest.icons) {
      expect(exists(`public${src}`), `${src} is declared but missing`).toBe(true)
    }
  })

  it('shows the app icon in the install prompt, not a placeholder', () => {
    // Both surfaces: the section card and the floating toast. Each previews what
    // lands on the home screen, so a generic glyph misrepresents it.
    const prompt = read('src/components/shared/InstallPrompt.tsx')
    expect((prompt.match(new RegExp(ICON, 'g')) ?? []).length).toBeGreaterThanOrEqual(2)
    expect(prompt, 'the moon stand-in should be gone').not.toMatch(/\bMoon\b/)
  })

  it('shows the app icon on the onboarding screen', () => {
    expect(read('src/app/(auth)/onboarding/page.tsx')).toContain(ICON)
  })

  it('has a service-worker cache newer than the icons it precaches', () => {
    // The trap: the icons were replaced but CACHE_NAME stayed, so `activate`
    // kept the old cache — and every installed PWA served the old tick while the
    // server had the new bytes. The name must move when precached bytes move.
    const sw = read('public/sw.js')
    const version = /const CACHE_NAME = 'daily-priority-v(\d+)'/.exec(sw)?.[1]
    expect(version, 'CACHE_NAME must carry a version').toBeTruthy()
    expect(Number(version)).toBeGreaterThanOrEqual(4)

    // Runtime cache has to move with it or the two disagree about what is valid.
    const runtime = /const RUNTIME_CACHE = 'runtime-cache-v(\d+)'/.exec(sw)?.[1]
    expect(runtime, 'both caches must share a version').toBe(version)

    // And everything precached must actually exist, or install half-fails
    // silently and the offline page is a 404.
    const assets = /const PRECACHE_ASSETS = \[([^]*?)\]/.exec(sw)?.[1] ?? ''
    for (const m of assets.matchAll(/'([^']+)'/g)) {
      const url = m[1]
      if (url.includes('.')) {
        expect(exists(`public${url}`), `precached ${url} is missing`).toBe(true)
      }
    }
  })
})

describe('the admin console shows a closed account as closed', () => {
  const view = read('src/app/admin/UsersView.tsx')

  it('says when the account was closed, not just that it was', () => {
    // `deletedAt` sat in the type, rendered nowhere.
    expect(view).toMatch(/fmtDate\(u\.deletedAt\)/)
    expect(view, 'the detail panel needs the timestamp too').toMatch(
      /fmtDateTime\(data\.user\.deletedAt\)/
    )
  })

  it('surfaces the closure on the record itself', () => {
    // Opening a closed account used to look identical to a live one.
    expect(view).toMatch(/data\.user\.deleted &&/)
    expect(view).toMatch(/deletionReason/)
  })

  it('can list closed accounts', () => {
    // Retained history reachable only by scrolling is barely retained.
    expect(view).toMatch(/key: 'deleted'/)
    expect(read('src/app/api/admin/users/route.ts')).toMatch(/filter === 'deleted'/)
  })

  it('serves the closure state from the detail endpoint', () => {
    const api = read('src/app/api/admin/user/[id]/route.ts')
    expect(api).toMatch(/deletedAt: true/)
    expect(api).toMatch(/deletionReason: true/)
    // And the real address, since `email` is a tombstone after a re-signup.
    expect(api).toMatch(/user\.deletedEmail \?\? user\.email/)
  })
})
