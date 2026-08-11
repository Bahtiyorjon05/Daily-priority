import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'

/**
 * The weekly digest.
 *
 * It was hard-coded English end to end — the greeting, every stat label, the
 * streak heading, the CTA and the footnote — while every other email in the app
 * already went out in the recipient's language. And it led on prayers, which made
 * a productivity digest read as a prayer report.
 *
 * Habit check-ins and goals were absent altogether: two of the four things the
 * app tracks went unmentioned in a summary of what you did.
 */

const raw = readFileSync(
  join(process.cwd(), 'src/app/api/cron/weekly-review/route.ts'),
  'utf8'
)
const code = raw.replace(/\/\*[^]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const E = en as Record<string, string>
const U = uz as Record<string, string>

describe('weekly review email', () => {
  it('is sent in the recipient’s language', () => {
    expect(code, 'must resolve the recipient locale').toMatch(
      /const \{ locale, t \} = await forRecipient\(user\.email\)/
    )
    expect(code, 'subject must come from the dictionary').toMatch(
      /subject: t\('email\.weekly\.subject'\)/
    )
    expect(code, 'the template needs the locale for lang and footer').toMatch(
      /locale: d\.locale as 'en' \| 'uz'/
    )
  })

  it('has no hard-coded English copy left', () => {
    // The exact strings that used to be in here.
    for (const gone of [
      'Assalamu alaikum',
      'Your week in review',
      'Prayers logged',
      'Tasks completed',
      'Your streaks',
      'Open Daily Priority',
      'Your week on Daily Priority',
    ]) {
      expect(code, `"${gone}" should come from the dictionary`).not.toContain(gone)
    }
    // And no English pluralisation bolted onto a value.
    expect(code).not.toMatch(/\? 'task' : 'tasks'/)
    expect(code).not.toMatch(/\? 'day' : 'days'/)
    expect(code).not.toMatch(/\? 'session' : 'sessions'/)
  })

  it('translates every key it uses, in both languages', () => {
    const keys = [...code.matchAll(/t\('(email\.[A-Za-z.]+)'/g)].map((m) => m[1])
    expect(keys.length, 'no dictionary lookups found').toBeGreaterThan(15)

    const missing: string[] = []
    for (const k of new Set(keys)) {
      if (!E[k]) missing.push(`en ${k}`)
      if (!U[k]) missing.push(`uz ${k}`)
    }
    expect(missing, missing.join('\n')).toEqual([])
  })

  it('leads on tasks and habits, not prayers', () => {
    // A productivity digest that opens on prayers reads as a prayer report.
    const headline = code.slice(code.indexOf('const headline ='), code.indexOf('const rows ='))
    const tasksAt = headline.indexOf('headlineTasks')
    const prayersAt = headline.indexOf('headlinePrayers')
    expect(tasksAt).toBeGreaterThan(-1)
    expect(prayersAt).toBeGreaterThan(-1)
    expect(tasksAt, 'tasks must be checked before prayers').toBeLessThan(prayersAt)
  })

  it('counts habit check-ins and goals', () => {
    expect(code).toMatch(/prisma\.habitCompletion\.count/)
    expect(code).toMatch(/prisma\.goal\.count\(\{ where: \{ userId: user\.id \} \}\)/)
    expect(code).toMatch(/status: 'COMPLETED'/)
    // And they must reach the email, not just the query.
    expect(code).toMatch(/email\.weekly\.habits'/)
    expect(code).toMatch(/email\.weekly\.goals'/)
  })

  it('counts habit activity toward "did anything happen"', () => {
    // Someone who only ticked habits would otherwise get no email at all.
    const guard = code.slice(code.indexOf('const anyActivity'), code.indexOf('if (!anyActivity)'))
    expect(guard).toMatch(/habitCheckIns/)
  })

  it('omits empty rows rather than printing zeroes', () => {
    // A column of zeroes is a reason to close the email.
    expect(code).toMatch(/\.filter\(Boolean\)/)
    expect(code).toMatch(/d\.habitCheckIns > 0/)
    expect(code).toMatch(/d\.goalsTotal > 0/)
  })

  it('says something kind when the week was empty', () => {
    expect(code).toMatch(/email\.weekly\.quiet/)
    expect(E['email.weekly.quiet']).toBeTruthy()
    expect(U['email.weekly.quiet']).toBeTruthy()
  })

  it('builds links from the guarded base url', () => {
    // NEXT_PUBLIC_APP_URL alone shipped localhost:3000 into real emails once.
    expect(code).toMatch(/appUrl: emailBaseUrl\(\)/)
    expect(code).not.toMatch(/process\.env\.NEXT_PUBLIC_APP_URL \|\|/)
  })

  it('never divides by zero building its meters', () => {
    expect(code).toMatch(/d\.prayers > 0 \? Math\.round/)
    expect(code).toMatch(/d\.tasksCreated > 0 \? Math\.min/)
  })

  it('escapes anything the user typed', () => {
    // Habit titles go into HTML.
    expect(code).toMatch(/escapeHtml\(h\.title\)/)
    expect(code).toMatch(/escapeHtml\(t\('email\.weekly\.greeting'/)
  })
})
