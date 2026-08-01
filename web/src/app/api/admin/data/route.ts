import { NextRequest, NextResponse } from 'next/server'
import { getAdminModel, getDelegate, getOrderBy, type AdminModelKey } from '@/lib/admin-models'
import { decryptPassword } from '@/lib/password-vault'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 200

/**
 * Returns a page of rows for one model. Reads only — never mutates.
 * For the User model, the AES-encrypted password is decrypted into a
 * `password (decrypted)` column and the raw ciphertext/hash are dropped from
 * the payload to keep the table readable.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const modelKey = searchParams.get('model') || ''
  const model = getAdminModel(modelKey)

  if (!model) {
    return NextResponse.json({ error: 'Unknown model' }, { status: 400 })
  }

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  )

  const delegate = getDelegate(model.key as AdminModelKey)

  try {
    const total = await delegate.count()

    // Newest-first where the model has a createdAt column (registry-driven so we
    // never issue a query that would fail on models without it).
    const orderBy = getOrderBy(model.key as AdminModelKey)
    let rows = (await delegate.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      ...(orderBy ? { orderBy } : {}),
    })) as Record<string, unknown>[]

    if (model.key === 'user') {
      rows = rows.map((row) => {
        const { passwordEnc, password, ...rest } = row
        return {
          ...rest,
          'password (decrypted)': decryptPassword(passwordEnc as string | null),
          passwordHash: password ? '••• bcrypt hash •••' : null,
        }
      })
    }

    const columns = deriveColumns(rows)

    return NextResponse.json({
      model: model.key,
      label: model.label,
      columns,
      rows: rows.map(serializeRow),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    })
  } catch (error) {
    console.error('[admin/data] query failed for', model.key, error)
    return NextResponse.json(
      { error: 'Failed to load model data' },
      { status: 500 }
    )
  }
}

/** Union of keys across the page's rows, so sparse columns still appear. */
function deriveColumns(rows: Record<string, unknown>[]): string[] {
  const seen = new Set<string>()
  const order: string[] = []
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key)
        order.push(key)
      }
    }
  }
  // Surface id first if present.
  return order.sort((a, b) => (a === 'id' ? -1 : b === 'id' ? 1 : 0))
}

/** JSON-safe values: Date -> ISO, bigint -> string, objects -> compact JSON. */
function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Date) out[k] = v.toISOString()
    else if (typeof v === 'bigint') out[k] = v.toString()
    else out[k] = v
  }
  return out
}
