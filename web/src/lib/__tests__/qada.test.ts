import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'

/**
 * Qazo — prayers owed, and working them down.
 *
 * Verified against the live database before shipping: three concurrent makeups
 * all counted, a -100 on a debt of 30 floored at 0 rather than going negative,
 * the unique index held at one row per prayer, and deleting the user left no
 * orphans.
 *
 * The design decisions worth protecting:
 *
 *  - Two totals, not one net figure. `owed - madeUp` can be audited, and it keeps
 *    "I have prayed 400 of these" distinct from "I owed 400 fewer than I thought".
 *  - Deltas, not absolute values. This is a number people care about being exact;
 *    last-write-wins on a total silently discards a concurrent change.
 *  - Today's missed prayers are OFFERED, never added automatically. Incrementing
 *    a religious debt on someone's behalf would be wrong more often than right.
 */

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')
const strip = (s: string) => s.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const api = strip(read('src/app/api/qada/route.ts'))
const ui = strip(read('src/components/prayer/QadaTracker.tsx'))
const page = strip(read('src/app/(dashboard)/prayers/page.tsx'))
const sweep = strip(read('src/lib/qada-sweep.ts'))
const schema = read('prisma/schema.prisma')

describe('qada tracking', () => {
  it('stores owed and made up separately', () => {
    const model = /model QadaDebt \{([^]*?)\n\}/.exec(schema)?.[1] ?? ''
    expect(model, 'QadaDebt not found').toBeTruthy()
    expect(model).toMatch(/owed\s+Int/)
    expect(model).toMatch(/madeUp\s+Int/)
    // One row per prayer per user, or two devices create two debts.
    expect(model).toMatch(/@@unique\(\[userId, prayer\]\)/)
    // The debt must not survive the account.
    expect(model).toMatch(/onDelete: Cascade/)
  })

  it('applies changes as increments, not assignments', () => {
    expect(api).toMatch(/owed: \{ increment: owedDelta \}/)
    expect(api).toMatch(/madeUp: \{ increment: madeUpDelta \}/)
    // An absolute write would make a second tab's change vanish.
    expect(api).not.toMatch(/owed: Number\(body\.owed\)/)
  })

  it('never reports a negative debt', () => {
    // Prisma has no "increment but not below zero", so a decrement is applied
    // and then floored — in the same transaction as the increment.
    expect(api).toMatch(/owed: \{ lt: 0 \}/)
    expect(api).toMatch(/madeUp: \{ lt: 0 \}/)
    expect(api).toMatch(/remaining: Math\.max\(0, owed - madeUp\)/)
    expect(api).toMatch(/\$transaction/)
  })

  it('rejects an unknown prayer and an absurd delta', () => {
    expect(api).toMatch(/isPrayer\(c\.prayer\)/)
    expect(api).toMatch(/MAX_DELTA/)
    expect(api).toMatch(/Math\.abs\(owedDelta\) > MAX_DELTA/)
  })

  it('accepts several changes in one request', () => {
    // "Add today's four missed prayers" is one intent; four requests can
    // half-fail and leave the count wrong.
    expect(api).toMatch(/Array\.isArray\(body\.changes\)/)
    expect(api).toMatch(/changes\.length > PRAYERS\.length/)
  })

  it('returns all five prayers even with no rows yet', () => {
    // Otherwise the client has to know which prayers exist in the database
    // rather than which exist in Islam.
    expect(api).toMatch(/PRAYERS\.map\(\(prayer\) =>/)
    expect(api).toMatch(/byPrayer\.get\(prayer\)/)
  })

  it('offers today’s missed prayers instead of adding them', () => {
    expect(page).toMatch(/missedToday=\{PRAYER_SEQUENCE\.filter\(\(p\) => prayerStateOf\(p\) === 'missed'\)\}/)
    // A button, not an effect.
    expect(ui).toMatch(/onClick=\{\(\) => apply\(missedToday\.map/)
    expect(
      /useEffect\([^)]*apply\(missedToday/.test(ui),
      'missed prayers must never be added automatically'
    ).toBe(false)
  })

  it('takes the server’s totals as the truth after a write', () => {
    // The route applied the increments; merging our own guess on top would drift.
    const apply = ui.slice(ui.indexOf('const apply'), ui.indexOf('if (rows === null)'))
    expect(apply).toMatch(/setRows\(json\.data\)/)
    expect(apply).toMatch(/setTotals\(json\.totals\)/)
    // And a failure must resync rather than leave an optimistic lie on screen.
    expect(apply).toMatch(/await load\(\)/)
  })

  it('keeps every control tappable', () => {
    const buttons = ui.match(/h-11/g) ?? []
    expect(buttons.length, 'plus, minus and prayed all need 44px').toBeGreaterThanOrEqual(3)
  })

  it('is translated in both languages', () => {
    const keys = [...ui.matchAll(/t\('((?:ui|nav|prayer)\.[A-Za-z]+)'/g)].map((m) => m[1])
    expect(keys.length).toBeGreaterThan(8)
    const missing: string[] = []
    for (const k of new Set(keys)) {
      if (!(en as Record<string, string>)[k]) missing.push(`en ${k}`)
      if (!(uz as Record<string, string>)[k]) missing.push(`uz ${k}`)
    }
    expect(missing, missing.join('\n')).toEqual([])
  })
  /**
   * The automatic sweep. Verified against the live database before shipping:
   *
   *   day A — Fajr + Dhuhr logged, three left    -> 3 added
   *   day B — a row exists, nothing completed    -> 5 added
   *   day C — dormant, no rows at all            -> 0 added
   *   second run                                 -> 0 added (idempotent)
   *   watermark                                  -> yesterday, today untouched
   */
  it('only counts days the app was demonstrably used', () => {
    /*
     * Treating every unlogged prayer as missed reads absence of a log as
     * evidence of a missed prayer, and it usually is not: someone who signs up,
     * uses the app for three days and returns two months later probably prayed
     * and stopped ticking boxes. Charging them 300 silently would be wrong, and
     * the kind of wrong that makes a person delete the app.
     */
    expect(sweep).toMatch(/if \(!entry\.logged\) continue/)
    expect(sweep).toMatch(/entry\.logged = true/)
  })

  it('never sweeps today', () => {
    // Today's prayers may still be prayed — including as qazo within the day.
    expect(sweep).toMatch(/const yesterday = startOfDay\(new Date\(Date\.now\(\) - DAY\)\)/)
    expect(sweep).toMatch(/date: \{ gte: from, lte: yesterday \}/)
  })

  it('is idempotent through a watermark', () => {
    // Without it, every page load re-counts the same days and the debt climbs
    // forever.
    expect(sweep).toMatch(/qadaAutoThrough/)
    expect(sweep).toMatch(/startOfDay\(prefs\.qadaAutoThrough\)\.getTime\(\) \+ DAY/)
    // The UPDATE branch specifically: `create` carries the same string, so a
    // gutted `update: {}` matched a file-wide search and passed.
    expect(sweep).toMatch(/update: \{ qadaAutoThrough: yesterday \}/)
  })

  it('advances the watermark in the same transaction as the increments', () => {
    // A failure must re-run the whole window rather than half-apply it.
    const tx = sweep.slice(sweep.indexOf('await prisma.$transaction'))
    expect(tx).toMatch(/tx\.qadaDebt\.upsert/)
    // `tx.`, not `prisma.` — the same call on the ambient client is outside the
    // transaction and matched the looser assertion this replaced.
    expect(tx).toMatch(/await tx\.userPreference\.upsert/)
    expect(tx).toMatch(/increment: count/)
  })

  it('bounds a first run', () => {
    // A long-dormant account must not trigger an enormous single sweep.
    // Used in the floor, not just declared — leaving the const in place while
    // widening the window passed the previous version of this check.
    expect(sweep).toMatch(/Date\.now\(\) - MAX_WINDOW_DAYS \* DAY/)
    // `[^)]*` cannot cross the closing parens inside `getTime()`, so the first
    // version of this could never match the real expression.
    expect(sweep).toMatch(/Math\.max\([^;]*floor\.getTime\(\)/)
  })

  it('reads the window in one query', () => {
    // Per-day queries would be dozens of round trips on a page load.
    expect(sweep).toMatch(/prisma\.prayerTracking\.findMany/)
    expect((sweep.match(/prisma\.prayerTracking\./g) ?? []).length).toBe(1)
  })

  it('says what it added rather than letting the number move silently', () => {
    // A debt that grows on its own with no explanation looks like a bug.
    expect(api).toMatch(/autoAdded: swept\.added/)
    expect(ui).toMatch(/ui\.qadaAutoAdded/)
    expect(ui, 'and the rule it used').toMatch(/ui\.qadaAutoRule/)
  })

  it('lets a failed sweep still show the debt', () => {
    // Best-effort: someone must always be able to see and adjust what they owe.
    const guard = api.slice(api.indexOf('let swept'), api.indexOf('const rows'))
    expect(guard).toMatch(/try \{/)
    expect(guard).toMatch(/catch \(error\)/)
  })
})
