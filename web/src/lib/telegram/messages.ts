import { escapeHtml, type InlineKeyboard, type ReplyKeyboard } from '@/lib/telegram/api'
import { APP_URL } from '@/lib/telegram/app-url'
import type {
  AyahView, DailySnapshot, PrayerRow, QadaRow, TodayHabit, TodayTask,
} from '@/lib/telegram/actions'

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



export const OPEN_BUTTON: Copy = { en: 'Open the app', uz: 'Ilovani ochish' }

/**
 * Every Mini App link goes through /tg.
 *
 * Not straight to the page: those are behind auth, and a redirect there loses
 * the `initData` fragment Telegram attaches, so the app opens signed out and the
 * bot never learns who the person is. /tg is public, signs in, then forwards.
 */
export function miniAppUrl(path = '/dashboard'): string {
  return `${APP_URL}/tg?to=${encodeURIComponent(path)}`
}

export function openKeyboard(lang: Lang, path = '/dashboard'): InlineKeyboard {
  return [[{ text: OPEN_BUTTON[lang], web_app: { url: miniAppUrl(path) } }]]
}

/**
 * The permanent menu, sitting where the phone keyboard would be.
 *
 * Telegram's menu button can be the command list OR the Mini App button, never
 * both, and Open is worth more there than a list nobody would find. So the
 * commands live here instead: always visible, one tap, no slash to remember --
 * and the app is on it too, as a real `web_app` button.
 *
 * The labels are what the person actually sends when they tap, so `MENU_COMMAND`
 * maps them back. Miss that and every tap becomes a task called "Vazifalar".
 */
export function mainKeyboard(lang: Lang): ReplyKeyboard {
  const uz = lang === 'uz'
  return [
    [{ text: uz ? '🌙 Bugun' : '🌙 Today' }, { text: uz ? '📋 Vazifalar' : '📋 Tasks' }],
    [{ text: uz ? '🔁 Odatlar' : '🔁 Habits' }, { text: uz ? '🕌 Namoz' : '🕌 Prayers' }],
    [{ text: uz ? '📖 Quron' : '📖 Quran' }, { text: uz ? '🔥 Ketma-ketlik' : '🔥 Streak' }],
    [
      { text: uz ? '📱 Ilovani ochish' : '📱 Open the app', web_app: { url: miniAppUrl('/dashboard') } },
      { text: uz ? '⚙️ Sozlamalar' : '⚙️ Settings' },
    ],
  ]
}

/**
 * Menu label -> command.
 *
 * Every label in both languages, because a person whose Telegram is in English
 * can still have been sent an Uzbek keyboard earlier in the chat -- the keyboard
 * persists and the language can change under it.
 */
export const MENU_COMMAND: Record<string, string> = {
  '🌙 Bugun': '/today', '🌙 Today': '/today',
  '📋 Vazifalar': '/tasks', '📋 Tasks': '/tasks',
  '🔁 Odatlar': '/habits', '🔁 Habits': '/habits',
  '🕌 Namoz': '/prayers', '🕌 Prayers': '/prayers',
  '📖 Quron': '/quran', '📖 Quran': '/quran',
  '🔥 Ketma-ketlik': '/streak', '🔥 Streak': '/streak',
  '⚙️ Sozlamalar': '/reminders', '⚙️ Settings': '/reminders',
}

/** Callback payloads. Kept short: Telegram caps `callback_data` at 64 bytes and
 *  a cuid is already 25 of them. */
export const CB = {
  task: (id: string) => `t:${id}`,
  habit: (id: string) => `h:${id}`,
  tasks: 'list:t',
  habits: 'list:h',
  prayer: (slot: string) => `p:${slot}`,
  qadaMade: (slot: string) => `qm:${slot}`,
  qadaOwe: (slot: string) => `qo:${slot}`,
  ayah: (surah: number, ayah: number) => `a:${surah}:${ayah}`,
} as const

export type Callback =
  | { kind: 'tasks' | 'habits' }
  | { kind: 'task' | 'habit'; id: string }
  | { kind: 'prayer' | 'qadaMade' | 'qadaOwe'; slot: string }
  | { kind: 'ayah'; surah: number; ayah: number }

export function parseCallback(data: string): Callback | null {
  if (data === CB.tasks) return { kind: 'tasks' }
  if (data === CB.habits) return { kind: 'habits' }

  const [prefix, a, b] = data.split(':')
  if (prefix === 't' && a) return { kind: 'task', id: a }
  if (prefix === 'h' && a) return { kind: 'habit', id: a }
  if (prefix === 'p' && a) return { kind: 'prayer', slot: a }
  if (prefix === 'qm' && a) return { kind: 'qadaMade', slot: a }
  if (prefix === 'qo' && a) return { kind: 'qadaOwe', slot: a }
  if (prefix === 'a' && a && b) {
    const surah = Number(a)
    const ayah = Number(b)
    // Bounds come from the data, not the payload: a crafted callback must not
    // become a request for surah 9999.
    if (Number.isInteger(surah) && surah >= 1 && surah <= 114 && Number.isInteger(ayah) && ayah >= 1) {
      return { kind: 'ayah', surah, ayah }
    }
  }
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
  keyboard.push([{ text: OPEN_BUTTON[lang], web_app: { url: miniAppUrl('/dashboard') } }])
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
  keyboard.push([{ text: OPEN_BUTTON[lang], web_app: { url: miniAppUrl('/habits') } }])
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
  keyboard.push([{ text: OPEN_BUTTON[lang], web_app: { url: miniAppUrl('/dashboard') } }])

  return { text: parts.join('\n'), keyboard }
}

