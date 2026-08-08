import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'
import { renderEmail, codeBlock, escapeHtml } from '@/lib/email-template'
import { getTranslator } from '@/lib/i18n/translate'
import { LOCALES } from '@/lib/i18n/locales'

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
