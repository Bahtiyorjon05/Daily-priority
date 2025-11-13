/**
 * Password Strength Utilities
 * Validate and score password strength
 */

export interface PasswordStrength {
  score: number // 0-4
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
  feedback: string[]
  color: string
  percentage: number
}

/**
 * Calculate password strength score
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      strength: 'weak',
      feedback: ['Password is required'],
      color: '#ef4444',
      percentage: 0,
    }
  }

  let score = 0
  const feedback: string[] = []

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Use at least 8 characters')
  }

  if (password.length >= 12) {
    score += 1
  }

  // Complexity checks
  if (/[a-z]/.test(password)) {
    score += 0.5
  } else {
    feedback.push('Include lowercase letters')
  }

  if (/[A-Z]/.test(password)) {
    score += 0.5
  } else {
    feedback.push('Include uppercase letters')
  }

  if (/[0-9]/.test(password)) {
    score += 0.5
  } else {
    feedback.push('Include numbers')
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 0.5
  } else {
    feedback.push('Include special characters (!@#$%^&*)')
  }

  // Check for common patterns
  const commonPatterns = [
    /^password/i,
    /^123456/,
    /^qwerty/i,
    /^admin/i,
    /^letmein/i,
  ]

  if (commonPatterns.some((pattern) => pattern.test(password))) {
    score = Math.max(0, score - 2)
    feedback.push('Avoid common passwords')
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 0.5)
    feedback.push('Avoid repeated characters')
  }

  // Normalize score to 0-4
  score = Math.min(4, Math.max(0, score))

  // Determine strength level
  let strength: PasswordStrength['strength']
  let color: string

  if (score < 1.5) {
    strength = 'weak'
    color = '#ef4444' // red
  } else if (score < 2.5) {
    strength = 'fair'
    color = '#f97316' // orange
  } else if (score < 3.5) {
    strength = 'good'
    color = '#eab308' // yellow
  } else if (score < 4) {
    strength = 'strong'
    color = '#22c55e' // green
  } else {
    strength = 'very-strong'
    color = '#10b981' // emerald
  }

  return {
    score,
    strength,
    feedback: feedback.length > 0 ? feedback : ['Great password!'],
    color,
    percentage: (score / 4) * 100,
  }
}

/**
 * Check if password meets minimum requirements
 */
export function isPasswordValid(password: string): boolean {
  return password.length >= 8
}

/**
 * Check if password meets strong requirements
 */
export function isPasswordStrong(password: string): boolean {
  const strength = calculatePasswordStrength(password)
  return strength.score >= 3
}

/**
 * Generate a strong password
 */
export function generateStrongPassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  const allChars = lowercase + uppercase + numbers + symbols
  let password = ''

  // Ensure at least one of each type
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}
