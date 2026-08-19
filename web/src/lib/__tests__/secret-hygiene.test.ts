import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Credentials must not be in the repository.
 *
 * A bot token is a complete authentication bypass for a Mini App: whoever holds
 * it can mint `initData` that our own verifier accepts, for any user id they
 * like. Unlike a password it is not hashed anywhere and cannot be rotated
 * quietly — every leaked copy is live until someone notices.
 *
 * This scans what git actually tracks, not the working tree, because the working
 * tree legitimately contains `.env`. It is the commit that leaks.
 */

const repoRoot = join(process.cwd(), '..')

const tracked = (): string[] => {
  try {
    return execSync('git ls-files', { cwd: repoRoot, encoding: 'utf8' })
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

/*
  A Telegram bot token: a numeric bot id, a colon, then a long URL-safe secret.

  The length is a RANGE, not the exact 35 that today's tokens happen to use. The
  first version of this pattern pinned it to 35 and a 36-character test token
  walked straight past it — a guard that only catches the shape you already
  expected is not a guard.
*/
const BOT_TOKEN = /\b\d{6,12}:[A-Za-z0-9_-]{30,}/

/** Files worth reading. Binaries and lockfiles cannot hold a pasted secret in a
 *  form that matters, and reading them all makes this slow. */
const SCANNABLE = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|yml|yaml|env|txt|sh|css|html)$/

describe('secret hygiene', () => {
  it('tracks no file containing a Telegram bot token', () => {
    const files = tracked()
    expect(files.length, 'expected a git repository').toBeGreaterThan(0)

    const leaks: string[] = []
    for (const file of files) {
      if (!SCANNABLE.test(file)) continue
      if (file.includes('secret-hygiene.test.ts')) continue
      const path = join(repoRoot, file)
      if (!existsSync(path)) continue
      let content: string
      try {
        content = readFileSync(path, 'utf8')
      } catch {
        continue
      }
      if (BOT_TOKEN.test(content)) leaks.push(file)
    }

    expect(leaks, `bot token found in: ${leaks.join(', ')}`).toEqual([])
  })

  it('does not track any .env file', () => {
    // The token lives in .env and nowhere else. If .env is ever tracked, the
    // scan above becomes the only thing standing between it and a public repo.
    const envFiles = tracked().filter((f) => /(^|\/)\.env($|\.)/.test(f) && !f.endsWith('.example'))
    expect(envFiles, `tracked env files: ${envFiles.join(', ')}`).toEqual([])
  })

  it('keeps the bot token off the client', () => {
    /*
      Anything named NEXT_PUBLIC_* is inlined into the browser bundle by Next.
      A token there would be handed to every visitor, so the name itself is the
      guard — reviewers see `NEXT_PUBLIC_TELEGRAM_BOT_TOKEN` and might not think
      twice.
    */
    const sources = tracked().filter((f) => f.startsWith('web/src/') && /\.(ts|tsx)$/.test(f))
    const offenders = sources.filter((f) => {
      const path = join(repoRoot, f)
      if (!existsSync(path)) return false
      return /NEXT_PUBLIC_TELEGRAM_BOT_TOKEN|NEXT_PUBLIC_.*SECRET/.test(readFileSync(path, 'utf8'))
    })
    expect(offenders, `public env leak in: ${offenders.join(', ')}`).toEqual([])
  })

  it('never imports the server-only telegram modules from a client component', () => {
    /*
      `init-data.ts` and `api.ts` both read the token. A client component
      importing either would bundle it. `webapp.ts` is the browser half and is
      deliberately token-free.
    */
    const sources = tracked().filter((f) => f.startsWith('web/src/') && /\.(ts|tsx)$/.test(f))
    const offenders: string[] = []
    for (const f of sources) {
      const path = join(repoRoot, f)
      if (!existsSync(path)) continue
      const content = readFileSync(path, 'utf8')
      const isClient = /^\s*['"]use client['"]/m.test(content)
      const importsServer = /@\/lib\/telegram\/(init-data|api|account|bot)/.test(content)
      if (isClient && importsServer) offenders.push(f)
    }
    expect(offenders, `client components importing server telegram code: ${offenders.join(', ')}`).toEqual([])
  })
})
