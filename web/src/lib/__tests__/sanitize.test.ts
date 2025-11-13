import { describe, it, expect } from 'vitest'
import {
  sanitizeString,
  sanitizeTitle,
  sanitizeText,
  sanitizeEmail,
  sanitizeBoolean,
  sanitizeNumber,
  sanitizeDate,
  sanitizeEnum,
} from '../sanitize'

describe('sanitize', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeString('<script>alert("xss")</script>Test')).toBe('Test')
      expect(sanitizeString('<div>Hello</div>')).toBe('Hello')
    })

    it('should remove javascript: protocol', () => {
      expect(sanitizeString('javascript:alert("xss")')).toBe('alert("xss")')
    })

    it('should remove event handlers', () => {
      expect(sanitizeString('onclick=alert("xss")')).toBe('alert("xss")')
      expect(sanitizeString('onload=malicious()')).toBe('malicious()')
    })

    it('should handle null and undefined', () => {
      expect(sanitizeString(null)).toBe('')
      expect(sanitizeString(undefined)).toBe('')
    })

    it('should normalize whitespace', () => {
      expect(sanitizeString('  hello   world  ')).toBe('hello world')
      expect(sanitizeString('hello\n\n\nworld')).toBe('hello\nworld')
    })
  })

  describe('sanitizeTitle', () => {
    it('should remove line breaks from titles', () => {
      expect(sanitizeTitle('Hello\nWorld')).toBe('Hello World')
      expect(sanitizeTitle('Test\r\nTitle')).toBe('Test Title')
    })

    it('should remove HTML from titles', () => {
      expect(sanitizeTitle('<b>Bold Title</b>')).toBe('Bold Title')
    })
  })

  describe('sanitizeEmail', () => {
    it('should validate email format', () => {
      expect(sanitizeEmail('test@example.com')).toBe('test@example.com')
      expect(sanitizeEmail('user.name+tag@example.co.uk')).toBe(
        'user.name+tag@example.co.uk'
      )
    })

    it('should reject invalid emails', () => {
      expect(sanitizeEmail('invalid')).toBe(null)
      expect(sanitizeEmail('invalid@')).toBe(null)
      expect(sanitizeEmail('@example.com')).toBe(null)
    })

    it('should convert to lowercase', () => {
      expect(sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com')
    })
  })

  describe('sanitizeBoolean', () => {
    it('should convert truthy values to boolean', () => {
      expect(sanitizeBoolean(true)).toBe(true)
      expect(sanitizeBoolean('true')).toBe(true)
      expect(sanitizeBoolean(1)).toBe(true)
      expect(sanitizeBoolean('yes')).toBe(true)
    })

    it('should convert falsy values to boolean', () => {
      expect(sanitizeBoolean(false)).toBe(false)
      expect(sanitizeBoolean('false')).toBe(false)
      expect(sanitizeBoolean(0)).toBe(false)
      expect(sanitizeBoolean('')).toBe(false)
    })
  })

  describe('sanitizeNumber', () => {
    it('should parse valid numbers', () => {
      expect(sanitizeNumber('123')).toBe(123)
      expect(sanitizeNumber(456)).toBe(456)
      expect(sanitizeNumber('78.9')).toBe(78.9)
    })

    it('should respect min and max bounds', () => {
      expect(sanitizeNumber(5, 10, 20)).toBe(null) // below min
      expect(sanitizeNumber(15, 10, 20)).toBe(15) // within range
      expect(sanitizeNumber(25, 10, 20)).toBe(null) // above max
    })

    it('should return null for invalid numbers', () => {
      expect(sanitizeNumber('abc')).toBe(null)
      expect(sanitizeNumber(NaN)).toBe(null)
      expect(sanitizeNumber(Infinity)).toBe(null)
    })
  })

  describe('sanitizeDate', () => {
    it('should parse valid date strings', () => {
      const result = sanitizeDate('2024-01-15')
      expect(result).toBeInstanceOf(Date)
      expect(result?.toISOString()).toContain('2024-01-15')
    })

    it('should accept Date objects', () => {
      const date = new Date('2024-01-15')
      const result = sanitizeDate(date)
      expect(result).toBe(date)
    })

    it('should return null for invalid dates', () => {
      expect(sanitizeDate('invalid')).toBe(null)
      expect(sanitizeDate('')).toBe(null)
      expect(sanitizeDate(null)).toBe(null)
    })
  })

  describe('sanitizeEnum', () => {
    const validValues = ['LOW', 'MEDIUM', 'HIGH'] as const

    it('should accept valid enum values', () => {
      expect(sanitizeEnum('LOW', validValues)).toBe('LOW')
      expect(sanitizeEnum('MEDIUM', validValues)).toBe('MEDIUM')
      expect(sanitizeEnum('HIGH', validValues)).toBe('HIGH')
    })

    it('should reject invalid enum values', () => {
      expect(sanitizeEnum('INVALID', validValues)).toBe(null)
      expect(sanitizeEnum('low', validValues)).toBe(null)
      expect(sanitizeEnum('', validValues)).toBe(null)
    })
  })
})
