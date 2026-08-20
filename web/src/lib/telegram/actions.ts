import { prisma } from '@/lib/prisma'
import { todayKeyInTimeZone, localDayRange } from '@/lib/server-date'

/**
 * What the bot can actually do to your day.
 *
 * Reading a summary in chat is pleasant; changing something without leaving the
 * chat is the point. Ticking a habit is two taps here and five in any app, and
 * the two-tap version is the one that still happens on a bad day.
 *
 * Every function takes a `userId` that the caller has already established from a
 * verified Telegram identity, and every query is scoped by it. Nothing here
 * trusts an id that arrived in a callback payload: a task id is looked up
 * `{ id, userId }`, so a guessed id belonging to someone else simply does not
 * exist.
 */

/** Small caps everywhere: a chat message is not a list view, and twenty rows of
 *  buttons is a wall nobody reads. */
export const MAX_TASKS = 8
export const MAX_HABITS = 8

/** Longest task title accepted from a chat message. */
export const MAX_TITLE = 200

export type TodayTask = { id: string; title: string; overdue: boolean }
export type TodayHabit = { id: string; title: string; done: boolean; streak: number }

/** The day boundaries for this user, in their own timezone. */
async function dayFor(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  })
  const tz = user?.timezone || 'UTC'
  const key = todayKeyInTimeZone(tz)
  return { tz, key, ...localDayRange(key, tz) }
}

/**
 * What is open today.
 *
 * Overdue first, then undated, then due today. A list that leads with what you
 * already missed is more useful than one sorted by when it was created.
 */
export async function todayTasks(userId: string): Promise<TodayTask[]> {
  const { lt } = await dayFor(userId)

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { in: ['TODO', 'IN_PROGRESS'] },
      OR: [{ dueDate: null }, { dueDate: { lt } }],
    },
    select: { id: true, title: true, dueDate: true },
    orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
    take: MAX_TASKS,
  })

  const startOfToday = (await dayFor(userId)).gte
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    overdue: Boolean(t.dueDate && t.dueDate < startOfToday),
  }))
}

export async function completeTask(
  userId: string,
  taskId: string
): Promise<{ ok: true; title: string } | { ok: false }> {
  // Scoped by userId, so a callback carrying somebody else's task id finds
  // nothing rather than completing their work.
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
    select: { id: true, title: true, status: true },
  })
  if (!task) return { ok: false }

  if (task.status !== 'COMPLETED') {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
  }
  return { ok: true, title: task.title }
}

export async function addTask(
  userId: string,
  title: string
): Promise<{ ok: true; title: string } | { ok: false; reason: 'empty' | 'too-long' }> {
  const clean = title.trim().replace(/\s+/g, ' ')
  if (!clean) return { ok: false, reason: 'empty' }
  if (clean.length > MAX_TITLE) return { ok: false, reason: 'too-long' }

  await prisma.task.create({ data: { userId, title: clean } })
  return { ok: true, title: clean }
}

/**
 * Today's habits, and whether each is already ticked.
 *
 * Only DAILY habits. A weekly habit has no answer to "is it due today" that this
 * app tracks, and guessing would produce a checklist that is wrong for half the
 * week.
 */
export async function todayHabits(userId: string): Promise<TodayHabit[]> {
  const { gte, lt } = await dayFor(userId)

  const habits = await prisma.habit.findMany({
    where: { userId, frequency: 'DAILY' },
    select: {
      id: true,
      title: true,
      streak: true,
      completions: { where: { date: { gte, lt } }, select: { id: true }, take: 1 },
    },
    orderBy: { createdAt: 'asc' },
    take: MAX_HABITS,
  })

  return habits.map((h) => ({
    id: h.id,
    title: h.title,
    streak: h.streak,
    done: h.completions.length > 0,
  }))
}

