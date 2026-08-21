import {
  answerCallbackQuery, callTelegram, sendMessage, type InlineKeyboard,
} from '@/lib/telegram/api'
import { APP_URL } from '@/lib/telegram/app-url'
import {
  isAdmin, parseStatsCallback, recordChat, statsPage,
} from '@/lib/telegram/stats'

/**
 * The bot, and it does one thing: open the app.
 *
 * It used to answer /tasks, /habits, /qazo, /prayers, /quran and /streak in the
 * chat, plus inline sharing and a daily digest. All of it was removed on
 * purpose. Every one of those depended on the chat knowing which account it was
 * talking to; that link kept failing for reasons outside the bot, and the result
 * was eight commands that all replied "open the app first". Eight broken doors
 * are worse than one that works.
 *
 * So: a welcome, and a button. The Mini App is the product and this is the way
 * in. If the commands come back, they come back after the thing they depend on
 * has been reliable for a while — not before.
 */

export type Lang = 'uz' | 'en'

/** Uzbek unless the client explicitly says English — see the note in locales.ts. */
export function langOf(code?: string): Lang {
  if (!code) return 'uz'
  return code.toLowerCase().split('-')[0] === 'en' ? 'en' : 'uz'
}

type Copy = Record<Lang, string>
const pick = (c: Copy, lang: Lang) => c[lang]

/**
 * Straight to /tg, never to a page behind auth.
 *
 * Telegram appends `initData` to the URL as a fragment, and a fragment does not
 * survive a server-side redirect inside its webview — so opening /dashboard sent
 * the person to /signin with the sign-in blob already gone. /tg is public, signs
 * them in, then forwards.
 */
export const miniAppUrl = (path = '/dashboard') =>
  `${APP_URL}/tg?to=${encodeURIComponent(path)}`

const OPEN_BUTTON: Copy = { en: 'Open Daily Priority', uz: 'Daily Priority ochish' }

const openKeyboard = (lang: Lang): InlineKeyboard => [
  [{ text: pick(OPEN_BUTTON, lang), web_app: { url: miniAppUrl() } }],
]

const TEXT = {
  start: {
    en:
      '<b>Assalamu alaykum</b> \u{1F319}\n\n' +
      'Daily Priority holds your prayers, Quran reading, habits and tasks in one ' +
      'place — built around the five prayers rather than a nine-to-five.\n\n' +
      'Tap below. It opens right here inside Telegram, and you stay signed in.',
    uz:
      '<b>Assalomu alaykum</b> \u{1F319}\n\n' +
      'Daily Priority namoz, Quron o‘qish, odatlar va vazifalaringizni bir joyda ' +
      'saqlaydi — ish kuni emas, besh vaqt namoz atrofida qurilgan.\n\n' +
      'Quyidagini bosing. U shu yerda, Telegram ichida ochiladi va siz tizimda ' +
      'qolasiz.',
  } satisfies Copy,
  help: {
    en:
      'Everything lives in the app: prayer times, the Quran, habits, tasks and ' +
      'your streaks.\n\nTap below to open it.',
    uz:
      'Hammasi ilovada: namoz vaqtlari, Quron, odatlar, vazifalar va ' +
      'ketma-ketliklaringiz.\n\nOchish uchun quyidagini bosing.',
  } satisfies Copy,
}

export type IncomingMessage = {
  chatId: number | string
  telegramId: string
  text: string
  languageCode?: string
  firstName?: string
  lastName?: string
  username?: string
  /** Present only in the update where somebody shares their contact. */
  phone?: string
}

/**
 * Send, and report a failure rather than swallowing it.
 *
 * `sendMessage` returns a result instead of throwing. Discarding that result is
 * how this bot once spent days appearing dead while every reply it sent was
 * being rejected.
 */
async function reply(
  chatId: number | string,
  text: string,
  keyboard: InlineKeyboard
): Promise<string | null> {
  // An empty keyboard means no markup at all, rather than an empty grey strip
  // under the message.
  const result = await sendMessage(chatId, text, keyboard.length ? { keyboard } : {})
  if (result.ok) return null
  console.error('[telegram] send failed', result.error)
  return result.error
}

