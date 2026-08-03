import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeTitle } from '@/lib/sanitize'

export const dynamic = 'force-dynamic'

/** Current onboarding state, so the client knows whether to show the flow. */
export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardedAt: true, name: true, location: true, timezone: true },
  })

  return NextResponse.json({
    onboarded: Boolean(user?.onboardedAt),
    name: user?.name ?? null,
    location: user?.location ?? null,
    timezone: user?.timezone ?? null,
  })
}

interface Body {
  location?: { label?: string; latitude?: number; longitude?: number; timezone?: string }
  habits?: string[]
  prayerReminders?: boolean
  prayerLeadMinutes?: number
  /** Set when the user skips — we still mark them onboarded so they aren't re-prompted. */
  skipped?: boolean
}

/**
 * Completes onboarding.
 *
 * Everything here is best-effort *except* marking the user onboarded: a failure
 * to create a starter habit must not trap someone in the flow forever. Each
 * step is therefore independently guarded, and the flag is written last.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const created = { habits: 0, location: false, reminders: false }

  try {
    const body = (await request.json().catch(() => ({}))) as Body

    // --- Location (drives prayer times, the core of the product) ------------
    if (body.location?.label) {
      try {
        const tz = body.location.timezone
        await prisma.user.update({
          where: { id: userId },
          data: {
            location: sanitizeTitle(body.location.label)?.slice(0, 200) || null,
            // Only accept a timezone the runtime actually recognises.
            ...(tz && isValidTimeZone(tz) ? { timezone: tz } : {}),
          },
        })
        created.location = true
      } catch (e) {
        console.error('[onboarding] location failed', (e as Error).message)
      }
    }

    // --- Starter habits -----------------------------------------------------
    // An empty app reads as broken; one habit gives the dashboard something to
    // show and something to tick on day one.
    const titles = (body.habits ?? [])
      .map((t) => sanitizeTitle(t)?.slice(0, 120))
      .filter((t): t is string => Boolean(t))
      .slice(0, 5)

    if (titles.length > 0) {
      try {
        const existing = await prisma.habit.count({ where: { userId } })
        if (existing === 0) {
          await prisma.habit.createMany({
            data: titles.map((title) => ({ title, userId, frequency: 'DAILY' as const, targetDays: 7 })),
          })
          created.habits = titles.length
        }
      } catch (e) {
        console.error('[onboarding] habits failed', (e as Error).message)
      }
    }

    // --- Reminder preferences ----------------------------------------------
    if (typeof body.prayerReminders === 'boolean') {
      try {
        const lead = Number.isInteger(body.prayerLeadMinutes)
          ? Math.min(60, Math.max(0, body.prayerLeadMinutes as number))
          : 10
        await prisma.notificationPreference.upsert({
          where: { userId },
          update: { prayerReminders: body.prayerReminders, prayerLeadMinutes: lead },
          create: { userId, prayerReminders: body.prayerReminders, prayerLeadMinutes: lead },
        })
        created.reminders = true
      } catch (e) {
        console.error('[onboarding] reminders failed', (e as Error).message)
      }
    }

    // Written last, and unconditionally: nobody should be stuck in onboarding
    // because a side-effect failed.
    await prisma.user.update({
      where: { id: userId },
      data: { onboardedAt: new Date() },
    })

    return NextResponse.json({ ok: true, skipped: Boolean(body.skipped), ...created })
  } catch (error) {
    console.error('[onboarding] failed', error)
    // Even on an unexpected error, don't leave the user in a loop.
    await prisma.user
      .update({ where: { id: userId }, data: { onboardedAt: new Date() } })
      .catch(() => {})
    return NextResponse.json({ ok: true, degraded: true })
  }
}

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz })
    return true
  } catch {
    return false
  }
}
