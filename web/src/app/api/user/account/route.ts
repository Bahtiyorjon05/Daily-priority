import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sanitizeEmail, sanitizeString } from '@/lib/sanitize'
import { createLogger } from '@/lib/logger'

const logger = createLogger('account-deletion')

/**
 * Account deletion — a soft delete.
 *
 * The row and every related record stay. `deletedAt` is what closes the
 * account: the auth layer refuses sign-in from that moment, so the effect is
 * immediate and total from the user's side, while the admin console keeps the
 * full history it needs.
 *
 * Confirmation is by exact email match, checked **here** and not only in the
 * form. A client-side gate is a usability affordance; the server is the security
 * boundary, and this endpoint must be safe to call directly.
 *
 * Deliberately not requiring the password: Google-only accounts don't have one,
 * so it would make the flow impossible for exactly the users most likely to want
 * it. The caller already holds a valid session, and the typed email proves they
 * know which account they're closing.
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { confirmEmail, reason } = (body ?? {}) as { confirmEmail?: string; reason?: string }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, deletedAt: true },
  })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Idempotent: a second call shouldn't 500 or move the timestamp.
  if (user.deletedAt) {
    return NextResponse.json({ deleted: true, deletedAt: user.deletedAt.toISOString() })
  }

  const typed = sanitizeEmail(confirmEmail ?? '')
  if (!typed || typed !== sanitizeEmail(user.email)) {
    return NextResponse.json(
      { error: 'The email you typed does not match this account.' },
      { status: 400 }
    )
  }

  const deletedAt = new Date()
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt,
        deletionReason: reason ? sanitizeString(reason).slice(0, 500) : null,
      },
    }),
    // Drop server-side sessions so any other signed-in device is logged out too,
    // not just the browser that made the request.
    prisma.session.deleteMany({ where: { userId: user.id } }),
    // Stop push immediately — a closed account must not keep sending adhan
    // notifications to someone's phone.
    prisma.pushSubscription.deleteMany({ where: { userId: user.id } }),
  ])

  logger.warn('Account deleted by user', { userId: user.id })

  return NextResponse.json({ deleted: true, deletedAt: deletedAt.toISOString() })
}

/** Lets the settings page show the account's current state. */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, deletedAt: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  return NextResponse.json({
    email: user.email,
    deleted: Boolean(user.deletedAt),
    deletedAt: user.deletedAt?.toISOString() ?? null,
  })
}
