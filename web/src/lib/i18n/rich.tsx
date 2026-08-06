'use client'

import { Fragment, type ReactNode } from 'react'
import { useT } from './client'
import type { MessageKey } from './translate'

/**
 * A translated sentence that contains styled fragments.
 *
 * Splitting a sentence across `<span>`s and translating each piece separately
 * is what produced "Organize your life around prayer times, achieve goals with
 * Islomiy tamoyillar, and grow spiritually every day" — the middle was a JSX
 * text node so it got picked up, the words either side were not.
 *
 * Even translating every fragment wouldn't fix it: Uzbek puts the verb last, so
 * the pieces don't line up with the English order. The whole sentence has to be
 * one string, with the styled parts marked by `{name}` placeholders that get
 * substituted for elements after translation.
 *
 *   <RichText id="hero.subtitle" parts={{ prayer: t => <b>{t}</b> }} />
 *
 * where the message reads: "Organize your life around {prayer}, …"
 */
export function RichText({
  id,
  parts,
  values,
}: {
  id: MessageKey | (string & {})
  /** Placeholder name → renderer for the already-translated fragment. */
  parts: Record<string, (text: string) => ReactNode>
  /** Plain substitutions applied before splitting. */
  values?: Record<string, string | number>
}) {
  const { t } = useT()
  const template = t(id, values)

  // Split on the placeholders we know how to render, keeping the delimiters.
  const names = Object.keys(parts)
  if (names.length === 0) return <>{template}</>

  const pattern = new RegExp(`\\{(${names.join('|')})\\}`, 'g')
  const out: ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let i = 0

  while ((m = pattern.exec(template)) !== null) {
    if (m.index > last) out.push(<Fragment key={i++}>{template.slice(last, m.index)}</Fragment>)
    const name = m[1]
    // The fragment's own text is a separate key: `<id>.<name>`, so translators
    // see the highlighted words as their own string rather than as markup.
    out.push(<Fragment key={i++}>{parts[name](t(`${id}.${name}`))}</Fragment>)
    last = m.index + m[0].length
  }
  if (last < template.length) out.push(<Fragment key={i++}>{template.slice(last)}</Fragment>)

  return <>{out}</>
}

export default RichText
