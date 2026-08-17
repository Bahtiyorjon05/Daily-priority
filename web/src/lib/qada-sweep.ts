import { prisma } from '@/lib/prisma'

/**
 * Turns days that have already passed into qazo owed.
 *
 * The rule, and why it is this rule
 * ---------------------------------
 * A prayer counts as missed when the day is over and there is no completed
 * record for it — but ONLY on days the person was demonstrably using the app
 * (they logged at least one prayer that day).
 *
 * The alternative — treating every unlogged prayer as missed — reads absence of
 * a log as evidence of a missed prayer, and it usually is not. Someone who signs
 * up, uses the app for three days and comes back two months later did not
 * necessarily abandon 300 prayers; far more likely they prayed and stopped
 * ticking boxes. Silently charging them 300 would be both wrong and the kind of
 * wrong that makes a person delete the app.
 *
 * So the sweep only speaks where it has evidence. Everything before the app, and
 * every dormant stretch, stays where it belongs: a number the person enters
 * themselves, which the tracker supports directly.
 *
 * Today is never swept — its prayers may still be prayed.
 *
 * Idempotency
 * -----------
 * `UserPreference.qadaAutoThrough` is a watermark: the last date already
 * examined. Without it every page load would re-count the same missed prayers
 * and the debt would climb forever. The watermark advances inside the same
 * transaction as the increments, so a failure re-runs the whole window rather
 * than half-applying it.
 */

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const

/** Never look further back than this on a first run. */
const MAX_WINDOW_DAYS = 400

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const DAY = 86_400_000

export async function sweepQada(userId: string): Promise<{ added: number; days: number }> {
  const prefs = await prisma.userPreference.findUnique({
    where: { userId },
    select: { qadaAutoThrough: true },
  })

  const yesterday = startOfDay(new Date(Date.now() - DAY))

  // Start the day after the watermark; on a first run, bounded by MAX_WINDOW_DAYS
  // so a long-dormant account cannot trigger an enormous single sweep.
  const floor = startOfDay(new Date(Date.now() - MAX_WINDOW_DAYS * DAY))
  const from = prefs?.qadaAutoThrough
    ? new Date(Math.max(startOfDay(prefs.qadaAutoThrough).getTime() + DAY, floor.getTime()))
    : floor

  if (from.getTime() > yesterday.getTime()) {
    return { added: 0, days: 0 }
  }

  // One read for the whole window. Per-day queries would be dozens of round
  // trips for something that runs on a page load.
  const rows = await prisma.prayerTracking.findMany({
    where: { userId, date: { gte: from, lte: yesterday } },
    select: { date: true, prayerName: true, completedAt: true },
  })

  /** dayKey -> { logged: any row at all, done: prayers with a completion } */
  const byDay = new Map<number, { logged: boolean; done: Set<string> }>()
  for (const row of rows) {
    const key = startOfDay(row.date).getTime()
    const entry = byDay.get(key) ?? { logged: false, done: new Set<string>() }
    // A row exists, so the app was open that day — that is the evidence.
    entry.logged = true
    if (row.completedAt) entry.done.add(String(row.prayerName).toLowerCase())
    byDay.set(key, entry)
  }

  const missedByPrayer = new Map<string, number>()
  let daysCounted = 0

  for (const [, entry] of byDay) {
    if (!entry.logged) continue
    let anyMissed = false
    for (const prayer of PRAYERS) {
      if (!entry.done.has(prayer)) {
        missedByPrayer.set(prayer, (missedByPrayer.get(prayer) ?? 0) + 1)
        anyMissed = true
      }
    }
    if (anyMissed) daysCounted++
  }

  const added = [...missedByPrayer.values()].reduce((n, v) => n + v, 0)

  /*
    The watermark advances even when nothing was added. A day with every prayer
    logged is examined and settled; leaving it unmarked would mean re-reading it
    on every future sweep for no reason.
  */
  await prisma.$transaction(async (tx) => {
    for (const [prayer, count] of missedByPrayer) {
      await tx.qadaDebt.upsert({
        where: { userId_prayer: { userId, prayer } },
        create: { userId, prayer, owed: count, madeUp: 0 },
        update: { owed: { increment: count } },
      })
    }

    await tx.userPreference.upsert({
      where: { userId },
      create: { userId, qadaAutoThrough: yesterday },
      update: { qadaAutoThrough: yesterday },
    })
  })

  return { added, days: daysCounted }
}
