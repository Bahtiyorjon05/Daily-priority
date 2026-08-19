import { escapeHtml, type InlineKeyboard } from '@/lib/telegram/api'
import type { DailySnapshot, TodayHabit, TodayTask } from '@/lib/telegram/actions'

/**
 * The words, and the buttons under them.
 *
 * Split out from the handlers so a message can be built and asserted without a
 * database or a network call — the shape of what the bot says is the part most
 * likely to quietly break, and the part hardest to notice.
 *
 * Both languages sit side by side on purpose. A `Copy` that is missing a half
 * will not compile, which is the only reliable way to keep a second language
 * from rotting.
 */

export type Lang = 'uz' | 'en'
export type Copy = Record<Lang, string>

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://daily-priority.vercel.app'

export const OPEN_BUTTON: Copy = { en: 'Open the app', uz: 'Ilovani ochish' }

export function openKeyboard(lang: Lang, path = '/dashboard'): InlineKeyboard {
  return [[{ text: OPEN_BUTTON[lang], web_app: { url: `${APP_URL}${path}` } }]]
}

/** Callback payloads. Kept short: Telegram caps `callback_data` at 64 bytes and
 *  a cuid is already 25 of them. */
export const CB = {
  task: (id: string) => `t:${id}`,
  habit: (id: string) => `h:${id}`,
  tasks: 'list:t',
  habits: 'list:h',
} as const

export function parseCallback(data: string): { kind: 'task' | 'habit' | 'tasks' | 'habits'; id?: string } | null {
  if (data === CB.tasks) return { kind: 'tasks' }
  if (data === CB.habits) return { kind: 'habits' }
  const [prefix, id] = data.split(':')
  if (prefix === 't' && id) return { kind: 'task', id }
  if (prefix === 'h' && id) return { kind: 'habit', id }
  return null
}

/* ---------------------------------------------------------------- tasks --- */

export function tasksMessage(tasks: TodayTask[], lang: Lang): { text: string; keyboard: InlineKeyboard } {
  if (tasks.length === 0) {
    return {
      text:
        lang === 'uz'
          ? '✅ Bugun ochiq vazifa yo‘q.\n\nYangi vazifa qo‘shish uchun shunchaki matn yozib yuboring.'
          : '✅ Nothing open today.\n\nSend me any text to add a task.',
      keyboard: openKeyboard(lang, '/dashboard'),
    }
  }

  const lines = tasks.map((t) => `${t.overdue ? '🔴' : '•'} ${escapeHtml(t.title)}`)
  const text =
    `<b>${lang === 'uz' ? 'Bugungi vazifalar' : 'Today’s tasks'}</b>\n\n` +
    lines.join('\n') +
    `\n\n<i>${lang === 'uz' ? 'Bajarilganini belgilash uchun bosing.' : 'Tap one to mark it done.'}</i>`

  /*
    One button per task, one per row.

    Titles are user-written and run long; two to a row truncates them to
    uselessness on a phone, which is where every one of these is read.
  */
  const keyboard: InlineKeyboard = tasks.map((t) => [
    { text: `✅ ${trim(t.title, 40)}`, callback_data: CB.task(t.id) },
  ])
  keyboard.push([{ text: OPEN_BUTTON[lang], web_app: { url: `${APP_URL}/dashboard` } }])
  return { text, keyboard }
}

/* --------------------------------------------------------------- habits --- */

