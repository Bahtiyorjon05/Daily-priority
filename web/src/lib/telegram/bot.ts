import { prisma } from '@/lib/prisma'
import { APP_URL } from '@/lib/telegram/app-url'
import {
  answerCallbackQuery, callTelegram, escapeHtml, sendMessage, type InlineKeyboard,
} from '@/lib/telegram/api'
import {
  addTask, adjustQada, ayahAt, completeHabit, completeTask, dailySnapshot,
  markPrayer, qadaDebts, todayHabits, todayPrayers, todayTasks,
} from '@/lib/telegram/actions'
import {
  ayahMessage, CB, dailyMessage, habitsMessage, mainKeyboard, MENU_COMMAND,
  miniAppUrl, openKeyboard as buildOpenKeyboard, parseCallback, prayersMessage,
  qadaMessage, tasksMessage,
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



export type Lang = 'uz' | 'en'

/**
 * Which language to answer in.
 *
 * Uzbek unless the client is explicitly English. This is the reverse of the
 * usual default and it is deliberate: essentially every person here is in
 * Uzbekistan, many run Telegram in Russian, and plenty of phones report no
 * language tag at all. Defaulting to English served the smallest group.
 */
export function langOf(code?: string): Lang {
  if (!code) return 'uz'
  return code.toLowerCase().split('-')[0] === 'en' ? 'en' : 'uz'
}

type Copy = Record<Lang, string>
const pick = (c: Copy, lang: Lang) => c[lang]

const OPEN_BUTTON: Copy = { en: 'Open Daily Priority', uz: 'Daily Priority ochish' }

/** Every message carries the same way in. One builder, shared with the digest. */
const openKeyboard = (lang: Lang, path = '/dashboard'): InlineKeyboard =>
  buildOpenKeyboard(lang, path)

const TEXT = {
  /*
    The first message anyone sees.

    It names every command, because /start was a paragraph and a button and left
    the reader with no idea the bot could do anything else. The keyboard arrives
    with it, so the commands are on screen from the first second rather than
    waiting behind a slash nobody types.
  */
  start: {
    en:
      '<b>Assalamu alaykum</b> 🌙\n\n' +
      'Daily Priority holds your prayers, Quran reading, habits and tasks in one place — ' +
      'built around the five prayers rather than a nine-to-five.\n\n' +
      '<b>What I can do right here</b>\n' +
      '🌙 /today — your day at a glance\n' +
      '📋 /tasks — tick tasks off without leaving the chat\n' +
      '🔁 /habits — the same for today’s habits\n' +
      '➕ /add — add a task, or just send me the text\n' +
      '🕌 /prayers — today’s prayer times\n' +
      '📖 /quran — carry on where you stopped\n' +
      '🔥 /streak — how long you have kept it up\n' +
      '⚙️ /reminders — the daily message, on or off\n' +
      '📱 /app — open the full app\n\n' +
      'Use the buttons below — they are always there.',
    uz:
      '<b>Assalomu alaykum</b> 🌙\n\n' +
      'Daily Priority namoz, Quron o‘qish, odatlar va vazifalaringizni bir joyda saqlaydi — ' +
      'ish kuni emas, besh vaqt namoz atrofida qurilgan.\n\n' +
      '<b>Shu yerda nima qila olaman</b>\n' +
      '🌙 /today — bugungi kuningiz qisqacha\n' +
      '📋 /tasks — vazifalarni chatdan chiqmay belgilash\n' +
      '🔁 /habits — bugungi odatlar uchun ham xuddi shunday\n' +
      '➕ /add — vazifa qo‘shish, yoki shunchaki matn yuboring\n' +
      '🕌 /prayers — bugungi namoz vaqtlari\n' +
      '📖 /quran — to‘xtagan joyingizdan davom eting\n' +
      '🔥 /streak — ketma-ketligingiz\n' +
      '⚙️ /reminders — kunlik xabarni yoqish yoki o‘chirish\n' +
      '📱 /app — to‘liq ilovani ochish\n\n' +
      'Quyidagi tugmalardan foydalaning — ular doim shu yerda turadi.',
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
  openPrompt: {
    en: 'Everything works inside Telegram. Tap to open:',
    uz: 'Hammasi Telegram ichida ishlaydi. Ochish uchun bosing:',
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
  prayerMarked: {
    en: '✅ Marked as prayed.',
    uz: '✅ O‘qildi deb belgilandi.',
  } satisfies Copy,
  qadaMade: {
    en: '✅ One made up.',
    uz: '✅ Bittasi qazo qilindi.',
  } satisfies Copy,
  qadaOwed: {
    en: '➕ Added one to the debt.',
    uz: '➕ Qarzga bitta qo‘shildi.',
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

  /*
    A tap on the permanent keyboard arrives as ordinary text -- the label itself.
    Resolved to its command before anything else reads the message, or every tap
    on "Vazifalar" would be captured as a new task called "Vazifalar".
  */
  const raw = msg.text.trim()
  const text = MENU_COMMAND[raw] ?? raw
  const command = text.split(/\s+/)[0].toLowerCase().split('@')[0]

  /*
    Collects the reason any reply failed, for this one update.

    Per invocation rather than module scope: two updates can be in flight in the
    same instance, and a shared buffer would attribute one person's failure to
    another. `say` is the only way this function talks, so nothing can bypass it.
  */
  const failures: string[] = []
  const say: typeof reply = async (chatId, replyText, options) => {
    const error = await reply(chatId, replyText, options)
    if (error) failures.push(error)
    return error
  }
  const outcome = (name: string) => (failures.length ? `${name}:send-failed:${failures[0]}` : name)

  try {
    switch (command) {
      case '/start':
        /*
          Two messages, because one message carries one reply_markup. The first
          installs the permanent keyboard; the second offers the app inline. The
          alternative is choosing between them, and both matter on the very first
          screen someone sees.
        */
        await say(msg.chatId, pick(TEXT.start, lang), { reply: mainKeyboard(lang) })
        await say(msg.chatId, pick(TEXT.openPrompt, lang), { keyboard: openKeyboard(lang) })
        return outcome('start')

      case '/help':
        // Re-installs the keyboard too: /help is where someone goes when they
        // cannot find anything, and a missing keyboard is exactly that problem.
        await say(msg.chatId, pick(TEXT.help, lang), { reply: mainKeyboard(lang) })
        return outcome('help')

      case '/app':
        await say(msg.chatId, pick(OPEN_BUTTON, lang), { keyboard: openKeyboard(lang) })
        return outcome('app')

      case '/prayers': {
        /*
          The actual times, in the chat.

          This used to send a heading and a button, which is not an answer to
          "what time is Asr" -- it is a link to somewhere that knows. The times
          come from the row the app already stored for this person, so the bot
          can never disagree with the screen about their madhab or city.
        */
        const user = await userFor(msg.telegramId)
        if (!user) {
          await say(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang, '/prayers') })
          return outcome('prayers:unlinked')
        }
        const view = prayersMessage(await todayPrayers(user.id), lang)
        await say(msg.chatId, view.text, { keyboard: view.keyboard })
        return outcome('prayers')
      }

      case '/quran': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await say(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang, '/quran') })
          return outcome('quran:unlinked')
        }

        /*
          The ayah itself, in the chat.

          Telling someone "you stopped at Al-Baqara 40" and handing them a link
          is a bookmark, not a reading. This puts the text in front of them, and
          the next one is one tap away -- which is the whole difference between
          a reminder to read and actually reading.
        */
        const progress = await prisma.quranProgress.findUnique({
          where: { userId: user.id },
          select: { lastSurah: true, lastAyah: true },
        })
        const surahNumber = progress?.lastSurah ?? 1
        const ayahNumber = progress?.lastAyah ?? 1
        const surah = surahByNumber(surahNumber)
        const view = ayahMessage(
          await ayahAt(surahNumber, ayahNumber, lang, APP_URL),
          surah ? surahName(surah, lang) : `Surah ${surahNumber}`,
          lang
        )
        await say(msg.chatId, view.text, { keyboard: view.keyboard })
        return outcome('quran')
      }

      case '/streak': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await say(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
          return outcome('streak:unlinked')
        }
        await say(msg.chatId, await streakMessage(user.id, lang), { keyboard: openKeyboard(lang) })
        return outcome('streak')
      }

      case '/reminders': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await say(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
          return outcome('reminders:unlinked')
        }
        // A toggle, so the same command turns it off. Two commands for one
        // setting is two things to remember and one of them is always wrong.
        const next = !user.telegramReminders
        await prisma.user.update({
          where: { id: user.id },
          data: { telegramReminders: next, telegramChatId: String(msg.chatId) },
        })
        await say(
          msg.chatId,
          pick(next ? TEXT.remindersOn : TEXT.remindersOff, lang),
          { keyboard: openKeyboard(lang, '/prayers') }
        )
        return next ? 'reminders:on' : 'reminders:off'
      }

      case '/qazo':
      case '/qada': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await say(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang, '/prayers') })
          return outcome('qazo:unlinked')
        }
        const view = qadaMessage(await qadaDebts(user.id), lang)
        await say(msg.chatId, view.text, { keyboard: view.keyboard })
        return outcome('qazo')
      }

      case '/today': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await say(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
          return outcome('today:unlinked')
        }
        const { text, keyboard } = dailyMessage(await dailySnapshot(user.id), lang, {
          name: user.name ?? msg.firstName,
        })
        await say(msg.chatId, text, { keyboard })
        return outcome('today')
      }

      case '/tasks': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await say(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
          return outcome('tasks:unlinked')
        }
        const { text, keyboard } = tasksMessage(await todayTasks(user.id), lang)
        await say(msg.chatId, text, { keyboard })
        return outcome('tasks')
      }

      case '/habits': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await say(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
          return outcome('habits:unlinked')
        }
        const { text, keyboard } = habitsMessage(await todayHabits(user.id), lang)
        await say(msg.chatId, text, { keyboard })
        return outcome('habits')
      }

      case '/add': {
        const user = await userFor(msg.telegramId)
        if (!user) {
          await say(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
          return outcome('add:unlinked')
        }
        return outcome(await addTaskFrom(say, msg, user.id, lang, text.slice(command.length).trim()))
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
            await say(msg.chatId, pick(TEXT.notLinked, lang), { keyboard: openKeyboard(lang) })
            return outcome('capture:unlinked')
          }
          return outcome(await addTaskFrom(say, msg, user.id, lang, text))
        }

        await say(msg.chatId, pick(TEXT.unknown, lang), { keyboard: openKeyboard(lang) })
        return outcome('unknown')
      }
    }
  } catch (error) {
    console.error('[telegram] handler failed', command, error)
    return `error:${(error as Error).message}`
  }
}

