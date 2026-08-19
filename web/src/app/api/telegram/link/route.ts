import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyInitData } from '@/lib/telegram/init-data'
import { linkTelegramToUser } from '@/lib/telegram/account'

/**
 * Attach a Telegram account to the person already signed in.
 *
 * For the case the Mini App auto-login cannot cover: someone who already had an
 * account with an email and password, opens the app inside Telegram, and signs
 * in the ordinary way. Without this they would sign in successfully and the bot
 * would still not know who they are, so /streak and reminders would keep saying
 * "open the app once first" forever.
 *
 * The Telegram identity still comes from a verified `initData`. The session says
 * WHO is linking; the signature says WHAT they are allowed to link.
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const verified = verifyInitData(String(body.initData ?? ''))
    if (!verified.ok) {
      return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 400 })
    }

    const linked = await linkTelegramToUser(session.user.id, verified.user)
    if (!linked.ok) {
      // Already attached to somebody else. Refusing is the only safe answer:
      // moving it would quietly take over another person's account.
      return NextResponse.json({ error: 'That Telegram account is already linked' }, { status: 409 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[telegram] link failed', error)
    return NextResponse.json({ error: 'Failed to link' }, { status: 500 })
  }
}
