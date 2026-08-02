import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Tells the client whether the signed-in user is the app owner, so the UI can
 * show a shortcut to /admin. This only controls link visibility — the admin
 * area is still protected by its own password + signed cookie, so a non-owner
 * learning the URL gains nothing.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.toLowerCase().trim()
  if (!email) return NextResponse.json({ isOwner: false })

  const owners = (process.env.OWNER_EMAILS || '')
    .split(',')
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean)

  return NextResponse.json({ isOwner: owners.includes(email) })
}
