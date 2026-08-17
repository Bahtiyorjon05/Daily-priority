import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Which convention this user's prayer times are calculated with.
 *
 * Two values, and both change what time the app tells someone to pray, so
 * neither is a cosmetic preference:
 *
 *   asrSchool          1 = Hanafi, 0 = Shafi'i (with Maliki and Hanbali).
 *                      Asr falls 40-90 minutes later in the Hanafi school.
 *   calculationMethod  Aladhan method id for the Fajr/Isha twilight angles.
 *
 * Both were constants before this route existed: the UI hard-coded Hanafi at its
 * two call sites, and the server hard-coded method 2 (ISNA — a North American
 * convention) for everybody. Neither could be changed by a user who follows a
 * different school or lives somewhere else.
 */

/** Ids Aladhan accepts. Anything else would silently return another convention. */
const METHODS = new Set([1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15])

const DEFAULTS = { asrSchool: 1, calculationMethod: 14 }

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prefs = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
      select: { asrSchool: true, calculationMethod: true },
    })

    // Most accounts have no preference row until they change something, so the
    // defaults are the answer rather than a 404.
    return NextResponse.json({ success: true, data: prefs ?? DEFAULTS })
  } catch (error) {
    console.error('[prayer-calc] read failed', error)
    return NextResponse.json({ error: 'Failed to load prayer settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const data: { asrSchool?: number; calculationMethod?: number } = {}

    if (body.asrSchool !== undefined) {
      const school = Number(body.asrSchool)
      if (school !== 0 && school !== 1) {
        return NextResponse.json(
          { error: 'asrSchool must be 0 (Shafi) or 1 (Hanafi)' },
          { status: 400 }
        )
      }
      data.asrSchool = school
    }

    if (body.calculationMethod !== undefined) {
      const method = Number(body.calculationMethod)
      // Rejected rather than coerced: silently substituting a method would give
      // someone times from a convention they did not choose.
      if (!METHODS.has(method)) {
        return NextResponse.json({ error: 'Unknown calculation method' }, { status: 400 })
      }
      data.calculationMethod = method
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const prefs = await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, ...DEFAULTS, ...data },
      update: data,
      select: { asrSchool: true, calculationMethod: true },
    })

    return NextResponse.json({ success: true, data: prefs })
  } catch (error) {
    console.error('[prayer-calc] write failed', error)
    return NextResponse.json({ error: 'Failed to save prayer settings' }, { status: 500 })
  }
}
