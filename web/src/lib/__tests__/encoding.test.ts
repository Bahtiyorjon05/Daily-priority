import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Nothing we send may be double-encoded.
 *
 * The bot's stats report reached Telegram looking like this:
 *
 *   \u00f0\u0178\u201c\u0160 Bot stats
 *   \u00f0\u0178\u2018\u00a5 Started: 2
 *
 * The emoji had been written to disk already mangled -- UTF-8 bytes stored as
 * if they were Windows-1252 characters and then encoded again. The source read
 * back "correctly" in an editor, the tests passed, the build was clean, and the
 * only place it was visible was in the message a person actually received.
 *
 * Two rules come out of that, and both are enforced here.
 */

const SOURCE = /\.(ts|tsx)$/

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (SOURCE.test(entry)) out.push(path)
  }
  return out
}

const files = walk(join(process.cwd(), 'src'))

describe('character encoding', () => {
  it('has no double-encoded text anywhere in the source', () => {
    /*
      The signature of UTF-8 read as Windows-1252: a UTF-8 LEAD byte, rendered as
      its cp1252 character, followed by another cp1252-range character.

      The lead range matters and is where the first version of this got it
      wrong. It covered only C2/C3/E2 -- the leads for two- and three-byte
      sequences -- so it caught a mangled dash and missed every mangled emoji,
      which are four-byte and lead with F0. The bug that prompted this test
      walked straight past it.
    */
    const LEAD = 'Â-Ãà-ïð-ô'
    // The high half of cp1252, including the punctuation it maps into 0x80-0x9F.
    const CP1252 =
      '-ÿŒœŠšŸŽž' +
      'ƒˆ˜–—‘-„†-•' +
      '…‰‹›€™'
    const suspect = new RegExp(`[${LEAD}][${CP1252}]`)

    const bad: string[] = []
    for (const file of files) {
      /*
        This file necessarily contains the characters it hunts for -- they are
        the pattern. Same exemption the secret scanner needs, for the same
        reason.
      */
      if (file.includes('encoding.test.ts')) continue
      const text = readFileSync(file, 'utf8')
      if (suspect.test(text)) bad.push(file.replace(process.cwd(), ''))
    }
    expect(bad, `double-encoded characters in: ${bad.join(', ')}`).toEqual([])
  })

  it('writes every emoji the bot sends as an escape', () => {
    /*
      The durable half of the fix. An escape is plain ASCII in the file, so no
      editor, shell, patch tool or transfer can corrupt it -- and what a reviewer
      reads is exactly what the reader receives.

      Only the Telegram modules: this is about bytes leaving the server, and JSX
      elsewhere is rendered by a browser that negotiates its own encoding.
    */
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
    const offenders: string[] = []
    for (const file of files.filter((f) => f.includes(join('lib', 'telegram')))) {
      if (emoji.test(readFileSync(file, 'utf8'))) offenders.push(file.replace(process.cwd(), ''))
    }
    expect(
      offenders,
      `raw emoji in Telegram source (use \\u escapes): ${offenders.join(', ')}`
    ).toEqual([])
  })
})
