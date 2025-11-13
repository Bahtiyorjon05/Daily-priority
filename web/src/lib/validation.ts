/**
 * Client-side validation utilities with user-friendly error messages
 */

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

export interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}

/**
 * Validation rules
 */
export const ValidationRules = {
  required: (fieldName: string = 'This field'): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0
      return value !== null && value !== undefined
    },
    message: `${fieldName} is required`,
  }),

  email: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true // Optional unless combined with required
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message: 'Please enter a valid email address',
  }),

  minLength: (length: number, fieldName: string = 'This field'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      return value.length >= length
    },
    message: `${fieldName} must be at least ${length} characters`,
  }),

  maxLength: (length: number, fieldName: string = 'This field'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      return value.length <= length
    },
    message: `${fieldName} must not exceed ${length} characters`,
  }),

  password: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
      return (
        value.length >= 8 &&
        /[A-Z]/.test(value) &&
        /[a-z]/.test(value) &&
        /[0-9]/.test(value)
      )
    },
    message:
      'Password must be at least 8 characters with uppercase, lowercase, and number',
  }),

  passwordSimple: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      return value.length >= 8
    },
    message: 'Password must be at least 8 characters',
  }),

  url: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message: 'Please enter a valid URL',
  }),

  number: (fieldName: string = 'This field'): ValidationRule => ({
    validate: (value: any) => {
      if (value === '' || value === null || value === undefined) return true
      return !isNaN(Number(value))
    },
    message: `${fieldName} must be a valid number`,
  }),

  min: (min: number, fieldName: string = 'Value'): ValidationRule => ({
    validate: (value: any) => {
      if (value === '' || value === null || value === undefined) return true
      return Number(value) >= min
    },
    message: `${fieldName} must be at least ${min}`,
  }),

  max: (max: number, fieldName: string = 'Value'): ValidationRule => ({
    validate: (value: any) => {
      if (value === '' || value === null || value === undefined) return true
      return Number(value) <= max
    },
    message: `${fieldName} must not exceed ${max}`,
  }),

  range: (min: number, max: number, fieldName: string = 'Value'): ValidationRule => ({
    validate: (value: any) => {
      if (value === '' || value === null || value === undefined) return true
      const num = Number(value)
      return num >= min && num <= max
    },
    message: `${fieldName} must be between ${min} and ${max}`,
  }),

  match: (otherField: string, otherValue: any): ValidationRule => ({
    validate: (value: any) => value === otherValue,
    message: `Must match ${otherField}`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      return regex.test(value)
    },
    message,
  }),

  custom: (validator: (value: any) => boolean, message: string): ValidationRule => ({
    validate: validator,
    message,
  }),
}

/**
 * Validate a single field
 */
export function validateField(
  value: any,
  rules: ValidationRule[]
): string | null {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message
    }
  }
  return null
}

/**
 * Validate multiple fields
 */
export function validateFields(
  values: Record<string, any>,
  rules: Record<string, ValidationRule[]>
): ValidationResult {
  const errors: Record<string, string> = {}

  for (const [field, fieldRules] of Object.entries(rules)) {
    const error = validateField(values[field], fieldRules)
    if (error) {
      errors[field] = error
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Real-time validation hook
 */
export function useValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: Record<keyof T, ValidationRule[]>
) {
  const [values, setValues] = React.useState<T>(initialValues)
  const [errors, setErrors] = React.useState<Record<keyof T, string>>({} as any)
  const [touched, setTouched] = React.useState<Record<keyof T, boolean>>({} as any)

  const validate = (field?: keyof T) => {
    if (field) {
      // Validate single field
      const error = validateField(values[field], rules[field] || [])
      setErrors((prev) => ({
        ...prev,
        [field]: error || '',
      }))
      return !error
    } else {
      // Validate all fields
      const result = validateFields(values, rules as any)
      setErrors(result.errors as any)
      return result.valid
    }
  }

  const handleChange = (field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (touched[field]) {
      // Re-validate if field was touched
      const error = validateField(value, rules[field] || [])
      setErrors((prev) => ({
        ...prev,
        [field]: error || '',
      }))
    }
  }

  const handleBlur = (field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validate(field)
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({} as any)
    setTouched({} as any)
  }

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  }
}

// Add React import for the hook
import React from 'react'
