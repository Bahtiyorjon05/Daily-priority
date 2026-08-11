import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'

/**
 * The analytics API must not send prose.
 *
 * It used to build its insights as English template literals on the server —
 * `${rate}% of high-priority tasks done. Great focus!` — and the page rendered
 * them straight out. Server-generated English cannot be translated on the
 * client, so that whole panel stayed English on an Uzbek dashboard however
 * complete the dictionary was. Twenty-four of them.
 *
 * It also queried `task` and nothing else, then reported "focus time" computed
 * from the `estimatedTime` field on tasks — a number labelled as one thing and
 * derived from another, which could be non-zero for somebody who had never run a
 * single focus session.
 */

const api = readFileSync(join(process.cwd(), 'src/app/api/analytics/route.ts'), 'utf8')
const page = readFileSync(
  join(process.cwd(), 'src/app/(dashboard)/analytics/page.tsx'),
  'utf8'
)
const code = api.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/** Every insight code the route can emit. */
const CODES = [...code.matchAll(/code: '([A-Za-z]+)'/g)].map((m) => m[1])

describe('analytics contract', () => {
  it('emits insight codes rather than English sentences', () => {
    expect(CODES.length, 'no insight codes found').toBeGreaterThanOrEqual(20)
    // The old shape. `title`/`description` built here is untranslatable.
    expect(code).not.toMatch(/title: '/)
    expect(code).not.toMatch(/description: `/)
  })

  it('has both title and body, in both languages, for every code', () => {
    const missing: string[] = []
    for (const c of CODES) {
      for (const part of ['title', 'body']) {
        const key = `analytics.insight.${c}.${part}`
        if (!(en as Record<string, string>)[key]) missing.push(`en ${key}`)
        if (!(uz as Record<string, string>)[key]) missing.push(`uz ${key}`)
      }
    }
    expect(missing, missing.join('\n')).toEqual([])
  })

  it('declares every parameter its message interpolates', () => {
    // A message expecting {rate} while the route sends {count} renders the raw
    // placeholder — visible only in the language nobody on the team reads.
    const problems: string[] = []
    for (const c of CODES) {
      const sent = new Set(
        [
          ...code.matchAll(
            new RegExp(`code: '${c}',\\s*\\n?\\s*params: \\{([^}]*)\\}`, 'g')
          ),
        ].flatMap((m) => [...m[1].matchAll(/(\w+):/g)].map((p) => p[1]))
      )
      for (const lang of [en, uz] as Record<string, string>[]) {
        const body = lang[`analytics.insight.${c}.body`] ?? ''
        for (const ph of [...body.matchAll(/\{(\w+)\}/g)].map((m) => m[1])) {
          if (!sent.has(ph)) problems.push(`${c}: message wants {${ph}}, route does not send it`)
        }
      }
    }
    expect([...new Set(problems)], problems.join('\n')).toEqual([])
  })

  it('renders insights through the dictionary', () => {
    expect(page).toMatch(/t\(`analytics\.insight\.\$\{insight\.code\}\.title`\)/)
    expect(page).toMatch(/t\(`analytics\.insight\.\$\{insight\.code\}\.body`, insight\.params\)/)
    expect(
      /\{insight\.title\}/.test(page),
      'rendering a server-built title cannot be translated'
    ).toBe(false)
  })

  it('reports focus time from focus sessions, not task estimates', () => {
    expect(code).toMatch(/focusTime: parseFloat\(\(\(\(focusAllTime\._sum\.duration \|\| 0\) \/ 60\)\)/)
    expect(
      /focusTime: parseFloat\(avgFocusTime/.test(code),
      'avgFocusTime is derived from estimatedTime on tasks'
    ).toBe(false)
  })

  it('looks at more than tasks', () => {
    // A page called Analytics that queried one table.
    for (const model of [
      'prisma.habit.count',
      'prisma.habitCompletion.count',
      'prisma.goal.count',
      'prisma.journalEntry.count',
      'prisma.focusSession.aggregate',
      'prisma.prayerTracking.count',
    ]) {
      expect(code, `${model} missing`).toContain(model)
    }
    // Counted in the database, not by downloading rows and totalling them.
    expect(code).toMatch(/await Promise\.all\(\[/)
  })

  it('surfaces that data on the page', () => {
    expect(page).toMatch(/activity\.habits\.completionsThisWeek/)
    expect(page).toMatch(/activity\.focus\.minutesThisWeek/)
    expect(page).toMatch(/activity\.prayers\.loggedThisWeek/)
    // Guarded, so an older cached response cannot crash the page.
    expect(page).toMatch(/\{activity && \(/)
  })
})
