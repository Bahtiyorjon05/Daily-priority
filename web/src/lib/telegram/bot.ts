import { prisma } from '@/lib/prisma'
import {
  answerCallbackQuery, callTelegram, escapeHtml, sendMessage, type InlineKeyboard,
} from '@/lib/telegram/api'
import {
  addTask, completeHabit, completeTask, dailySnapshot, todayHabits, todayTasks,
} from '@/lib/telegram/actions'
import {
  CB, dailyMessage, habitsMessage, openKeyboard as buildOpenKeyboard, parseCallback,
  tasksMessage,
} from '@/lib/telegram/messages'
import { streakFromDates } from '@/lib/streaks'
import { surahByNumber } from '@/lib/quran/surahs'
import { surahName } from '@/lib/quran/name'

/**
 * What the bot says.
 *
 * Kept out of the webhook route so it can be tested without an HTTP layer, and
 * so the route stays a thin "verify, dispatch, 200" shell.
 *
 * Two rules the whole file follows:
 *
 *   - Every reply offers the Mini App. The bot is a doorway, not a destination;
 *     anything it can tell you, the app tells you better.
 *   - It answers in the language the person's Telegram is set to. Someone whose
 *     phone is in Uzbek did not come here to read English.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://daily-priority.vercel.app'

export type Lang = 'uz' | 'en'

/** Telegram sends an IETF tag: `uz`, `en-GB`, `ru`. Uzbek users very often run
 *  Telegram in Russian, and Uzbek is the closer of the two we speak. */
export function langOf(code?: string): Lang {
  if (!code) return 'en'
  const base = code.toLowerCase().split('-')[0]
  return base === 'uz' || base === 'ru' ? 'uz' : 'en'
}

type Copy = Record<Lang, string>
const pick = (c: Copy, lang: Lang) => c[lang]

const OPEN_BUTTON: Copy = { en: 'Open Daily Priority', uz: 'Daily Priority ochish' }

/** Every message carries the same way in. One builder, shared with the digest. */
const openKeyboard = (lang: Lang, path = '/dashboard'): InlineKeyboard =>
  buildOpenKeyboard(lang, path)

const TEXT = {
  start: {
    en:
      '<b>Assalamu alaykum</b> 🌙\n\n' +
      'Daily Priority keeps your prayers, Quran reading, habits and tasks in one place — ' +
      'built around the five prayers rather than a nine-to-five.\n\n' +
      'Tap below to open it. Everything works right here inside Telegram.',
    uz:
      '<b>Assalomu alaykum</b> 🌙\n\n' +
      'Daily Priority namoz, Quron o‘qish, odatlar va vazifalaringizni bir joyda saqlaydi — ' +
      'ish kuni emas, besh vaqt namoz atrofida qurilgan.\n\n' +
      'Ochish uchun quyidagini bosing. Hammasi shu yerda, Telegram ichida ishlaydi.',
  } satisfies Copy,
  help: {
    en:
      '<b>Commands</b>\n\n' +
      '/today — your day at a glance\n' +
      '/tasks — today’s tasks, tick them right here\n' +
      '/habits — today’s habits, tick them right here\n' +
      '/add — add a task (or just send me the text)\n' +
      '/prayers — today’s prayer times\n' +
      '/quran — carry on reading where you stopped\n' +
      '/streak — your current streaks\n' +
      '/reminders — the daily message, on or off\n' +
      '/app — open Daily Priority\n' +
      '/help — this message',
    uz:
      '<b>Buyruqlar</b>\n\n' +
      '/today — bugungi kuningiz\n' +
      '/tasks — bugungi vazifalar, shu yerda belgilang\n' +
      '/habits — bugungi odatlar, shu yerda belgilang\n' +
      '/add — vazifa qo‘shish (yoki shunchaki matn yuboring)\n' +
      '/prayers — bugungi namoz vaqtlari\n' +
      '/quran — to‘xtagan joyingizdan davom eting\n' +
      '/streak — ketma-ketliklaringiz\n' +
      '/reminders — kunlik xabarni yoqish yoki o‘chirish\n' +
      '/app — Daily Priority ochish\n' +
      '/help — shu xabar',
  } satisfies Copy,
  notLinked: {
    en:
      'Open the app once from the button below and I will know who you are — ' +
      'then this command can answer properly.',
    uz:
      'Quyidagi tugma orqali ilovani bir marta oching, shunda men sizni tanib olaman — ' +
      'keyin bu buyruq to‘liq javob beradi.',
  } satisfies Copy,
  remindersOn: {
    en: '🔔 Prayer reminders are <b>on</b> for this chat. Send /reminders again to turn them off.',
    uz: '🔔 Namoz eslatmalari shu chat uchun <b>yoqildi</b>. O‘chirish uchun yana /reminders yuboring.',
  } satisfies Copy,
  remindersOff: {
    en: '🔕 Prayer reminders are <b>off</b>. Send /reminders to turn them back on.',
    uz: '🔕 Namoz eslatmalari <b>o‘chirildi</b>. Qayta yoqish uchun /reminders yuboring.',
  } satisfies Copy,
  taskAdded: {
    en: '📋 Added: <b>{title}</b>',
    uz: '📋 Qo‘shildi: <b>{title}</b>',
  } satisfies Copy,
  taskTooLong: {
    en: 'That is a bit long for a task title. Send something shorter.',
    uz: 'Bu vazifa nomi uchun uzunroq. Qisqaroq yuboring.',
  } satisfies Copy,
  taskDone: {
    en: '✅ Done: {title}',
    uz: '✅ Bajarildi: {title}',
  } satisfies Copy,
  habitDone: {
    en: '✅ Ticked: {title}',
    uz: '✅ Belgilandi: {title}',
  } satisfies Copy,
  alreadyDone: {
    en: 'Already done today.',
    uz: 'Bugun allaqachon bajarilgan.',
  } satisfies Copy,
  gone: {
    en: 'That is no longer there.',
    uz: 'Bu endi mavjud emas.',
  } satisfies Copy,
  unknown: {
    en: 'I did not recognise that. Send /help to see what I can do.',
    uz: 'Buni tushunmadim. Nima qila olishimni ko‘rish uchun /help yuboring.',
  } satisfies Copy,
}

