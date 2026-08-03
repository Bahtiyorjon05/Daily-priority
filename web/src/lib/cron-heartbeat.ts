import { prisma } from './prisma'

/**
 * Records that a scheduled job ran.
 *
 * Reminders are driven by an external scheduler (cron-job.org), so there's no
 * platform dashboard telling us whether it's actually firing. This heartbeat is
 * how the admin console can say "last ran 3 minutes ago" — or make it obvious
 * that the schedule is dead.
 *
 * Never throws: a bookkeeping failure must not fail the job itself.
 */
export async function recordCronRun(
  job: string,
  ok: boolean,
  result?: Record<string, unknown>,
  durationMs?: number
): Promise<void> {
  try {
    await prisma.cronRun.upsert({
      where: { job },
      update: {
        lastRunAt: new Date(),
        lastOk: ok,
        runCount: { increment: 1 },
        lastResult: (result as never) ?? undefined,
        durationMs: durationMs ?? undefined,
      },
      create: {
        job,
        lastOk: ok,
        runCount: 1,
        lastResult: (result as never) ?? undefined,
        durationMs: durationMs ?? undefined,
      },
    })
  } catch (err) {
    console.error('[cron-heartbeat] failed to record run:', (err as Error).message)
  }
}
