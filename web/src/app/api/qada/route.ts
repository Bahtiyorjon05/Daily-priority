import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Qazo — prayers owed and prayers made up.
 *
 * Five rows per user at most, so the read returns all of them and fills in zeroes
 * for prayers with no row yet. That keeps the client from having to know which
 * prayers exist in the database versus which exist in Islam.
 *
 * Writes are DELTAS, not absolute values. Two devices, or a double tap, would
 * otherwise race: last-write-wins on an absolute total silently discards the
 * other change, and this is a number people care about being right. An increment
 * in the database commutes.
 */

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
type Prayer = (typeof PRAYERS)[number]

const isPrayer = (v: unknown): v is Prayer =>
  typeof v === 'string' && (PRAYERS as readonly string[]).includes(v)

/** One tap must never be able to move a debt by a life-changing amount. */
const MAX_DELTA = 10_000

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await prisma.qadaDebt.findMany({
      where: { userId: session.user.id },
      select: { prayer: true, owed: true, madeUp: true },
    })

    const byPrayer = new Map(rows.map((r) => [r.prayer, r]))
    const data = PRAYERS.map((prayer) => {
      const row = byPrayer.get(prayer)
      const owed = row?.owed ?? 0
      const madeUp = row?.madeUp ?? 0
      return {
        prayer,
        owed,
        madeUp,
        // Clamped: an over-count of makeups should read as "done", not as a
        // negative debt.
        remaining: Math.max(0, owed - madeUp),
      }
    })

    return NextResponse.json({
      success: true,
      data,
      totals: {
        owed: data.reduce((n, d) => n + d.owed, 0),
        madeUp: data.reduce((n, d) => n + d.madeUp, 0),
        remaining: data.reduce((n, d) => n + d.remaining, 0),
      },
    })
  } catch (error) {
    console.error('[qada] read failed', error)
    return NextResponse.json({ error: 'Failed to load qada' }, { status: 500 })
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

    /*
      Accepts either one change or several — "add today's four missed prayers" is
      one intent and should be one request, not four that can half-fail.
    */
    const changes: unknown[] = Array.isArray(body.changes) ? body.changes : [body]
    if (changes.length === 0 || changes.length > PRAYERS.length) {
      return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })
    }

    const parsed: { prayer: Prayer; owedDelta: number; madeUpDelta: number }[] = []
    for (const change of changes) {
      const c = change as Record<string, unknown>
      if (!isPrayer(c.prayer)) {
        return NextResponse.json({ error: 'Unknown prayer' }, { status: 400 })
      }
      const owedDelta = Math.trunc(Number(c.owedDelta ?? 0))
      const madeUpDelta = Math.trunc(Number(c.madeUpDelta ?? 0))
      if (!Number.isFinite(owedDelta) || !Number.isFinite(madeUpDelta)) {
        return NextResponse.json({ error: 'Deltas must be numbers' }, { status: 400 })
      }
      if (Math.abs(owedDelta) > MAX_DELTA || Math.abs(madeUpDelta) > MAX_DELTA) {
        return NextResponse.json({ error: 'Change is too large' }, { status: 400 })
      }
      parsed.push({ prayer: c.prayer, owedDelta, madeUpDelta })
    }

    /*
      One transaction, and increments rather than assignments, so two tabs adding
      makeups at the same moment both count. The clamp afterwards is what keeps
      `owed` and `madeUp` from going negative — Prisma has no "increment but not
      below zero", so a decrement is applied and then floored.
    */
    await prisma.$transaction(async (tx) => {
      for (const { prayer, owedDelta, madeUpDelta } of parsed) {
        await tx.qadaDebt.upsert({
          where: { userId_prayer: { userId, prayer } },
          create: {
            userId,
            prayer,
            owed: Math.max(0, owedDelta),
            madeUp: Math.max(0, madeUpDelta),
          },
          update: {
            owed: { increment: owedDelta },
            madeUp: { increment: madeUpDelta },
          },
        })
      }

      // Floor anything a decrement pushed below zero.
      await tx.qadaDebt.updateMany({
        where: { userId, owed: { lt: 0 } },
        data: { owed: 0 },
      })
      await tx.qadaDebt.updateMany({
        where: { userId, madeUp: { lt: 0 } },
        data: { madeUp: 0 },
      })
    })

    return GET()
  } catch (error) {
    console.error('[qada] write failed', error)
    return NextResponse.json({ error: 'Failed to save qada' }, { status: 500 })
  }
}