/**
 * Send, and say so when it does not work.
 *
 * `sendMessage` returns a result rather than throwing, which is right for a cron
 * that must keep going -- and wrong here, where a silent failure means the person
 * pressed a button and nothing at all happened. Every reply in this file goes
 * through this, so the reason ends up in the log and in the webhook's response
 * instead of being dropped on the floor.
 */
export async function reply(
  chatId: number | string,
  text: string,
  options: Parameters<typeof sendMessage>[2] = {}
): Promise<string | null> {
  const result = await sendMessage(chatId, text, options)
  if (result.ok) return null
  console.error('[telegram] send failed', result.error)
  return result.error
}

/** Shared by /add and plain-text capture, so the two cannot drift apart. */
async function addTaskFrom(
  say: typeof reply,
  msg: IncomingMessage,
  userId: string,
  lang: Lang,
  title: string
): Promise<string> {
  const added = await addTask(userId, title)
  if (!added.ok) {
    if (added.reason === 'too-long') {
      await say(msg.chatId, pick(TEXT.taskTooLong, lang))
      return 'add:too-long'
    }
    await say(msg.chatId, pick(TEXT.unknown, lang), { keyboard: openKeyboard(lang) })
    return 'add:empty'
  }

  await say(
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
    // The list to redraw afterwards. Every branch sets one, so the message the
    // button lives on is always left showing the truth.
    let view: { text: string; keyboard: InlineKeyboard } | null = null
    let kind = 'tasks'

    if (parsed.kind === 'task') {
      const done = await completeTask(user.id, parsed.id)
      toast = done.ok ? pick(TEXT.taskDone, lang).replace('{title}', done.title) : pick(TEXT.gone, lang)
      view = tasksMessage(await todayTasks(user.id), lang)
    } else if (parsed.kind === 'habit') {
      const done = await completeHabit(user.id, parsed.id)
      toast = !done.ok
        ? pick(TEXT.gone, lang)
        : done.already
          ? pick(TEXT.alreadyDone, lang)
          : pick(TEXT.habitDone, lang).replace('{title}', done.title)
      view = habitsMessage(await todayHabits(user.id), lang)
      kind = 'habits'
    } else if (parsed.kind === 'prayer') {
      /*
        Marking a prayer from the reminder itself.

        The whole point of a reminder in a chat: the answer to "have you prayed
        Asr" is one tap away, in the same place the question was asked.
      */
      const marked = await markPrayer(user.id, parsed.slot)
      toast = !marked.ok
        ? pick(TEXT.gone, lang)
        : marked.already
          ? pick(TEXT.alreadyDone, lang)
          : pick(TEXT.prayerMarked, lang)
      view = prayersMessage(await todayPrayers(user.id), lang)
      kind = 'prayers'
    } else if (parsed.kind === 'qadaMade' || parsed.kind === 'qadaOwe') {
      const rows = await adjustQada(
        user.id,
        parsed.slot,
        parsed.kind === 'qadaMade' ? 'made' : 'owe'
      )
      if (!rows) {
        toast = pick(TEXT.gone, lang)
        view = qadaMessage(await qadaDebts(user.id), lang)
      } else {
        toast = pick(parsed.kind === 'qadaMade' ? TEXT.qadaMade : TEXT.qadaOwed, lang)
        view = qadaMessage(rows, lang)
      }
      kind = 'qada'
    } else if (parsed.kind === 'ayah') {
      const surah = surahByNumber(parsed.surah)
      view = ayahMessage(
        await ayahAt(parsed.surah, parsed.ayah, lang, APP_URL),
        surah ? surahName(surah, lang) : `Surah ${parsed.surah}`,
        lang
      )
      /*
        Reading on moves the bookmark, so closing the chat and opening the app
        lands on the ayah just read rather than where the session started.
      */
      await savePositionFromBot(user.id, parsed.surah, parsed.ayah)
      kind = 'ayah'
    } else {
      view = tasksMessage(await todayTasks(user.id), lang)
    }

    await answerCallbackQuery(cb.id, toast || undefined)

    if (view) {
      await callTelegram('editMessageText', {
        chat_id: cb.chatId,
        message_id: cb.messageId,
        text: view.text,
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: view.keyboard },
      })
    }

    return `callback:${kind}`
  } catch (error) {
    console.error('[telegram] callback failed', cb.data, error)
    // Still clear the spinner, or the button looks stuck.
    await answerCallbackQuery(cb.id).catch(() => {})
    return 'callback:error'
  }
}

