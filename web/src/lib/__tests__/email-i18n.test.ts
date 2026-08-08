import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'
import { renderEmail, codeBlock, escapeHtml } from '@/lib/email-template'
import { getTranslator } from '@/lib/i18n/translate'
import { LOCALES } from '@/lib/i18n/locales'
import { emailBaseUrl } from '@/lib/email-url'

/**
 * Emails have to follow the recipient's language, and this is the easiest place
 * in the app for that to quietly stop being true: the senders run outside a
 * request, so nothing in the UI reveals a regression — the user just gets an
 * English email and never mentions it.
 */

const LIB = join(process.cwd(), 'src/lib')

describe('email localisation', () => {
  it('renders every locale with the matching lang attribute', () => {
    // Gmail offers to translate a message based on this. Left at "en", an Uzbek
    // email gets a "translate to Uzbek?" banner over Uzbek text.
    for (const locale of LOCALES) {
      const t = getTranslator(locale)
      const html = renderEmail({
        locale,
        title: t('email.verify.title'),
        body: `<p>${escapeHtml(t('email.verify.lead'))}</p>`,
      })
      expect(html).toContain(`<html lang="${locale}">`)
    }
  })

  it('leaves no unresolved keys in a rendered email', () => {
    for (const locale of LOCALES) {
      const t = getTranslator(locale)
      const html = renderEmail({
        locale,
        title: t('email.verify.title'),
        eyebrow: t('email.verify.eyebrow'),
        preheader: t('email.verify.preheader', { code: '123456' }),
        body: `${escapeHtml(t('email.verify.lead'))}${codeBlock('123456', t('email.verify.expires'))}`,
        footerNote: t('email.footerAuto'),
      })
      // translate() returns the key itself when it is missing, so a stray
      // "email.verify.lead" in the output is the tell.
      const body = html.replace(/<!--[\s\S]*?-->/g, '')
      expect(body, `unresolved key in ${locale}`).not.toMatch(/email\.[a-z]+\.[a-zA-Z]+/)
    }
  })

  it('substitutes the code into the preheader', () => {
    // The preheader is the inbox preview. A literal {code} there is the most
    // visible possible place for an interpolation bug.
    for (const locale of LOCALES) {
      const line = getTranslator(locale)('email.verify.preheader', { code: '482913' })
      expect(line).toContain('482913')
      expect(line).not.toContain('{code}')
    }
  })

  it('translates every email key into Uzbek', () => {
    const emailKeys = Object.keys(en).filter(k => k.startsWith('email.'))
    expect(emailKeys.length).toBeGreaterThan(20)

    const missing = emailKeys.filter(k => !(k in uz))
    expect(missing).toEqual([])

    // An email string identical in both languages is almost certainly one that
    // was added to en.json and never translated.
    const identical = emailKeys.filter(
      k => (en as Record<string, string>)[k] === (uz as Record<string, string>)[k]
    )
    expect(identical).toEqual(['email.footerRights']) // "© {year} Daily Priority"
  })

  it('gives each flow its own copy, not a neighbour’s', () => {
    // The bug this pins: sign-up called the sender in verification-code.ts,
    // which was rendering `email.verify.*` — the password-reset copy. A new
    // user's first email from us announced that their password was being reset.
    //
    // Nothing in the app surfaces that; it is only visible in an inbox. So the
    // mapping is asserted here rather than trusted.
    const flows: Array<[file: string, namespace: string]> = [
      ['src/lib/verification-code.ts', 'email.signup'], // sign-up code
      ['src/lib/email-verification.ts', 'email.confirm'], // confirmation link
    ]

    for (const [file, ns] of flows) {
      const src = readFileSync(join(process.cwd(), file), 'utf8')
      expect(src, `${file} should use ${ns}.*`).toContain(`${ns}.subject`)
      // And must not reach for another flow's headline copy.
      for (const other of ['email.verify.subject', 'email.changed.subject']) {
        expect(src, `${file} must not use ${other}`).not.toContain(other)
      }
    }

    // The three two-factor situations are different messages: setting it up,
    // signing in, and recovering access. One shared set meant a recovery code
    // arrived described as setting two-factor up.
    const email = readFileSync(join(process.cwd(), 'src/lib/email.ts'), 'utf8')
    for (const ns of ['email.twofaSetup', 'email.twofactor', 'email.twofaRecover']) {
      expect(email, `sendTwoFactorEmail must be able to render ${ns}`).toContain(ns)
    }
    expect(email, 'the recovery variant must be reachable').toMatch(/'enable' \| 'login' \| 'recovery'/)

    const recovery = readFileSync(
      join(process.cwd(), 'src/app/api/auth/2fa/recovery/route.ts'),
      'utf8'
    )
    expect(recovery, 'recovery must not send itself as a setup email').toContain("'recovery'")
  })

  it('routes every sender through the shared template', () => {
    // Three senders used to build their own full HTML document. That is how the
    // header drifted, and how two of them ended up unlocalised — a hand-rolled
    // template has nowhere to pass a locale.
    const senders = readdirSync(LIB)
      .filter(f => /^(email|email-verification|verification-code)\.ts$/.test(f))
      .map(f => ({ file: f, src: readFileSync(join(LIB, f), 'utf8') }))

    expect(senders.length).toBe(3)

    for (const { file, src } of senders) {
      expect(src, `${file} must use renderEmail`).toContain('renderEmail')
      expect(
        /const html = `\s*<!DOCTYPE html>/i.test(src),
        `${file} still hand-rolls an HTML document`
      ).toBe(false)
      expect(src, `${file} must resolve the recipient's locale`).toMatch(
        /forRecipient|getLocaleForEmail/
      )
    }
  })
})

