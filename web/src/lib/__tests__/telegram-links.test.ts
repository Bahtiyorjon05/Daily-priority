import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The Telegram channel and discussion group.
 *
 * These appear in four places — the dashboard header, the profile menu, the
 * marketing navbar and the footer. The failure mode is duplication: a URL
 * updated in three of them and stale in the fourth sends people to a dead link
 * and nothing in the build complains. So the URLs live in exactly one module and
 * this checks nothing hard-codes them anywhere else.
 */

const SRC = join(process.cwd(), 'src')
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

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

const module_ = read('src/components/shared/Telegram.tsx')

describe('telegram links', () => {
  it('points at the right channel and group', () => {
    expect(module_).toContain("channel: 'https://t.me/daily_priority'")
    expect(module_).toContain("group: 'https://t.me/daily_priority_group'")
    // The handles are shown under each label; a mismatch between a handle and
    // the URL beside it is the kind of thing nobody notices for months.
    expect(module_).toContain("channelHandle: '@daily_priority'")
    expect(module_).toContain("groupHandle: '@daily_priority_group'")
  })

  it('defines every t.me URL in one module', () => {
    const offenders: string[] = []
    for (const file of walk(SRC)) {
      const rel = file.slice(SRC.length + 1).split('\\').join('/')
      if (rel === 'components/shared/Telegram.tsx') continue
      const src = readFileSync(file, 'utf8')
      if (/t\.me\//.test(src)) offenders.push(rel)
    }
    expect(
      offenders,
      'import TELEGRAM instead of hard-coding the URL:\n' + offenders.join('\n')
    ).toEqual([])
  })

  it('appears everywhere it was asked for', () => {
    // Dashboard header and profile menu.
    const layout = read('src/app/(dashboard)/layout.tsx')
    expect(layout, 'header control').toMatch(/<TelegramMenu \/>/)
    expect(layout, 'profile menu entries').toMatch(/TELEGRAM\.channel/)
    expect(layout).toMatch(/TELEGRAM\.group/)

    // Homepage: navbar on desktop, drawer on mobile, and the footer.
    const navbar = read('src/components/marketing/Navbar.tsx')
    expect(navbar, 'desktop navbar').toMatch(/<TelegramMenu \/>/)
    expect(navbar, 'mobile drawer').toMatch(/TELEGRAM\.channel/)

    expect(read('src/components/marketing/Footer.tsx')).toMatch(/TELEGRAM\.group/)
  })

  it('opens external links safely', () => {
    // `target="_blank"` without `noreferrer` leaves the new tab able to reach
    // back through window.opener.
    for (const file of [
      'src/components/shared/TelegramMenu.tsx',
      'src/app/(dashboard)/layout.tsx',
      'src/components/marketing/Navbar.tsx',
      'src/components/marketing/Footer.tsx',
    ]) {
      const src = read(file)
      const blanks = (src.match(/target="_blank"/g) ?? []).length
      const safe = (src.match(/rel="noopener noreferrer"/g) ?? []).length
      expect(safe, `${file}: ${blanks} _blank vs ${safe} noreferrer`).toBeGreaterThanOrEqual(blanks)
    }
  })

  it('uses a real Telegram mark, not a generic paper plane', () => {
    // lucide has no Telegram glyph; `Send` reads as "submit".
    expect(module_).toMatch(/<svg/)
    expect(module_).toMatch(/fill="currentColor"/)
    expect(module_, 'the icon must be hidden from screen readers').toMatch(/aria-hidden="true"/)
  })

  it('matches the other header controls in size', () => {
    // 44px minimum, same rounding and neutral tile as language / notifications /
    // phase / theme. A brand-coloured button would pull the eye off the page.
    const menu = read('src/components/shared/TelegramMenu.tsx')
    expect(menu).toMatch(/min-h-\[44px\] min-w-\[44px\]/)
    expect(menu).toMatch(/rounded-2xl/)
  })

  it('can be dismissed like every other header popover', () => {
    const menu = read('src/components/shared/TelegramMenu.tsx')
    expect(menu).toMatch(/useDismissable<HTMLDivElement>\(open,/)
    expect(menu, 'the ref must wrap the trigger too').toMatch(/<div ref=\{shell\}/)
    expect(menu, 'menu semantics').toMatch(/aria-expanded=\{open\}/)
  })
})
