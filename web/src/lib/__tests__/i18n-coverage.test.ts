import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'

/**
 * Guards the bilingual sweep against drift.
 *
 * Two ways this silently breaks: a `t('key')` whose key was never added to the
 * dictionary (the UI then renders the literal string "ui.someKey"), and a new
 * hard-coded English string added to a page that has already been translated.
 * Both look fine in review and only show up to an Uzbek-speaking user.
 */

const SRC = join(process.cwd(), 'src')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) {
      if (entry !== '__tests__' && entry !== 'node_modules') walk(p, out)
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      out.push(p)
    }
  }
  return out
}

const FILES = walk(SRC)
// The codemod aliases the binding when a file already uses `t` for something
// else (calendar/page.tsx binds it as a toast callback param).
const CALL = /\b(?:t|tr|tI18n|tMsg)\(\s*'([^']+)'/g

describe('translation key coverage', () => {
  it('every translated key referenced in code exists in the dictionary', () => {
    const missing: string[] = []

    for (const file of FILES) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(CALL)) {
        const key = m[1]
        // Namespaced keys only — plain t('x') elsewhere isn't ours.
        if (!key.includes('.')) continue
        if (!(key in en)) missing.push(`${file.replace(SRC, 'src')} -> ${key}`)
      }
    }

    expect(missing).toEqual([])
  })

  it('every English key has an Uzbek counterpart', () => {
    expect(Object.keys(en).filter(k => !(k in uz))).toEqual([])
  })

  it('no user-facing JSX text is left hard-coded', () => {
    // Matches a capitalised text node between tags. Deliberately narrow: it
    // catches the `>Some Label<` shape the sweep replaced, without flagging
    // interpolations, punctuation-only nodes, or lowercase fragments.
    const TEXT = /(?<![=-])>\s*([A-Z][A-Za-z0-9 ,.'’!?&:%/()—–-]{2,80})\s*</g
    const offenders: string[] = []

    for (const file of FILES) {
      if (!file.endsWith('.tsx')) continue
      const src = readFileSync(file, 'utf8')
      if (!src.includes("'use client'") && !src.includes('"use client"')) continue
      for (const m of src.matchAll(TEXT)) {
        const text = m[1].trim()
        if (!/[A-Za-z]{3,}/.test(text)) continue
        offenders.push(`${file.replace(SRC, 'src')} -> ${text}`)
      }
    }

    expect(offenders).toEqual([])
  })
})
