import { describe, it, expect } from 'vitest'
import { fingerprint } from '../error-reporter'

/**
 * Fingerprinting is what keeps the Errors tab readable: the same fault firing a
 * thousand times must collapse to one row, while genuinely different faults
 * must stay separate.
 */
describe('error fingerprint', () => {
  it('groups the same fault regardless of embedded ids', () => {
    const a = fingerprint('User cmhyuy8t500000efjnm33h42r not found')
    const b = fingerprint('User cmropngup0000i504tmoo04q7 not found')
    expect(a).toBe(b)
  })

  it('groups the same fault regardless of embedded numbers', () => {
    expect(fingerprint('Request failed with status 500')).toBe(
      fingerprint('Request failed with status 503')
    )
  })

  it('keeps genuinely different messages apart', () => {
    expect(fingerprint('Cannot read property x of undefined')).not.toBe(
      fingerprint('Network request failed')
    )
  })

  it('separates the same message thrown from different places', () => {
    const fromA = fingerprint('boom', 'Error: boom\n    at doThing (/app/a.js:10:5)')
    const fromB = fingerprint('boom', 'Error: boom\n    at other (/app/b.js:22:7)')
    expect(fromA).not.toBe(fromB)
  })

  it('ignores line/column drift in the same frame', () => {
    const v1 = fingerprint('boom', 'Error: boom\n    at doThing (/app/a.js:10:5)')
    const v2 = fingerprint('boom', 'Error: boom\n    at doThing (/app/a.js:47:19)')
    expect(v1).toBe(v2)
  })

  it('skips framework noise when picking the origin frame', () => {
    const withNoise = fingerprint(
      'boom',
      [
        'Error: boom',
        '    at wrap (/app/node_modules/next/dist/server/x.js:1:1)',
        '    at doThing (/app/a.js:10:5)',
      ].join('\n')
    )
    const direct = fingerprint('boom', 'Error: boom\n    at doThing (/app/a.js:10:5)')
    expect(withNoise).toBe(direct)
  })

  it('is stable without a stack', () => {
    expect(fingerprint('boom')).toBe(fingerprint('boom'))
  })

  it('does not blow up on very long messages', () => {
    expect(() => fingerprint('x'.repeat(50_000))).not.toThrow()
    expect(fingerprint('x'.repeat(50_000)).length).toBeLessThan(400)
  })
})
