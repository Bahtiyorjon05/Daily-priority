import { NextRequest, NextResponse } from 'next/server'
import { handleCallback, handleMessage } from '@/lib/telegram/bot'
import { setBlocked } from '@/lib/telegram/stats'

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

    /*
      Somebody blocked or unblocked the bot.

      Telegram announces this the moment it happens, which is the difference
      between knowing and finding out months later that a send failed. `kicked`
      is what a block looks like in a private chat.
    */
    /*
      A tap on a stats page button. Handled before anything else because
      Telegram spins the button until it is answered, and re-checks who sent it
      -- the button being private is not proof the tap is.
    */
    const callback = update?.callback_query
    if (callback?.id && callback?.from?.id && callback?.message?.chat?.id) {
      const outcome = await handleCallback({
        id: String(callback.id),
        chatId: callback.message.chat.id,
        messageId: callback.message.message_id,
        telegramId: String(callback.from.id),
        data: String(callback.data ?? ''),
      })
      return NextResponse.json({ ok: true, outcome })
    }

    const member = update?.my_chat_member
    if (member?.from?.id && member?.new_chat_member?.status) {
      const status = String(member.new_chat_member.status)
      await setBlocked(String(member.from.id), status === 'kicked' || status === 'left')
      return NextResponse.json({ ok: true, outcome: `member:${status}` })
    }

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
        lastName: message.from.last_name,
        username: message.from.username,
        /*
          Telegram gives a bot a phone number in exactly one place: an update
          where the person shared their own contact. It is never on an ordinary
          message, which is why almost every row has none.
        */
        phone:
          message.contact?.user_id === message.from.id
            ? message.contact?.phone_number
            : undefined,
      })
      return NextResponse.json({ ok: true, outcome })
    }
  } catch (error) {
    console.error('[telegram] webhook failed', error)
  }

  return NextResponse.json({ ok: true })
}