/** The signed-in account behind a Telegram chat, if the app has been opened. */
async function userFor(telegramId: string) {
  return prisma.user.findFirst({
    where: { telegramId, deletedAt: null },
    select: { id: true, name: true, telegramReminders: true },
  })
}

async function streakMessage(userId: string, lang: Lang): Promise<string> {
  const [prayers, quran, habits] = await Promise.all([
    prisma.prayerTracking.findMany({
      // `completedAt` is what "prayed" means here; `onTime` is a separate
      // question and a late prayer still keeps the streak alive.
      where: { userId, completedAt: { not: null } },
      select: { date: true },
      orderBy: { date: 'desc' },
      take: 400,
    }),
    prisma.quranReadingLog.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
      take: 400,
    }),
    prisma.habitCompletion.findMany({
      where: { habit: { userId } },
      select: { date: true },
      orderBy: { date: 'desc' },
      take: 400,
    }),
  ])

  // The same definition the app uses, imported rather than re-derived, so the
  // bot can never disagree with the screen.
  const rows: [string, number][] = [
    [lang === 'uz' ? 'Namoz' : 'Prayers', streakFromDates(prayers.map((p: { date: Date }) => p.date))],
    [lang === 'uz' ? 'Quron' : 'Quran', streakFromDates(quran.map((q: { date: Date }) => q.date))],
    [lang === 'uz' ? 'Odatlar' : 'Habits', streakFromDates(habits.map((h: { date: Date }) => h.date))],
  ]

  const live = rows.filter(([, n]) => n > 0)
  if (live.length === 0) {
    return lang === 'uz'
      ? 'Hali ketma-ketlik yo‘q. Bugun bitta namozni belgilang — ketma-ketlik shundan boshlanadi.'
      : 'No streaks yet. Mark one prayer today and the first one starts.'
  }

  const unit = lang === 'uz' ? 'kun' : 'days'
  return (
    `<b>${lang === 'uz' ? 'Ketma-ketliklaringiz' : 'Your streaks'}</b>\n\n` +
    live.map(([label, n]) => `🔥 ${label}: <b>${n}</b> ${unit}`).join('\n')
  )
}