/**
 * Move the reading bookmark when someone reads on in the chat.
 *
 * Deliberately not the full `savePosition` the page uses: reading one ayah in a
 * chat is not a page of the mushaf, so it moves the bookmark and records the day
 * without claiming a page was read. Progress has already been wrong once by
 * over-counting; it will not be wrong that way again.
 */
async function savePositionFromBot(userId: string, surah: number, ayah: number) {
  try {
    const today = new Date()
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    await prisma.$transaction([
      prisma.quranProgress.upsert({
        where: { userId },
        create: { userId, lastSurah: surah, lastAyah: ayah, lastPage: 1 },
        update: { lastSurah: surah, lastAyah: ayah },
      }),
      prisma.quranReadingLog.upsert({
        where: { userId_date: { userId, date: day } },
        create: { userId, date: day, pages: 1 },
        update: { pages: { increment: 1 } },
      }),
    ])
  } catch (error) {
    console.error('[telegram] bookmark move failed', error)
  }
}

export type IncomingInline = {
  id: string
  telegramId: string
  query: string
  languageCode?: string
}

/**
 * Inline mode: `@Daily_priority_bot` typed in any chat.
 *
 * The cheapest distribution this app has. Someone shares today's prayer times
 * into a family group and every person in it sees where it came from — no ad,
 * no link, no install prompt, just something useful with a name on it.
 *
 * Results are personal, so they are cached per user and never shared: `is_personal`
 * plus a zero cache time, or Telegram would serve one person's streak to the
 * next person who typed the same query.
 */
