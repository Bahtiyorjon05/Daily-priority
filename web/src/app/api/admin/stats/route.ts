import { NextResponse } from 'next/server'
import { ADMIN_MODELS, getDelegate } from '@/lib/admin-models'
import { isVaultConfigured } from '@/lib/password-vault'

/** Row counts per model, for the dashboard sidebar and overview cards. */
export async function GET() {
  try {
    const counts = await Promise.all(
      ADMIN_MODELS.map(async (m) => {
        try {
          const count = await getDelegate(m.key).count()
          return [m.key, count] as const
        } catch {
          return [m.key, null] as const
        }
      })
    )

    return NextResponse.json({
      counts: Object.fromEntries(counts),
      vaultConfigured: isVaultConfigured(),
    })
  } catch (error) {
    console.error('[admin/stats] failed', error)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