async function quranMessage(userId: string, lang: Lang): Promise<{ text: string; path: string }> {
  const progress = await prisma.quranProgress.findUnique({
    where: { userId },
    select: { lastSurah: true, lastAyah: true },
  })

  if (!progress) {
    return {
      text: lang === 'uz'
        ? 'Hali Quron o‘qishni boshlamagansiz. Fotihadan boshlaymizmi?'
        : 'You have not started reading yet. Shall we begin with Al-Fatiha?',
      path: '/quran',
    }
  }

  // Named in the reader's language, through the same helper the page uses --
  // `surah.en` here would put "Al-Baqara" in an otherwise Uzbek message, which
  // is the exact bug that was just fixed on the Quran page.
  const surah = surahByNumber(progress.lastSurah)
  const name = surah ? surahName(surah, lang) : `Surah ${progress.lastSurah}`
  return {
    text: lang === 'uz'
      ? `📖 Siz <b>${escapeHtml(name)}</b>, ${progress.lastAyah}-oyatda to‘xtagansiz.`
      : `📖 You stopped at <b>${escapeHtml(name)}</b>, ayah ${progress.lastAyah}.`,
    path: '/quran',
  }
}

export type IncomingMessage = {
  chatId: number | string
  telegramId: string
  text: string
  languageCode?: string
  firstName?: string
}

/**
 * Handle one incoming message. Returns what was sent, for the tests and the log.
 *
 * Never throws: an unhandled error here would make Telegram retry the same
 * update forever, which turns one bad message into a permanent loop.
 */
export async function handleMessage(msg: IncomingMessage): Promise<string> {
  const lang = langOf(msg.languageCode)
  const command = msg.text.trim().split(/\s+/)[0].toLowerCase().split('@')[0]

  try {
    switch (command) {
      case '/start':
        await sendMessage(msg.chatId, pick(TEXT.start, lang), { keyboard: openKeyboard(lang) })
        return 'start'

      case '/help':
        await sendMessage(msg.chatId, pick(TEXT.help, lang), { keyboard: openKeyboard(lang) })
        return 'help'

      case '/app':
        await sendMessage(msg.chatId, pick(OPEN_BUTTON, lang), { keyboard: openKeyboard(lang) })
        return 'app'

      case '/prayers':
        await sendMessage(
          msg.chatId,
          lang === 'uz' ? '🕌 Bugungi namoz vaqtlari:' : '🕌 Today’s prayer times:',
          { keyboard: openKeyboard(lang, '/prayers') }
        )
        return 'prayers'

      case '/quran': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await sendMessage(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang, '/quran') })
          return 'quran:unlinked'
        }
        const { text, path } = await quranMessage(user.id, lang)
        await sendMessage(msg.chatId, text, { keyboard: openKeyboard(lang, path) })
        return 'quran'
      }

      case '/streak': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await sendMessage(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
          return 'streak:unlinked'
        }
        await sendMessage(msg.chatId, await streakMessage(user.id, lang), { keyboard: openKeyboard(lang) })
        return 'streak'
      }

      case '/reminders': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await sendMessage(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
          return 'reminders:unlinked'
        }
        // A toggle, so the same command turns it off. Two commands for one
        // setting is two things to remember and one of them is always wrong.
        const next = !user.telegramReminders
        await prisma.user.update({
          where: { id: user.id },
          data: { telegramReminders: next, telegramChatId: String(msg.chatId) },
        })
        await sendMessage(
          msg.chatId,
          pick(next ? TEXT.remindersOn : TEXT.remindersOff, lang),
          { keyboard: openKeyboard(lang, '/prayers') }
        )
        return next ? 'reminders:on' : 'reminders:off'
      }

      case '/today': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await sendMessage(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
          return 'today:unlinked'
        }
        const { text, keyboard } = dailyMessage(await dailySnapshot(user.id), lang, {
          name: user.name ?? msg.firstName,
        })
        await sendMessage(msg.chatId, text, { keyboard })
        return 'today'
      }

      case '/tasks': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await sendMessage(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
          return 'tasks:unlinked'
        }
        const { text, keyboard } = tasksMessage(await todayTasks(user.id), lang)
        await sendMessage(msg.chatId, text, { keyboard })
        return 'tasks'
      }

      case '/habits': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await sendMessage(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
          return 'habits:unlinked'
        }
        const { text, keyboard } = habitsMessage(await todayHabits(user.id), lang)
        await sendMessage(msg.chatId, text, { keyboard })
        return 'habits'
      }

      case '/add': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await sendMessage(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
          return 'add:unlinked'
        }
        return addTaskFrom(msg, user.id, lang, msg.text.slice(command.length).trim())
      }

      default: {
        /*
          Anything that is not a command becomes a task.

          The fastest capture this app can offer: a thought arrives, you type it
          into the chat you already have open, and it is on your list. Requiring
          /add first would mean the one moment capture has to be effortless is
          the one moment it is not.

          Only outside a command, so a mistyped /halp is still an error rather
          than silently becoming a task called "/halp".
        */
        if (!command.startsWith('/')) {
          const user = await userFor(msg.telegramId)
          if (!user) {
            await sendMessage(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
            return 'capture:unlinked'
          }
          return addTaskFrom(msg, user.id, lang, msg.text)
        }

        await sendMessage(msg.chatId, pick(TEXT.unknown, lang), { keyboard: openKeyboard(lang) })
        return 'unknown'
      }
    }
  } catch (error) {
    console.error('[telegram] handler failed', command, error)
    return 'error'
  }
}

