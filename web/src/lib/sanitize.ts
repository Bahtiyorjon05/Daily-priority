/**
 * Sanitization utilities for user-generated content
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitizes a string by removing HTML tags and dangerous characters
 * Preserves safe punctuation and Unicode characters
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return (
    input
      // Drop script/style blocks INCLUDING their contents. Stripping only the
      // tags left the body behind ("<script>alert(1)</script>" became
      // "alert(1)"), which is noise at best and re-exploitable if the value is
      // ever placed back inside markup.
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
      // Remove remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script-like content
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Normalize whitespace (but preserve line breaks)
      .replace(/[\r\n]+/g, '\n')
      .replace(/[ \t]+/g, ' ')
      // Trim
      .trim()
  )
}

/**
 * Sanitizes text that allows line breaks (for descriptions, notes, etc.)
 */
export function sanitizeText(input: string | null | undefined): string {
  const sanitized = sanitizeString(input)
  // Allow line breaks in multiline text
  return sanitized.replace(/\n{3,}/g, '\n\n') // Max 2 consecutive line breaks
}

/**
 * Sanitizes a title or single-line text
 * More restrictive than sanitizeText - removes all line breaks
 */
export function sanitizeTitle(input: string | null | undefined): string {
  const sanitized = sanitizeString(input)
  // Remove all line breaks from titles
  return sanitized.replace(/[\r\n]/g, ' ').trim()
}

/**
 * Sanitizes a URL and validates its format
 */
export function sanitizeUrl(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') {
    return null
  }

  const trimmed = input.trim()

  // Only allow http, https, and mailto protocols
  const urlPattern = /^(https?:\/\/|mailto:)/i
  if (!urlPattern.test(trimmed)) {
    return null
  }

  // Basic URL validation
  try {
    const url = new URL(trimmed)
    // Block javascript: protocol and data: URIs
    if (url.protocol === 'javascript:' || url.protocol === 'data:') {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}

/**
 * Sanitizes an email address
 */
export function sanitizeEmail(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') {
    return null
  }

  const trimmed = input.trim().toLowerCase()
  // Basic email validation
  const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
  return emailPattern.test(trimmed) ? trimmed : null
}

/**
 * Sanitizes a number input
 */
export function sanitizeNumber(
  input: any,
  min?: number,
  max?: number
): number | null {
  if (input === null || input === undefined) {
    return null
  }

  const num = Number(input)
  // Number.isNaN alone lets Infinity through, which then blows up (or silently
  // corrupts) a numeric database column.
  if (!Number.isFinite(num)) {
    return null
  }

  // Reject out-of-range input rather than clamping it. Clamping silently
  // rewrote what the user asked for (targetDays: 30 quietly became 7); callers
  // use `?? default`, so rejecting produces the same safe fallback while being
  // honest that the value wasn't accepted.
  if (min !== undefined && num < min) return null
  if (max !== undefined && num > max) return null

  return num
}

/**
 * Sanitizes a boolean input
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') {
    return input
  }
  if (typeof input === 'string') {
    // Accept the forms HTML forms and query strings actually produce.
    return ['true', '1', 'yes', 'y', 'on'].includes(input.trim().toLowerCase())
  }
  if (typeof input === 'number') {
    return input !== 0
  }
  return false
}

/**
 * Sanitizes an enum value
 * Performs case-insensitive matching but preserves the original case from validValues
 */
export function sanitizeEnum<T extends string>(
  input: any,
  validValues: readonly T[]
): T | null {
  if (!input || typeof input !== 'string') {
    return null
  }

  // Case-insensitive search but return the original valid value
  const inputLower = input.toLowerCase()
  const matchedValue = validValues.find(v => v.toLowerCase() === inputLower)
  return matchedValue ?? null
}

/**
 * Sanitizes a date input
 */
export function sanitizeDate(input: any): Date | null {
  if (!input) {
    return null
  }

  try {
    const date = new Date(input)
    // Check if date is valid
    if (Number.isNaN(date.getTime())) {
      return null
    }
    // Reject dates too far in the past or future (reasonable bounds)
    const minDate = new Date('1900-01-01')
    const maxDate = new Date('2100-12-31')
    if (date < minDate || date > maxDate) {
      return null
    }
    return date
  } catch {
    return null
  }
}

/**
 * Sanitizes an array of strings
 */
export function sanitizeStringArray(
  input: any,
  maxLength?: number
): string[] {
  if (!Array.isArray(input)) {
    return []
  }

  let result = input
    .filter((item) => typeof item === 'string')
    .map((item) => sanitizeString(item))
    .filter((item) => item.length > 0)

  if (maxLength !== undefined) {
    result = result.slice(0, maxLength)
  }

  return result
}

/**
 * Sanitizes a JSON object by applying sanitization to all string values
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  rules?: Partial<Record<keyof T, (value: any) => any>>
): T {
  const result: any = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]

      // Apply custom rule if provided
      if (rules && rules[key]) {
        result[key] = rules[key]!(value)
      }
      // Default sanitization based on type
      else if (typeof value === 'string') {
        result[key] = sanitizeString(value)
      } else if (typeof value === 'number') {
        result[key] = value
      } else if (typeof value === 'boolean') {
        result[key] = value
      } else if (value === null || value === undefined) {
        result[key] = value
      } else if (Array.isArray(value)) {
        result[key] = value.map((item: any) =>
          typeof item === 'string' ? sanitizeString(item) : item
        )
      } else if (typeof value === 'object') {
        result[key] = sanitizeObject(value, undefined)
      } else {
        result[key] = value
      }
    }
  }

  return result as T
}
