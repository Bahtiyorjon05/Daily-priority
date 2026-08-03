import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isPushConfigured } from '@/lib/push'
import { isVaultConfigured } from '@/lib/password-vault'

export const dynamic = 'force-dynamic'

/**
 * System health for the admin console: is the external scheduler actually
 * calling us, is push configured, are there unresolved errors.
 */
export async function GET() {
  try {
    const [runs, openErrors, pushDevices] = await Promise.all([
      prisma.cronRun.findMany({ orderBy: { lastRunAt: 'desc' } }),
      prisma.errorLog.count({ where: { resolved: false } }),
      prisma.pushSubscription.count(),
    ])

    // Reminders should fire every few minutes; beyond 20 the schedule is
    // almost certainly dead. The weekly job is idle by design.
    const STALE_AFTER_MS = 20 * 60 * 1000

    return NextResponse.json({
      jobs: runs.map((r) => {
        const ageMs = Date.now() - r.lastRunAt.getTime()
        return {
          job: r.job,
          lastRunAt: r.lastRunAt.toISOString(),
          ageMs,
          lastOk: r.lastOk,
          runCount: r.runCount,
          durationMs: r.durationMs,
          lastResult: r.lastResult,
          stale: r.job === 'reminders' ? ageMs > STALE_AFTER_MS : ageMs > 8 * 864e5,
        }
      }),
      remindersConfigured: runs.some((r) => r.job === 'reminders'),
      pushConfigured: isPushConfigured(),
      vaultConfigured: isVaultConfigured(),
      pushDevices,
      openErrors,
    })
  } catch (error) {
    console.error('[admin/health] failed', error)
    return NextResponse.json({ error: 'Failed to load health' }, { status: 500 })
  }
}