/** Shared by /add and plain-text capture, so the two cannot drift apart. */
async function addTaskFrom(
  msg: IncomingMessage,
  userId: string,
  lang: Lang,
  title: string
): Promise<string> {
  const added = await addTask(userId, title)
  if (!added.ok) {
    if (added.reason === 'too-long') {
      await sendMessage(msg.chatId, pick(TEXT.taskTooLong, lang))
      return 'add:too-long'
    }
    await sendMessage(msg.chatId, pick(TEXT.unknown, lang), { keyboard: openKeyboard(lang) })
    return 'add:empty'
  }

  await sendMessage(
    msg.chatId,
    pick(TEXT.taskAdded, lang).replace('{title}', escapeHtml(added.title)),
    { keyboard: [[{ text: lang === 'uz' ? '📋 Vazifalar' : '📋 Tasks', callback_data: CB.tasks }]] }
  )
  return 'add'
}

export type IncomingCallback = {
  id: string
  chatId: number | string
  messageId: number
  telegramId: string
  data: string
  languageCode?: string
}

/**
 * A tap on an inline button.
 *
 * Telegram shows a loading spinner on the button until `answerCallbackQuery`
 * arrives, so that call happens on every path including the failures -- a button
 * that spins forever reads as broken even when the work succeeded.
 *
 * The list is then rewritten in place rather than sent again. Ticking four
 * habits should leave one message that is now correct, not five messages of
 * history.
 */
export async function handleCallback(cb: IncomingCallback): Promise<string> {
  const lang = langOf(cb.languageCode)
  const parsed = parseCallback(cb.data)

  try {
    if (!parsed) {
      await answerCallbackQuery(cb.id)
      return 'callback:unknown'
    }

    const user = await userFor(cb.telegramId)
    if (!user) {
      await answerCallbackQuery(cb.id, pick(TEXT.notLinked, lang))
      return 'callback:unlinked'
    }

    let toast = ''
    if (parsed.kind === 'task' && parsed.id) {
      const done = await completeTask(user.id, parsed.id)
      toast = done.ok ? pick(TEXT.taskDone, lang).replace('{title}', done.title) : pick(TEXT.gone, lang)
    } else if (parsed.kind === 'habit' && parsed.id) {
      const done = await completeHabit(user.id, parsed.id)
      toast = !done.ok
        ? pick(TEXT.gone, lang)
        : done.already
          ? pick(TEXT.alreadyDone, lang)
          : pick(TEXT.habitDone, lang).replace('{title}', done.title)
    }

    await answerCallbackQuery(cb.id, toast || undefined)

    // Redraw whichever list this button belonged to.
    const showHabits = parsed.kind === 'habit' || parsed.kind === 'habits'
    const view = showHabits
      ? habitsMessage(await todayHabits(user.id), lang)
      : tasksMessage(await todayTasks(user.id), lang)

    await callTelegram('editMessageText', {
      chat_id: cb.chatId,
      message_id: cb.messageId,
      text: view.text,
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: view.keyboard },
    })

    return showHabits ? 'callback:habits' : 'callback:tasks'
  } catch (error) {
    console.error('[telegram] callback failed', cb.data, error)
    // Still clear the spinner, or the button looks stuck.
    await answerCallbackQuery(cb.id).catch(() => {})
    return 'callback:error'
  }
}
