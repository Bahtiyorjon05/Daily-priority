import { NextRequest, NextResponse } from 'next/server'
import { handleMessage } from '@/lib/telegram/bot'

/**
 * Where Telegram delivers updates.
 *
 * A thin shell on purpose: verify, dispatch, answer 200. All the behaviour lives
 * in `@/lib/telegram/bot`, which can then be tested without an HTTP layer.
 *
 * Two things this route must get right:
 *
 *  - The URL is public and guessable, so the secret header is the only thing
 *    proving an update came from Telegram. Without it anyone could post a fake
 *    `/reminders` for someone else's chat id.
 *  - It answers 200 to everything it managed to read. Telegram retries any
 *    non-2xx, so a 500 on one malformed update becomes that update arriving
 *    forever. Failures are logged, not returned.
 */

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET
  if (!expected) {
    console.error('[telegram] TELEGRAM_WEBHOOK_SECRET is not set; refusing every update')
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  /*
    Telegram sends the secret set at registration time in this header. A plain
    !== is fine: it is a fixed-length constant we chose, and an attacker learns
    nothing from the timing that they do not already know from the length.
  */
  if (request.headers.get('x-telegram-bot-api-secret-token') !== expected) {
    // 401 rather than 404: this is a real endpoint refusing a bad caller, and
    // Telegram will not be the one seeing it.
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    const update = await request.json().catch(() => null)

    const message = update?.message ?? update?.edited_message

    // Anything else (joins, channel posts) is acknowledged and ignored, so
    // Telegram stops resending it.
    if (message?.text && message?.chat?.id && message?.from?.id) {
      /*
        The outcome comes back in the response body.

        Telegram ignores it, and the endpoint already requires the secret header,
        so it costs nothing -- but it is the difference between "the bot is
        broken" and one curl that says exactly which step failed. This was added
        after every reply silently failed to send and the only observable symptom
        was a perfectly healthy 200.
      */
      const outcome = await handleMessage({
        chatId: message.chat.id,
        telegramId: String(message.from.id),
        text: String(message.text),
        languageCode: message.from.language_code,
        firstName: message.from.first_name,
      })
      return NextResponse.json({ ok: true, outcome })
    }
  } catch (error) {
    console.error('[telegram] webhook failed', error)
  }

  return NextResponse.json({ ok: true })
}
