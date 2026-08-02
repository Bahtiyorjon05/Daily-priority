import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendPushToUser, isPushConfigured } from '@/lib/push'

/**
 * Sends a test push to the signed-in user's registered devices.
 * Lets you verify the whole pipeline (VAPID keys -> subscription -> service
 * worker) without waiting for a scheduled reminder.
 */
export async function POST() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: 'Push is not configured on the server (missing VAPID keys).' },
      { status: 503 }
    )
  }

  const devices = await prisma.pushSubscription.count({ where: { userId } })
  if (devices === 0) {
    return NextResponse.json(
      { error: 'No devices registered. Tap "Enable on this device" first.' },
      { status: 400 }
    )
  }

  const { sent, removed } = await sendPushToUser(userId, {
    title: 'Daily Priority',
    body: 'Test notification — push is working on this device. 🎉',
    url: '/dashboard',
    tag: `test-${userId}`,
  })

  return NextResponse.json({
    ok: sent > 0,
    devices,
    sent,
    removed,
    message:
      sent > 0
        ? `Sent to ${sent} device${sent === 1 ? '' : 's'}.`
        : 'No devices accepted the notification. Try re-enabling on this device.',
  })
}
