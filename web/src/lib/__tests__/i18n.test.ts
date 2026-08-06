import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  localeFromAcceptLanguage,
  normalizeLocale,
  resolveLocale,
} from '@/lib/i18n/locales'
import { getMessages, getTranslator, translate } from '@/lib/i18n/translate'

describe('locale identification', () => {
  it('accepts only supported locales', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('uz')).toBe(true)
    expect(isLocale('ru')).toBe(false)
    expect(isLocale(null)).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })

  it('strips region and script subtags', () => {
    expect(normalizeLocale('uz-UZ')).toBe('uz')
    expect(normalizeLocale('en_GB')).toBe('en')
    expect(normalizeLocale('  UZ  ')).toBe('uz')
    // Same language, different script — closer than falling back to English.
    expect(normalizeLocale('uz-Cyrl-UZ')).toBe('uz')
  })

  it('falls back to the default for anything unusable', () => {
    expect(normalizeLocale('ru')).toBe(DEFAULT_LOCALE)
    expect(normalizeLocale('')).toBe(DEFAULT_LOCALE)
    expect(normalizeLocale(42)).toBe(DEFAULT_LOCALE)
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE)
  })
})

describe('Accept-Language negotiation', () => {
  it('honours quality weights over document order', () => {
    expect(localeFromAcceptLanguage('en;q=0.3, uz;q=0.9')).toBe('uz')
    expect(localeFromAcceptLanguage('uz;q=0.2, en;q=0.8')).toBe('en')
  })

  it('treats a missing q as the highest preference', () => {
    expect(localeFromAcceptLanguage('uz-UZ, en;q=0.5')).toBe('uz')
  })

  it('skips languages it cannot serve', () => {
    expect(localeFromAcceptLanguage('ru-RU, de;q=0.8, uz;q=0.1')).toBe('uz')
    expect(localeFromAcceptLanguage('ru-RU, de-DE')).toBeNull()
  })

  it('ignores the wildcard rather than treating it as a match', () => {
    expect(localeFromAcceptLanguage('*')).toBeNull()
    expect(localeFromAcceptLanguage('*, uz;q=0.4')).toBe('uz')
  })

  it('never ranks a q=0 language, which means "not acceptable"', () => {
    expect(localeFromAcceptLanguage('uz;q=0, en;q=0.5')).toBe('en')
  })

  it('handles absent or empty headers', () => {
    expect(localeFromAcceptLanguage(null)).toBeNull()
    expect(localeFromAcceptLanguage('')).toBeNull()
  })
})

describe('resolveLocale precedence', () => {
  it('prefers the stored account preference so it follows across devices', () => {
    expect(resolveLocale({ stored: 'en', cookie: 'uz', acceptLanguage: 'uz' })).toBe('en')
  })

  it('uses the cookie when there is no stored preference', () => {
    expect(resolveLocale({ stored: null, cookie: 'uz', acceptLanguage: 'en' })).toBe('uz')
  })

  it('only consults the header when nothing is known', () => {
    expect(resolveLocale({ acceptLanguage: 'uz-UZ,uz;q=0.9' })).toBe('uz')
  })

  it('ignores a stored value that is no longer supported', () => {
    expect(resolveLocale({ stored: 'ru', cookie: 'uz' })).toBe('uz')
  })

  it('falls back to the default with no signals at all', () => {
    expect(resolveLocale({})).toBe(DEFAULT_LOCALE)
  })
})

describe('translate', () => {
  it('returns the string for the requested locale', () => {
    expect(translate('en', 'nav.prayers')).toBe('Prayers')
    expect(translate('uz', 'nav.prayers')).toBe('Namozlar')
  })

  it('substitutes named placeholders', () => {
    expect(translate('en', 'error.passwordTooShort', { count: 8 })).toBe(
      'Password must be at least 8 characters'
    )
    expect(translate('uz', 'error.passwordTooShort', { count: 8 })).toContain('8')
  })

  it('leaves an unsupplied placeholder literal instead of blanking it', () => {
    // A visible {language} is a bug report; a silent gap ships to production.
    expect(translate('en', 'locale.switchTo')).toBe('Switch to {language}')
    expect(translate('en', 'locale.switchTo', { wrong: 'x' })).toBe('Switch to {language}')
  })

  it('returns the key itself for an unknown string, so the gap is obvious', () => {
    expect(translate('en', 'does.not.exist')).toBe('does.not.exist')
  })

  it('falls back to English rather than showing a key', () => {
    // `getMessages` hands back the live dictionary, so the original has to be
    // captured before the delete — reading it back in `finally` restores
    // `undefined` and quietly corrupts every test that runs afterwards.
    const dict = getMessages('uz') as Record<string, string>
    const original = dict['common.save']
    delete dict['common.save']
    try {
      expect(translate('uz', 'common.save')).toBe('Save')
    } finally {
      dict['common.save'] = original
    }
  })

  it('binds a locale via getTranslator', () => {
    const t = getTranslator('uz')
    expect(t('common.cancel')).toBe('Bekor qilish')
  })
})

describe('dictionary parity', () => {
  const enKeys = Object.keys(en).sort()
  const uzKeys = Object.keys(uz).sort()

  it('translates every English key', () => {
    expect(enKeys.filter(k => !uzKeys.includes(k))).toEqual([])
  })

  it('has no orphaned Uzbek keys', () => {
    expect(uzKeys.filter(k => !enKeys.includes(k))).toEqual([])
  })

  it('uses the same placeholders in both languages', () => {
    const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort()
    for (const key of enKeys) {
      expect(
        placeholders((uz as Record<string, string>)[key]),
        `placeholder mismatch in "${key}"`
      ).toEqual(placeholders((en as Record<string, string>)[key]))
    }
  })

  it('leaves nothing untranslated or empty', () => {
    const identical: string[] = []
    for (const key of enKeys) {
      const e = (en as Record<string, string>)[key]
      const u = (uz as Record<string, string>)[key]
      expect(u.trim(), `"${key}" is empty in uz`).not.toBe('')
      if (e === u) identical.push(key)
    }
    // Proper nouns, keyboard keys and shared loanwords legitimately match;
    // anything else means a line was copied across and never translated. This
    // list is meant to stay short — if a sweep adds to it, check each addition
    // is genuinely a word Uzbek borrows rather than one that got missed.
    expect(identical.sort()).toEqual([
      'auth.email', // "Email" is the same word in both
      'prayer.asr', // proper noun
      'ui.adminDailyPriority', // brand name
      'ui.dailyPriority', // brand name
      'ui.dailyPriorityV10', // brand name + version
      'ui.emailAZ', // "Email A–Z", a sort order
      'ui.enter', // keyboard key, printed on the key itself
      'ui.esc', // keyboard key
      'ui.escape', // keyboard key
      'ui.muharram', // Hijri month, same name in Uzbek
      'ui.push', // technical term, borrowed as-is
      'ui.qibla', // Arabic term, identical in Uzbek
      'ui.rajab', // Hijri month, same name in Uzbek
      'ui.safar', // Hijri month, same name in Uzbek
      'ui.shift', // keyboard key
    ])
  })

  it('covers every declared locale', () => {
    for (const locale of LOCALES) {
      expect(Object.keys(getMessages(locale)).length).toBeGreaterThan(0)
    }
  })
})