describe('email URLs', () => {
  const KEYS = [
    'NODE_ENV',
    'EMAIL_BASE_URL',
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXTAUTH_URL',
    'VERCEL_PROJECT_PRODUCTION_URL',
  ] as const

  /** Run with only the given vars set, then restore the environment. */
  function withEnv(env: Record<string, string>, fn: () => void) {
    const saved: Record<string, string | undefined> = {}
    for (const k of KEYS) {
      saved[k] = process.env[k]
      delete process.env[k]
    }
    Object.assign(process.env, env)
    try {
      fn()
    } finally {
      for (const k of KEYS) {
        if (saved[k] === undefined) delete process.env[k]
        else process.env[k] = saved[k]
      }
    }
  }

  it('never puts a loopback origin in a production email', () => {
    // The reported bug: NEXT_PUBLIC_APP_URL and NEXTAUTH_URL were both left at
    // http://localhost:3000, so the footer link read "localhost:3000" and the
    // header icon never loaded. An email is read on another device, so a
    // loopback origin is unreachable by definition.
    withEnv(
      {
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NEXTAUTH_URL: 'http://127.0.0.1:3000',
      },
      () => {
        const url = emailBaseUrl()
        expect(url).not.toMatch(/localhost|127\.0\.0\.1/)
        expect(url).toMatch(/^https:\/\//)
      }
    )
  })

  it('prefers an explicitly configured origin', () => {
    withEnv({ NODE_ENV: 'production', NEXT_PUBLIC_BASE_URL: 'https://dailypriority.uz/' }, () => {
      // Trailing slash trimmed, or every URL built from it doubles the slash.
      expect(emailBaseUrl()).toBe('https://dailypriority.uz')
    })
  })

  it('still allows localhost while developing', () => {
    // In development you are the recipient, so a local origin is the useful one.
    withEnv({ NODE_ENV: 'development', NEXT_PUBLIC_APP_URL: 'http://localhost:3000' }, () => {
      expect(emailBaseUrl()).toBe('http://localhost:3000')
    })
  })

  it('renders the header icon and footer link from that origin', () => {
    withEnv({ NODE_ENV: 'production', NEXT_PUBLIC_BASE_URL: 'https://example.test' }, () => {
      const html = renderEmail({ title: 'x', body: '<p>y</p>' })
      expect(html).toContain('https://example.test/icon-192.png')
      expect(html).not.toMatch(/localhost/)
    })
  })
})
