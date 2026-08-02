import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/** Grouped error list for the admin console. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showResolved = searchParams.get('resolved') === '1'

    const [errors, openCount, resolvedCount] = await Promise.all([
      prisma.errorLog.findMany({
        where: { resolved: showResolved },
        orderBy: { lastSeenAt: 'desc' },
        take: 100,
      }),
      prisma.errorLog.count({ where: { resolved: false } }),
      prisma.errorLog.count({ where: { resolved: true } }),
    ])

    return NextResponse.json({
      errors: errors.map((e) => ({
        ...e,
        firstSeenAt: e.firstSeenAt.toISOString(),
        lastSeenAt: e.lastSeenAt.toISOString(),
      })),
      openCount,
      resolvedCount,
    })
  } catch (error) {
    console.error('[admin/errors] failed', error)
    return NextResponse.json({ error: 'Failed to load errors' }, { status: 500 })
  }
}

/** Mark an error resolved / unresolved, or clear resolved ones. */
export async function PATCH(request: NextRequest) {
  try {
    const { id, resolved, clearResolved } = await request.json()

    if (clearResolved) {
      const { count } = await prisma.errorLog.deleteMany({ where: { resolved: true } })
      return NextResponse.json({ ok: true, deleted: count })
    }

    if (typeof id !== 'string') {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }
    await prisma.errorLog.update({
      where: { id },
      data: { resolved: Boolean(resolved) },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[admin/errors] update failed', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
