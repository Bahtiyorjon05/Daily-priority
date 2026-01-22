/**
 * Environment variable validation for Next.js app.
 * Keeps production strict while letting local designers run without every secret.
 */

const requiredEnvVars = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // NextAuth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  // App
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
} as const

const optionalEnvVars = {
} as const

const isProduction = process.env.NODE_ENV === 'production'
const strictValidation = isProduction || process.env.STRICT_ENV_VALIDATION === 'true'

/**
 * Validates all required environment variables.
 * In strict mode (production or STRICT_ENV_VALIDATION=true) missing/invalid vars throw.
 * In relaxed mode we log warnings so the marketing site can still run locally.
 */
export function validateEnvironmentVariables() {
  const missingVars: string[] = []

  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      missingVars.push(key)
    }
  })

  if (missingVars.length > 0) {
    const message =
      'Missing required environment variables: ' + missingVars.join(', ') +
      '\nPlease check your .env file and ensure all required variables are set.'

    if (strictValidation) {
      throw new Error(message)
    } else {
      console.warn('�?O Env validation warning:', message)
      return
    }
  }

  if (strictValidation) {
    validateEnvFormats()
    console.log('�?O All environment variables are valid')
  } else {
    try {
      validateEnvFormats()
    } catch (error) {
      console.warn(
        '�?O Env validation warning:',
        error instanceof Error ? error.message : error
      )
    }
  }
}

/**
 * Validates the format of environment variables.
 */
function validateEnvFormats() {
  if (requiredEnvVars.DATABASE_URL && !requiredEnvVars.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
  }

  if (requiredEnvVars.NEXTAUTH_URL) {
    try {
      new URL(requiredEnvVars.NEXTAUTH_URL)
    } catch {
      throw new Error('NEXTAUTH_URL must be a valid URL')
    }
  }

  if (requiredEnvVars.NEXTAUTH_SECRET && requiredEnvVars.NEXTAUTH_SECRET.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long for security')
  }

  if (requiredEnvVars.GOOGLE_CLIENT_ID && !requiredEnvVars.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
    throw new Error('GOOGLE_CLIENT_ID must be a valid Google OAuth client ID')
  }

  if (requiredEnvVars.NEXT_PUBLIC_APP_URL) {
    try {
      new URL(requiredEnvVars.NEXT_PUBLIC_APP_URL)
    } catch {
      throw new Error('NEXT_PUBLIC_APP_URL must be a valid URL')
    }
  }
}

/**
 * Debug helper to list environment state without exposing secrets.
 */
export function getEnvironmentInfo() {
  return {
    required: Object.entries(requiredEnvVars).map(([key, value]) => ({
      key,
      present: !!value,
      masked: typeof value === 'string' ? value.substring(0, 8) + '...' : 'NOT_SET',
    })),
    optional: Object.entries(optionalEnvVars).map(([key, value]) => ({
      key,
      present: !!value,
      masked: typeof value === 'string' ? value.substring(0, 8) + '...' : 'NOT_SET',
    })),
  }
}

// ALWAYS validate environment variables on import.
try {
  validateEnvironmentVariables()
} catch (error) {
  console.error('�?O Environment validation failed:', error)
  if (!strictValidation && process.env.NODE_ENV === 'development') {
    console.warn('Skipping environment validation failure in development mode.')
  } else if (process.env.NODE_ENV === 'development') {
    process.exit(1)
  }
}