/**
 * Handle one incoming message.
 *
 * Anything at all gets the same answer, because there is only one thing to say.
 * Never throws: an unhandled error would make Telegram redeliver the same update
 * forever.
 */
export async function handleMessage(msg: IncomingMessage): Promise<string> {
  const lang = langOf(msg.languageCode)
  const command = msg.text.trim().split(/\s+/)[0].toLowerCase().split('@')[0]

  try {
    /*
      Record the person before answering them.

      Awaited rather than fired and forgotten: this runs in a serverless
      function, and work still in flight when the response is returned may simply
      not happen. It never throws, so a failed statistic cannot cost someone
      their reply.
    */
    await recordChat({
      telegramId: msg.telegramId,
      chatId: msg.chatId,
      firstName: msg.firstName,
      lastName: msg.lastName,
      username: msg.username,
      languageCode: msg.languageCode,
      phone: msg.phone,
    })

    /*
      The one command that is not for everyone.

      Deliberately absent from the command list, and for anyone else it behaves
      exactly like any other message -- the same welcome and button. A "not
      authorised" reply would confirm the command exists, which is the one thing
      it must not do.
    */
    if (command === '/adminstats') {
      /*
        Anyone else gets NOTHING. Not a refusal, not the welcome, not a
        keyboard -- no reply at all.

        A refusal confirms the command exists. Even answering with the ordinary
        welcome is a tell: the same text arriving for a word nobody else knows
        is a hint worth following. Silence is the only response that leaks
        nothing, and to the sender it is indistinguishable from a typo landing
        in an empty void.
      */
      if (!isAdmin(msg.telegramId)) return 'ignored'

      const view = await statsPage()
      const error = await reply(msg.chatId, view.text, view.keyboard)
      return error ? `adminstats:send-failed:${error}` : 'adminstats'
    }

    const isHelp = command === '/help'
    const error = await reply(
      msg.chatId,
      pick(isHelp ? TEXT.help : TEXT.start, lang),
      openKeyboard(lang)
    )
    const name = isHelp ? 'help' : command === '/start' ? 'start' : 'open'
    return error ? `${name}:send-failed:${error}` : name
  } catch (error) {
    console.error('[telegram] handler failed', command, error)
    return `error:${(error as Error).message}`
  }
}

export type IncomingCallback = {
  id: string
  chatId: number | string
  messageId: number
  telegramId: string
  data: string
}

/**
 * A tap on a button in the stats report.
 *
 * The only buttons this bot has, and only one person can see them -- but the
 * check is repeated here anyway. A callback carries whatever `callback_data` the
 * sender chooses, and a message can be forwarded, so "the button was only shown
 * to the admin" is not the same claim as "this tap came from the admin".
 *
 * The report is edited in place rather than re-sent: paging through six pages
 * should leave one message that is now on page six, not six messages.
 */
export async function handleCallback(cb: IncomingCallback): Promise<string> {
  try {
    if (!isAdmin(cb.telegramId)) {
      // Answered so the button stops spinning, and told nothing.
      await answerCallbackQuery(cb.id)
      return 'ignored'
    }

    const parsed = parseStatsCallback(cb.data)
    if (!parsed) {
      await answerCallbackQuery(cb.id)
      return 'callback:unknown'
    }

    const view = await statsPage(parsed.filter, parsed.page)
    await answerCallbackQuery(cb.id)
    await callTelegram('editMessageText', {
      chat_id: cb.chatId,
      message_id: cb.messageId,
      text: view.text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: view.keyboard },
    })
    return `adminstats:${parsed.filter}:${parsed.page}`
  } catch (error) {
    console.error('[telegram] callback failed', cb.data, error)
    // Still clear the spinner, or the button looks stuck.
    await answerCallbackQuery(cb.id).catch(() => {})
    return 'callback:error'
  }
}