export async function handleInline(inline: IncomingInline): Promise<string> {
  const lang = langOf(inline.languageCode)
  const uz = lang === 'uz'

  try {
    const user = await userFor(inline.telegramId)

    /* Not linked: one result explaining how, rather than an empty dropdown that
       looks like the bot is broken. */
    if (!user) {
      await callTelegram('answerInlineQuery', {
        inline_query_id: inline.id,
        is_personal: true,
        cache_time: 0,
        button: {
          text: uz ? 'Ilovani ochish' : 'Open the app',
          web_app: { url: miniAppUrl('/dashboard') },
        },
        results: [
          {
            type: 'article',
            id: 'unlinked',
            title: uz ? 'Avval ilovani oching' : 'Open the app first',
            description: uz ? 'Shundan keyin bu yerda ulashishingiz mumkin' : 'Then you can share from here',
            input_message_content: {
              message_text: uz
                ? 'Daily Priority — namoz, Quron va odatlar bir joyda.'
                : 'Daily Priority — prayers, Quran and habits in one place.',
            },
          },
        ],
      })
      return 'inline:unlinked'
    }

    const [prayers, snapshot] = await Promise.all([
      todayPrayers(user.id),
      dailySnapshot(user.id),
    ])

    const results: Record<string, unknown>[] = []

    if (prayers) {
      const view = prayersMessage(prayers, lang)
      results.push({
        type: 'article',
        id: 'prayers',
        title: uz ? '🕌 Bugungi namoz vaqtlari' : '🕌 Today’s prayer times',
        description: prayers.map((p) => p.time).join(' · '),
        // No keyboard on a shared message: the buttons act on the SENDER's data,
        // and everyone else in the chat tapping them would be a nasty surprise.
        input_message_content: { message_text: view.text, parse_mode: 'HTML' },
      })
    }

    const done = snapshot.prayersDone
    results.push({
      type: 'article',
      id: 'streak',
      title: uz ? '🔥 Bugungi holatim' : '🔥 How my day is going',
      description: uz ? `${done}/5 namoz belgilangan` : `${done}/5 prayers marked`,
      input_message_content: {
        message_text: uz
          ? `🕌 Bugun ${done}/5 namoz belgilandi.\n\nDaily Priority bilan.`
          : `🕌 ${done}/5 prayers marked today.\n\nWith Daily Priority.`,
        parse_mode: 'HTML',
      },
    })

    await callTelegram('answerInlineQuery', {
      inline_query_id: inline.id,
      is_personal: true,
      cache_time: 0,
      button: {
        text: uz ? 'Ilovani ochish' : 'Open the app',
        web_app: { url: miniAppUrl('/dashboard') },
      },
      results,
    })
    return 'inline'
  } catch (error) {
    console.error('[telegram] inline failed', error)
    return 'inline:error'
  }
}