/** Cut a button label without leaving a bare ellipsis on a one-word title. */
function trim(s: string, max: number): string {
  const clean = s.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`
}

/* --------------------------------------------------------------- prayers --- */

/** Prayer names, in the reader's language. Uzbek uses the Uzbek names, not
 *  transliterated Arabic -- Bomdod, not Fajr. */
const PRAYER_NAMES: Record<string, Record<Lang, string>> = {
  fajr: { en: 'Fajr', uz: 'Bomdod' },
  dhuhr: { en: 'Dhuhr', uz: 'Peshin' },
  asr: { en: 'Asr', uz: 'Asr' },
  maghrib: { en: 'Maghrib', uz: 'Shom' },
  isha: { en: 'Isha', uz: 'Xufton' },
}

export function prayersMessage(
  rows: PrayerRow[] | null,
  lang: Lang
): { text: string; keyboard: InlineKeyboard } {
  const uz = lang === 'uz'

  if (!rows) {
    /*
      No stored times means no location yet. Inventing times for the wrong city
      would be worse than saying so -- these are prayer times, and a wrong Asr is
      not a cosmetic bug.
    */
    return {
      text: uz
        ? 'Namoz vaqtlari uchun joylashuvingiz kerak. Ilovani bir marta oching — keyin vaqtlar shu yerda chiqadi.'
        : 'I need your location for prayer times. Open the app once and they will show here.',
      keyboard: openKeyboard(lang, '/prayers'),
    }
  }

  const lines = rows.map((r) => {
    const name = PRAYER_NAMES[r.name]?.[lang] ?? r.name
    // A tick for what is done, an arrow for what is next, a space otherwise so
    // the times stay in one column.
    const mark = r.done ? '✅' : r.next ? '➡️' : '🕰'
    const label = r.next ? `<b>${name}</b>` : name
    return `${mark} ${label} — <b>${r.time}</b>`
  })

  const doneCount = rows.filter((r) => r.done).length

  return {
    text:
      `<b>${uz ? 'Bugungi namoz vaqtlari' : 'Today’s prayer times'}</b>\n\n` +
      lines.join('\n') +
      `\n\n${uz ? `Belgilangan: ${doneCount}/5` : `Marked: ${doneCount}/5`}`,
    keyboard: openKeyboard(lang, '/prayers'),
  }
}

/* ------------------------------------------------------------------ qada --- */

export function qadaMessage(
  rows: QadaRow[],
  lang: Lang
): { text: string; keyboard: InlineKeyboard } {
  const uz = lang === 'uz'
  const total = rows.reduce((n, r) => n + r.outstanding, 0)

  const lines = rows.map((r) => {
    const name = PRAYER_NAMES[r.prayer]?.[lang] ?? r.prayer
    return `${r.outstanding > 0 ? '🔴' : '✅'} ${name} — <b>${r.outstanding}</b>`
  })

  /*
    One row per prayer: "prayed one" on the left, "add one" on the right.

    Making up qada is the common action and sits first. Adding to the debt is
    deliberately the smaller, second button -- nobody opens this hoping to add.
  */
  const keyboard: InlineKeyboard = rows.map((r) => [
    {
      text: `✅ ${PRAYER_NAMES[r.prayer]?.[lang] ?? r.prayer}`,
      callback_data: CB.qadaMade(r.prayer),
    },
    { text: '➕', callback_data: CB.qadaOwe(r.prayer) },
  ])
  keyboard.push([{ text: OPEN_BUTTON[lang], web_app: { url: miniAppUrl('/prayers') } }])

  return {
    text:
      `<b>${uz ? 'Qazo namozlar' : 'Qada prayers'}</b>\n\n` +
      lines.join('\n') +
      `\n\n${
        total === 0
          ? uz ? 'Qazo yo‘q. Alhamdulillah.' : 'Nothing outstanding. Alhamdulillah.'
          : uz ? `Jami: <b>${total}</b>` : `Total: <b>${total}</b>`
      }`,
    keyboard,
  }
}

/* ----------------------------------------------------------------- quran --- */

export function ayahMessage(
  view: AyahView | null,
  surahName: string,
  lang: Lang
): { text: string; keyboard: InlineKeyboard } {
  const uz = lang === 'uz'

  if (!view) {
    return {
      text: uz ? 'Oyat matnini yuklab bo‘lmadi.' : 'Could not load the ayah text.',
      keyboard: openKeyboard(lang, '/quran'),
    }
  }

  const keyboard: InlineKeyboard = []
  const nav: InlineKeyboard[number] = []
  if (view.ayah > 1) {
    nav.push({ text: '◀️', callback_data: CB.ayah(view.surah, view.ayah - 1) })
  }
  if (view.ayah < view.surahAyahs) {
    nav.push({
      text: uz ? 'Keyingi oyat ▶️' : 'Next ayah ▶️',
      callback_data: CB.ayah(view.surah, view.ayah + 1),
    })
  }
  if (nav.length) keyboard.push(nav)
  keyboard.push([{ text: OPEN_BUTTON[lang], web_app: { url: miniAppUrl('/quran') } }])

  return {
    /*
      Arabic first and alone on its line. It is the text; the translation is an
      aid to it, and running them together makes the Arabic just another
      paragraph.
    */
    text:
      `<b>${escapeHtml(surahName)}</b> · ${view.ayah}/${view.surahAyahs}\n\n` +
      `${escapeHtml(view.arabic)}\n\n` +
      (view.translation ? `<i>${escapeHtml(view.translation)}</i>` : ''),
    keyboard,
  }
}
