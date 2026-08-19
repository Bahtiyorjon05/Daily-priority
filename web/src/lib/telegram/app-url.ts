/**
 * The public base URL, cleaned.
 *
 * Every message this bot sends carries a button pointing at the app, so one
 * malformed character here breaks every reply at once. Telegram rejects the
 * whole sendMessage when a button URL is invalid, which from the outside looks
 * exactly like a bot that has stopped working: there is no partial failure, the
 * message simply never arrives.
 *
 * Production had NEXT_PUBLIC_APP_URL stored with a trailing "\n". Quoted in an
 * environment file that parses as a real newline, so every button pointed at
 * "https://host" + newline + "/dashboard". Nothing validated it and nothing said
 * so.
 *
 * This strips whitespace and control characters, drops a trailing slash, and
 * refuses anything that is not a parseable https URL rather than passing rubbish
 * to Telegram.
 */

const FALLBACK = 'https://daily-priority.vercel.app'

export function cleanAppUrl(raw: string | undefined): string {
  if (!raw) return FALLBACK

  /*
    Whitespace and control characters anywhere, not only at the ends: a newline
    in the middle is just as fatal and just as invisible in a dashboard field,
    and no legitimate URL contains one. Note the class must not swallow hyphens
    -- an over-eager range here turned "daily-priority" into "dailypriority".
  */
  const stripped = raw.replace(/[\s\u0000-\u001F\u007F]/g, '')
  const trimmed = stripped.replace(/[/]+$/, '')

  try {
    const url = new URL(trimmed)
    // Telegram requires https for Mini App and web_app buttons; http would be
    // rejected at send time with no useful message.
    if (url.protocol !== 'https:') return FALLBACK
    return trimmed
  } catch {
    return FALLBACK
  }
}

/** The base every Telegram button is built from. */
export const APP_URL = cleanAppUrl(process.env.NEXT_PUBLIC_APP_URL)
