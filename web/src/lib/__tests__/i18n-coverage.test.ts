import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import en from '@/messages/en.json'
import uz from '@/messages/uz.json'

/**
 * Literal text that is the same in every language: identifiers, addresses and
 * the product name. Keep this list short and justified — anything added here
 * stops being checked.
 */
const ALLOWED = new Set([
  'Daily Priority', // product name
  '/api/cron/reminders', // API path shown to the admin
  'dailypriorityapp@gmail.com', // support address
  '@Bahtiyorjon05', // Telegram handle
  'null', // rendered literal in the admin table viewer
])

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
    // Copy that lives in plain modules is passed through as English text and
    // resolved by value, so an argument is valid as either a key or a known
    // English string.
    const englishValues = new Set(Object.values(en as Record<string, string>))

    for (const file of FILES) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(CALL)) {
        const key = m[1]
        // Namespaced keys only — plain t('x') elsewhere isn't ours.
        if (!key.includes('.')) continue
        if (!(key in en) && !englishValues.has(key)) {
          missing.push(`${file.replace(SRC, 'src')} -> ${key}`)
        }
      }
    }

    expect(missing).toEqual([])
  })

  it('every English key has an Uzbek counterpart', () => {
    expect(Object.keys(en).filter(k => !(k in uz))).toEqual([])
  })

  it('no user-facing JSX text is left hard-coded', { timeout: 30_000 }, () => {
    // Parsed, not pattern-matched. The first version of this test used a
    // `>text<` regex and passed while 216 strings were still English — it
    // couldn't see text adjacent to a `{expr}`, which is exactly the shape of a
    // sentence broken up by a styled <span>. That's how the landing page ended
    // up reading "achieve goals with Islomiy tamoyillar". The parser reports
    // JsxText spans directly, so there is nothing to miss.
    const offenders: string[] = []

    for (const file of FILES) {
      if (!file.endsWith('.tsx')) continue
      const src = readFileSync(file, 'utf8')
      if (!src.includes("'use client'") && !src.includes('"use client"')) continue

      const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      const visit = (node: ts.Node) => {
        if (ts.isJsxText(node)) {
          const text = node.text.trim()
          if (text && /[A-Za-z]{3,}/.test(text) && !ALLOWED.has(text)) {
            offenders.push(`${file.replace(SRC, 'src')} -> ${text}`)
          }
        }
        ts.forEachChild(node, visit)
      }
      visit(sf)
    }

    expect(offenders).toEqual([])
  })

  it('no user-facing copy is left hard-coded in data', { timeout: 30_000 }, () => {
    // The third blind spot. Copy stored as `{ title: 'Yours to override' }` in
    // an array that gets .map()ed into JSX renders exactly like a text node,
    // but to the parser it is a plain string, so the JsxText check above walks
    // straight past it. That is how the showcase panel stayed English after two
    // sweeps that both reported themselves complete.
    const COPY_KEYS = new Set([
      'title', 'label', 'body', 'description', 'subtitle', 'blurb', 'note',
      'metric', 'eyebrow', 'heading', 'placeholder', 'tooltip', 'hint', 'cta',
    ])
    const known = new Set(Object.values(en as Record<string, string>))
    const offenders: string[] = []

    for (const file of FILES) {
      if (!file.endsWith('.tsx')) continue
      const src = readFileSync(file, 'utf8')
      if (!src.includes("'use client'") && !src.includes('"use client"')) continue

      const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      const visit = (node: ts.Node) => {
        if (
          ts.isPropertyAssignment(node) &&
          node.name &&
          ts.isStringLiteralLike(node.initializer)
        ) {
          const key = node.name.getText().replace(/['"]/g, '')
          const text = node.initializer.text
          const looksLikeCopy =
            /\s/.test(text) && /[A-Za-z]{3}/.test(text) && !/^[a-z-]+(?:\s[a-z-]+)*$/.test(text)
          if (COPY_KEYS.has(key) && looksLikeCopy && !known.has(text) && !ALLOWED.has(text)) {
            offenders.push(`${file.replace(SRC, 'src')} -> ${key}: ${text.slice(0, 60)}`)
          }
        }
        ts.forEachChild(node, visit)
      }
      visit(sf)
    }

    expect(offenders).toEqual([])
  })
})
