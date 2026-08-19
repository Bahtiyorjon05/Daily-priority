/**
 * Talking to the Bot API.
 *
 * Server-only: every call carries the bot token, which must never reach a
 * browser. Nothing here throws on a Telegram-level failure -- a bot that cannot
 * send a message must not take down the request that triggered it, and the
 * reminders cron in particular has to keep going for everyone else when one
 * chat is unreachable.
 */

const API = 'https://api.telegram.org'

export type TelegramResult<T> = { ok: true; result: T } | { ok: false; error: string }

/** Long enough for a slow round trip, short enough that a hung call cannot hold
 *  a serverless function open until it is killed. */
const TIMEOUT_MS = 10_000

export async function callTelegram<T = unknown>(
  method: string,
  payload: Record<string, unknown> = {},
  token = process.env.TELEGRAM_BOT_TOKEN
): Promise<TelegramResult<T>> {
  if (!token) return { ok: false, error: 'TELEGRAM_BOT_TOKEN is not set' }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: 'no-store',
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.description ?? `HTTP ${res.status}` }
    }
    return { ok: true, result: json.result as T }
  } catch (error) {
    // Includes the abort. The caller decides whether that matters.
    return { ok: false, error: error instanceof Error ? error.message : 'request failed' }
  } finally {
    clearTimeout(timer)
  }
}

export type InlineKeyboard = { text: string; url?: string; web_app?: { url: string }; callback_data?: string }[][]

export async function sendMessage(
  chatId: number | string,
  text: string,
  options: { keyboard?: InlineKeyboard; silent?: boolean } = {}
) {
  return callTelegram('sendMessage', {
    chat_id: chatId,
    text,
    // HTML rather than Markdown: apostrophes and underscores are everywhere in
    // both languages this app speaks, and Markdown treats them as syntax.
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    disable_notification: options.silent ?? false,
    ...(options.keyboard ? { reply_markup: { inline_keyboard: options.keyboard } } : {}),
  })
}

export async function answerCallbackQuery(id: string, text?: string) {
  return callTelegram('answerCallbackQuery', { callback_query_id: id, ...(text ? { text } : {}) })
}

/** Escape text for `parse_mode: HTML`. Names come from user profiles and can
 *  contain anything at all. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
