import en from '@/messages/en.json'
import uz from '@/messages/uz.json'
import { DEFAULT_LOCALE, type Locale } from './locales'

/**
 * The translation primitive, shared by every surface.
 *
 * Dictionaries are imported statically rather than fetched, so a missing key is
 * a build-time type error in `MessageKey` instead of a blank space in the UI at
 * runtime. Both files are small; splitting them per-locale would save a few KB
 * and cost us that guarantee.
 */

/** `en` is the source of truth for the key set — `uz.json` is checked against it in tests. */
export type Messages = typeof en
export type MessageKey = keyof Messages

const DICTIONARIES: Record<Locale, Record<string, string>> = { en, uz }

export function getMessages(locale: Locale): Record<string, string> {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
}

/**
 * Look up `key`, substituting `{name}` placeholders.
 *
 * Falls back through locale → English → the key itself. Returning the key is
 * deliberate: a visible `prayers.title` in the UI is an obvious bug report,
 * whereas an empty string looks like an intentionally blank label and survives
 * to production.
 */
/**
 * English text → key, built once.
 *
 * A lot of copy lives in plain modules — Hijri month names, the quote pool,
 * validation messages, API error strings. Those can't call a hook, and
 * rewriting thirty modules to carry keys would touch far more code than it's
 * worth. Looking a string up by its English value lets a render site wrap the
 * value it already has, whichever form it arrives in.
 */
const KEY_BY_ENGLISH: Record<string, string> = Object.fromEntries(
  Object.entries(en as Record<string, string>).map(([k, v]) => [v, k])
)

export function translate(
  locale: Locale,
  key: MessageKey | (string & {}),
  params?: Record<string, string | number>
): string {
  const dict = getMessages(locale)
  const fallbackKey = dict[key] === undefined ? KEY_BY_ENGLISH[key] : undefined
  const template =
    dict[key] ??
    (fallbackKey ? dict[fallbackKey] : undefined) ??
    DICTIONARIES[DEFAULT_LOCALE][key] ??
    key

  if (!params) return template

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    // An unmatched placeholder stays literal so the gap is visible rather than
    // silently collapsing into surrounding text.
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  )
}

/** Bind a locale once, for server code that translates many strings in a row. */
export function getTranslator(locale: Locale) {
  return (key: MessageKey | (string & {}), params?: Record<string, string | number>) =>
    translate(locale, key, params)
}