export function habitsMessage(habits: TodayHabit[], lang: Lang): { text: string; keyboard: InlineKeyboard } {
  if (habits.length === 0) {
    return {
      text:
        lang === 'uz'
          ? 'Hali kunlik odat yo‘q. Ilovada bitta qo‘shing — keyin shu yerdan belgilaysiz.'
          : 'No daily habits yet. Add one in the app and you can tick it from here.',
      keyboard: openKeyboard(lang, '/habits'),
    }
  }

  const lines = habits.map(
    (h) => `${h.done ? '✅' : '⬜'} ${escapeHtml(h.title)}${h.streak > 0 ? ` · 🔥${h.streak}` : ''}`
  )
  const remaining = habits.filter((h) => !h.done)
  const text =
    `<b>${lang === 'uz' ? 'Bugungi odatlar' : 'Today’s habits'}</b>\n\n` +
    lines.join('\n') +
    (remaining.length === 0
      ? `\n\n<b>${lang === 'uz' ? 'Hammasi bajarildi. Barakalla.' : 'All done today. Well done.'}</b>`
      : '')

  // Only the unticked ones get a button: a button that says "done" and does
  // nothing when pressed is worse than no button.
  const keyboard: InlineKeyboard = remaining.map((h) => [
    { text: `✅ ${trim(h.title, 40)}`, callback_data: CB.habit(h.id) },
  ])
  keyboard.push([{ text: OPEN_BUTTON[lang], web_app: { url: `${APP_URL}/habits` } }])
  return { text, keyboard }
}

/* ---------------------------------------------------------------- today --- */

/**
 * The daily message.
 *
 * Only lines that have something to say. A digest that lists four zeroes every
 * morning is an accusation, and it is the reason people mute bots.
 */
export function dailyMessage(
  snapshot: DailySnapshot,
  lang: Lang,
  opts: { name?: string } = {}
): { text: string; keyboard: InlineKeyboard } {
  const uz = lang === 'uz'
  const greeting = opts.name
    ? `${uz ? 'Assalomu alaykum' : 'Assalamu alaykum'}, ${escapeHtml(opts.name)}`
    : uz ? 'Assalomu alaykum' : 'Assalamu alaykum'

  const parts: string[] = [`<b>${greeting}</b> 🌙`]

  const openTasks = snapshot.tasks.length
  const undoneHabits = snapshot.habits.filter((h) => !h.done).length

  if (openTasks > 0) {
    const overdue = snapshot.tasks.filter((t) => t.overdue).length
    parts.push(
      uz
        ? `📋 ${openTasks} ta vazifa ochiq${overdue > 0 ? `, ${overdue} tasi muddati o‘tgan` : ''}.`
        : `📋 ${openTasks} task${openTasks === 1 ? '' : 's'} open${overdue > 0 ? `, ${overdue} overdue` : ''}.`
    )
  }
  if (undoneHabits > 0) {
    parts.push(
      uz
        ? `🔁 ${undoneHabits} ta odat kutmoqda.`
        : `🔁 ${undoneHabits} habit${undoneHabits === 1 ? '' : 's'} still to tick.`
    )
  }
  if (snapshot.prayersDone > 0) {
    parts.push(
      uz
        ? `🕌 Bugun ${snapshot.prayersDone}/5 namoz belgilangan.`
        : `🕌 ${snapshot.prayersDone}/5 prayers marked today.`
    )
  }
  if (!snapshot.quranReadToday) {
    parts.push(uz ? '📖 Bugun hali Quron o‘qilmadi.' : '📖 No Quran read yet today.')
  }

  if (parts.length === 1) {
    parts.push(
      uz
        ? 'Bugun hammasi tinch. Bir oyat o‘qish uchun ayni payt.'
        : 'Nothing pending. A good moment for an ayah.'
    )
  }

  const keyboard: InlineKeyboard = []
  if (openTasks > 0) {
    keyboard.push([{ text: uz ? '📋 Vazifalar' : '📋 Tasks', callback_data: CB.tasks }])
  }
  if (undoneHabits > 0) {
    keyboard.push([{ text: uz ? '🔁 Odatlar' : '🔁 Habits', callback_data: CB.habits }])
  }
  keyboard.push([{ text: OPEN_BUTTON[lang], web_app: { url: `${APP_URL}/dashboard` } }])

  return { text: parts.join('\n'), keyboard }
}

/** Cut a button label without leaving a bare ellipsis on a one-word title. */
function trim(s: string, max: number): string {
  const clean = s.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`
}