export async function completeHabit(
  userId: string,
  habitId: string
): Promise<{ ok: true; title: string; already: boolean } | { ok: false }> {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    select: { id: true, title: true },
  })
  if (!habit) return { ok: false }

  const { gte, lt } = await dayFor(userId)
  const existing = await prisma.habitCompletion.findFirst({
    where: { habitId: habit.id, date: { gte, lt } },
    select: { id: true },
  })
  if (existing) return { ok: true, title: habit.title, already: true }

  /*
    Recorded at the start of the user's local day, not at `now()`.

    The unique index is [habitId, date], so a full timestamp makes every tick a
    distinct row and the constraint stops meaning "once a day". The range query
    above is what actually prevents duplicates; midnight keeps the stored value
    consistent with what the web app writes.
  */
  await prisma.habitCompletion.create({ data: { habitId: habit.id, date: gte } })
  return { ok: true, title: habit.title, already: false }
}

export type DailySnapshot = {
  tasks: TodayTask[]
  habits: TodayHabit[]
  prayersDone: number
  quranReadToday: boolean
}

/** Everything the daily message needs, in one pass. */
export async function dailySnapshot(userId: string): Promise<DailySnapshot> {
  const { gte, lt } = await dayFor(userId)

  const [tasks, habits, prayersDone, quran] = await Promise.all([
    todayTasks(userId),
    todayHabits(userId),
    prisma.prayerTracking.count({
      where: { userId, date: { gte, lt }, completedAt: { not: null } },
    }),
    prisma.quranReadingLog.findFirst({
      where: { userId, date: { gte, lt } },
      select: { id: true },
    }),
  ])

  return { tasks, habits, prayersDone, quranReadToday: Boolean(quran) }
}

export type PrayerRow = { name: string; time: string; done: boolean; next: boolean }

/**
 * Today's prayer times, with what has been marked.
 *
 * Read from the row the app already stores for this user, rather than calling
 * the prayer-times API again: the bot must never show a different Asr from the
 * screen, and the stored row is the one their madhab and location produced.
 *
 * Null when there is no row -- the app has to be opened once to establish a
 * location, and saying so is better than inventing times for the wrong city.
 */
export async function todayPrayers(userId: string): Promise<PrayerRow[] | null> {
  const { gte, lt, tz } = await dayFor(userId)

  const [times, tracked] = await Promise.all([
    prisma.prayerTime.findFirst({
      where: { userId, date: { gte, lt } },
      select: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    }),
    prisma.prayerTracking.findMany({
      where: { userId, date: { gte, lt }, completedAt: { not: null } },
      select: { prayerName: true },
    }),
  ])
  if (!times) return null

  const done = new Set(tracked.map((t) => String(t.prayerName).toUpperCase()))

  const nowMinutes = (() => {
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date())
      const [h, m] = parts.split(':').map(Number)
      return h * 60 + m
    } catch {
      const d = new Date()
      return d.getHours() * 60 + d.getMinutes()
    }
  })()

  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
  }

  const rows: PrayerRow[] = [
    { key: 'FAJR', label: 'fajr', time: times.fajr },
    { key: 'DHUHR', label: 'dhuhr', time: times.dhuhr },
    { key: 'ASR', label: 'asr', time: times.asr },
    { key: 'MAGHRIB', label: 'maghrib', time: times.maghrib },
    { key: 'ISHA', label: 'isha', time: times.isha },
  ].map((p) => ({
    name: p.label,
    time: p.time,
    done: done.has(p.key),
    next: false,
  }))

  /*
    Mark the next one still to come. Only one is marked -- "next" is a single
    prayer, and highlighting three of them says nothing.
  */
  const upcoming = rows.findIndex((r, i) => {
    const at = toMinutes(
      [times.fajr, times.dhuhr, times.asr, times.maghrib, times.isha][i]
    )
    return at !== null && at > nowMinutes
  })
  if (upcoming >= 0) rows[upcoming].next = true

  return rows
}
