import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { captureError } from '@/lib/error-reporter'

export const dynamic = 'force-dynamic'

// Crude per-instance throttle: a broken render loop could otherwise post
// thousands of reports a minute. Grouping happens in the DB, but we shouldn't
// pay for the writes either.
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 30
const hits = new Map<string, { count: number; resetAt: number }>()

function throttled(key: string): boolean {
  const now = Date.now()
  const entry = hits.get(key)
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > MAX_PER_WINDOW
}

/** Receives client-side errors from the browser. */
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (throttled(ip)) {
      return NextResponse.json({ ok: false, throttled: true }, { status: 429 })
    }

    const body = await request.json().catch(() => null)
    if (!body?.message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 })
    }

    // Attribution is best-effort — an error can happen while signed out.
    let userId: string | null = null
    try {
      const session = await getServerSession(authOptions)
      userId = (session?.user as { id?: string } | undefined)?.id ?? null
    } catch {
      /* ignore */
    }

    await captureError({
      message: String(body.message),
      stack: body.stack ? String(body.stack) : null,
      source: 'client',
      url: body.url ? String(body.url).slice(0, 500) : null,
      userAgent: request.headers.get('user-agent'),
      userId,
      level: body.level === 'warning' || body.level === 'info' ? body.level : 'error',
      context: typeof body.context === 'object' ? body.context : null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Reporting must never surface an error of its own.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
