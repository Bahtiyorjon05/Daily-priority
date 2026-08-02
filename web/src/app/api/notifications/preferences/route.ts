import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const DEFAULTS = {
  prayerReminders: true,
  prayerLeadMinutes: 10,
  taskReminders: true,
  habitReminders: true,
  habitReminderHour: 20,
  weeklyReviewEmail: true,
  quietHoursStart: null as number | null,
  quietHoursEnd: null as number | null,
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } })
  return NextResponse.json({ preferences: prefs ?? { userId, ...DEFAULTS } })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()

    // NOTE: must reject null/''/undefined explicitly — Number(null) and
    // Number('') are both 0, so "Off" in the UI used to be stored as hour 0.
    // Paired with an end hour that silently muted notifications all night.
    const clampHour = (v: unknown): number | null => {
      if (v === null || v === undefined || v === '') return null
      const n = Number(v)
      return Number.isInteger(n) && n >= 0 && n <= 23 ? n : null
    }
    const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback)

    const data = {
      prayerReminders: bool(body.prayerReminders, DEFAULTS.prayerReminders),
      prayerLeadMinutes: Math.min(60, Math.max(0, Number(body.prayerLeadMinutes) || 0)),
      taskReminders: bool(body.taskReminders, DEFAULTS.taskReminders),
      habitReminders: bool(body.habitReminders, DEFAULTS.habitReminders),
      habitReminderHour: clampHour(body.habitReminderHour) ?? DEFAULTS.habitReminderHour,
      weeklyReviewEmail: bool(body.weeklyReviewEmail, DEFAULTS.weeklyReviewEmail),
      quietHoursStart: clampHour(body.quietHoursStart),
      quietHoursEnd: clampHour(body.quietHoursEnd),
    }

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })

    return NextResponse.json({ preferences: prefs })
  } catch (error) {
    console.error('[notifications/preferences] failed', error)
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
