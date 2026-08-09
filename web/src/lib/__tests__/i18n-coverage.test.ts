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
  /**
   * The blind spot this closes.
   *
   * The dashboard's status chips rendered
   *   `filterOption.charAt(0).toUpperCase() + filterOption.slice(1)`
   * over `['all', 'pending', 'completed']` — producing "All", "Pending" and
   * "Completed" with no message key anywhere. Every other check in this file
   * looks for English text in the source, and here the English text does not
   * exist: it is manufactured at runtime from a state key. So the chips stayed
   * English in Uzbek and nothing could detect it.
   *
   * Capitalising an identifier for display is always this bug. A person's
   * initial or a chart axis is fine; a word a user reads is not.
   */
  it('never manufactures a user-facing label by capitalising an identifier', () => {
    const offenders: string[] = []

    // Keyboard shortcuts are the one legitimate case: `Ctrl`, `Shift`, `Enter`
    // and the letter keys are what is printed on the physical keyboard, so
    // localising them would stop them matching the hardware.
    const EXEMPT = ['hooks/useKeyboardShortcuts.ts']

    for (const file of FILES) {
      const rel = file.slice(SRC.length + 1).split('\\').join('/')
      if (EXEMPT.includes(rel)) continue
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/(\w[\w.]*)\.charAt\(0\)\.toUpperCase\(\)\s*\+\s*\1\.slice\(1\)/g)) {
        // An avatar initial is a single character, not a word — those use
        // `charAt(0).toUpperCase()` with no `.slice(1)` concatenation and so
        // never match here.
        offenders.push(`${rel}: ${m[0]}`)
      }
    }

    expect(
      offenders,
      'derive the label from a message key, not from the identifier:\n' + offenders.join('\n')
    ).toEqual([])
  })
  /**
   * Third variant of the same blind spot.
   *
   * The other checks read JSX *text*; copy sitting in an attribute was never a
   * candidate. That left `<LoadingState message="Loading your dashboard..." />`
   * on the dashboard and in the shell, and `subtitle="Last 7 days"` in the
   * prayer stats — all three with keys that already existed and were already
   * translated. They simply were not wired up.
   */
  it('never passes user-facing copy as a bare string prop', () => {
    // Props whose value a user reads. `title` is included because it also
    // surfaces as a tooltip.
    const COPY_PROPS = ['message', 'subtitle', 'placeholder', 'label', 'heading']
    // The privacy policy is deliberately English-only for now — it is a legal
    // document, and a machine-assisted translation of one is worse than none.
    const EXEMPT = ['app/privacy/page.tsx']
    const offenders: string[] = []

    for (const file of FILES) {
      if (!file.endsWith('.tsx')) continue
      const rel = file.slice(SRC.length + 1).split('\\').join('/')
      if (EXEMPT.includes(rel)) continue
      const src = readFileSync(file, 'utf8')

      for (const prop of COPY_PROPS) {
        // Two or more words starting with a capital: a sentence, not a token
        // like "lg" or an aria role. Single words are too often enum-ish.
        const re = new RegExp(`\\b${prop}="([A-Z][^"]*\\s[^"]*)"`, 'g')
        for (const m of src.matchAll(re)) {
          offenders.push(`${rel}: ${prop}="${m[1]}"`)
        }
      }
    }

    expect(
      offenders,
      'wrap these in t(...) — an attribute is still copy:\n' + offenders.join('\n')
    ).toEqual([])
  })
  /**
   * Fifth variant. `{saving ? 'Deleting...' : 'Delete'}` in the journal delete
   * dialog — a string rendered as a JSX child, but a StringLiteral rather than
   * JsxText, so the parser check above walked straight past it. Every other
   * shape of this bug is now covered; this was the one that made the delete
   * confirmation come up in English on an Uzbek dashboard.
   */
  it('never renders a bare string literal as JSX content', () => {
    const TFN = new Set(['t', 'tr', 'tI18n', 'tMsg'])
    const isJsx = (n: ts.Node) =>
      ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n) ||
      ts.isJsxAttribute(n) || ts.isJsxAttributes(n)

    // A literal that is an argument to the translator is a key, not copy.
    const insideTranslator = (n: ts.Node) => {
      let p: ts.Node | undefined = n.parent
      while (p) {
        if (ts.isCallExpression(p)) {
          const fn = p.expression
          const name = ts.isIdentifier(fn)
            ? fn.text
            : ts.isPropertyAccessExpression(fn) ? fn.name.text : ''
          if (TFN.has(name)) return true
        }
        if (isJsx(p)) return false
        p = p.parent
      }
      return false
    }

    const known = new Set(Object.values(en as Record<string, string>))
    const offenders: string[] = []

    for (const file of FILES) {
      if (!file.endsWith('.tsx')) continue
      const src = readFileSync(file, 'utf8')
      if (!src.includes("'use client'") && !src.includes('"use client"')) continue

      const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      const visit = (node: ts.Node) => {
        if (
          ts.isJsxExpression(node) && node.expression && node.parent &&
          (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))
        ) {
          const lits: ts.StringLiteralLike[] = []
          // Stop at nested JSX: a child element carries its own copy and its
          // own className, and walking in floods this with style strings.
          //
          // Also stop at comparisons and switch cases. `c === 'password
          // (decrypted)'` in the admin table viewer tests a column name — the
          // string is read, never rendered, so translating it would break the
          // match.
          const dig = (n: ts.Node) => {
            if (isJsx(n)) return
            if (ts.isCaseClause(n)) return
            if (
              ts.isBinaryExpression(n) &&
              [
                ts.SyntaxKind.EqualsEqualsEqualsToken,
                ts.SyntaxKind.ExclamationEqualsEqualsToken,
                ts.SyntaxKind.EqualsEqualsToken,
                ts.SyntaxKind.ExclamationEqualsToken,
              ].includes(n.operatorToken.kind)
            ) {
              // The comparison itself is not copy, but a ternary hanging off it
              // still is — so keep walking the branches, not the operands.
              return
            }
            if (ts.isStringLiteralLike(n)) { lits.push(n); return }
            ts.forEachChild(n, dig)
          }
          dig(node.expression)

          for (const lit of lits) {
            const text = lit.text.trim()
            if (!/[A-Za-z]{3}/.test(text)) continue
            if (insideTranslator(lit)) continue
            if (ALLOWED.has(text)) continue
            // Message keys, enum members, date-format tokens and css-ish values
            // are not copy.
            if (/^[a-z][A-Za-z0-9]*\.[A-Za-z0-9]+$/.test(text)) continue
            if (/^[A-Z0-9_]+$/.test(text)) continue
            // Sentence-ish: has a space, ends in punctuation, or is a lone
            // capitalised word.
            const looksLikeCopy =
              /\s/.test(text) || /[.!?…]$/.test(text) || /^[A-Z][a-z]+$/.test(text)
            if (!looksLikeCopy) continue
            // Style/format strings that happen to contain spaces.
            if (/^(from|to|via|bg|text|border)-/.test(text)) continue
            if (/^@keyframes|^\d+%|^[A-Za-z]+,\s|^(MMM|EEEE|yyyy)/.test(text)) continue
            if (known.has(text)) continue

            offenders.push(`${file.slice(SRC.length + 1)}: ${text.slice(0, 50)}`)
          }
        }
        ts.forEachChild(node, visit)
      }
      visit(sf)
    }

    expect(
      offenders,
      'a string rendered in {…} is still copy — wrap it in t(...):\n' + offenders.join('\n')
    ).toEqual([])
  })
})
