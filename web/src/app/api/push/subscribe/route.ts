import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Registers (or refreshes) this browser's push endpoint for the signed-in user. */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { endpoint, keys } = await request.json()
    if (typeof endpoint !== 'string' || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get('user-agent') || undefined,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[push/subscribe] failed', error)
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}

/** Removes this browser's endpoint (called when the user turns push off). */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as { id?: string } | undefined)?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { endpoint } = await request.json()
    if (typeof endpoint === 'string') {
      await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[push/unsubscribe] failed', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}
