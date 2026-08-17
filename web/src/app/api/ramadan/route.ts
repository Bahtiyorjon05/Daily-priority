import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * The Ramadan log: fasting and Taraweeh, one row per day.
 *
 * Two flags rather than one. Someone can fast without praying Taraweeh and the
 * reverse; a single "did Ramadan today" would answer neither question, and the
 * whole point of a log is to be able to look back and see which.
 *
 * Keyed on the Gregorian date the device was on. The Ramadan day number depends
 * on a moon sighting that differs by country and gets corrected mid-month, so it
 * is stored for display and never used for identity — a key that can be revised
 * is not a key.
 */

/** A Hijri month is 29 or 30 days; nothing outside that range is a Ramadan day. */
const MAX_HIJRI_DAY = 30

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Parses a `YYYY-MM-DD` from the client into that day at local midnight. */
function parseDay(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  // Rejects 2026-02-31, which Date would silently roll into March.
  if (d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null
  return d
}

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // A Hijri month plus slack either side, so a log stays visible for a while
    // after Ramadan ends rather than vanishing the moment Shawwal begins.
    const since = new Date(Date.now() - 45 * 86_400_000)

    const days = await prisma.ramadanDay.findMany({
      where: { userId: session.user.id, date: { gte: since } },
      select: { date: true, hijriDay: true, fasted: true, taraweeh: true, note: true },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: days.map((d) => ({ ...d, key: toKey(d.date) })),
      totals: {
        fasted: days.filter((d) => d.fasted).length,
        taraweeh: days.filter((d) => d.taraweeh).length,
      },
    })
  } catch (error) {
    console.error('[ramadan] read failed', error)
    return NextResponse.json({ error: 'Failed to load Ramadan log' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const body = await request.json().catch(() => ({}))
    const date = parseDay(body.date)
    if (!date) {
      return NextResponse.json({ error: 'Expected date as YYYY-MM-DD' }, { status: 400 })
    }

    // A log of the future is a wish, not a record.
    if (date.getTime() > startOfDay(new Date()).getTime()) {
      return NextResponse.json({ error: 'Cannot log a future day' }, { status: 400 })
    }

    const data: { fasted?: boolean; taraweeh?: boolean; hijriDay?: number | null; note?: string | null } = {}
    if (typeof body.fasted === 'boolean') data.fasted = body.fasted
    if (typeof body.taraweeh === 'boolean') data.taraweeh = body.taraweeh
    if (body.hijriDay !== undefined) {
      const n = Math.trunc(Number(body.hijriDay))
      data.hijriDay = Number.isFinite(n) && n >= 1 && n <= MAX_HIJRI_DAY ? n : null
    }
    if (typeof body.note === 'string') {
      // Trimmed and bounded; an empty note is no note.
      const note = body.note.trim().slice(0, 500)
      data.note = note.length > 0 ? note : null
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })
    }

    const day = await prisma.ramadanDay.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, ...data },
      update: data,
      select: { date: true, hijriDay: true, fasted: true, taraweeh: true, note: true },
    })

    return NextResponse.json({ success: true, data: { ...day, key: toKey(day.date) } })
  } catch (error) {
    console.error('[ramadan] write failed', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
