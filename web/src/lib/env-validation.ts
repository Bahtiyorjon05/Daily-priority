/**
 * Environment variable validation for Next.js app
 * This ensures all required environment variables are present and valid
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
  // Google AI (optional)
  GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
} as const

/**
 * Validates all required environment variables
 * Throws an error if any required variable is missing
 */
export function validateEnvironmentVariables() {
  const missingVars: string[] = []
  
  // Check required variables
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      missingVars.push(key)
    }
  })
  
  if (missingVars.length > 0) {
    throw new Error(
      'Missing required environment variables: ' + (missingVars.join(', ')) + '\n' +
      'Please check your .env file and ensure all required variables are set.'
    )
  }
  
  // Validate formats
  validateEnvFormats()
  
  console.log('✅ All environment variables are valid')
}

/**
 * Validates the format of environment variables
 */
function validateEnvFormats() {
  // Validate DATABASE_URL format
  if (requiredEnvVars.DATABASE_URL && !requiredEnvVars.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
  }
  
  // Validate NEXTAUTH_URL format
  if (requiredEnvVars.NEXTAUTH_URL) {
    try {
      new URL(requiredEnvVars.NEXTAUTH_URL)
    } catch {
      throw new Error('NEXTAUTH_URL must be a valid URL')
    }
  }
  
  // Validate NEXTAUTH_SECRET length
  if (requiredEnvVars.NEXTAUTH_SECRET && requiredEnvVars.NEXTAUTH_SECRET.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long for security')
  }
  
  // Validate Google Client ID format
  if (requiredEnvVars.GOOGLE_CLIENT_ID && !requiredEnvVars.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com')) {
    throw new Error('GOOGLE_CLIENT_ID must be a valid Google OAuth client ID')
  }
  
  // Validate NEXT_PUBLIC_APP_URL format
  if (requiredEnvVars.NEXT_PUBLIC_APP_URL) {
    try {
      new URL(requiredEnvVars.NEXT_PUBLIC_APP_URL)
    } catch {
      throw new Error('NEXT_PUBLIC_APP_URL must be a valid URL')
    }
  }
}

/**
 * Get all environment variables (for debugging)
 */
export function getEnvironmentInfo() {
  return {
    required: Object.entries(requiredEnvVars).map(([key, value]) => ({
      key,
      present: !!value,
      masked: value ? (value.substring(0, 8)) + '...' : 'NOT_SET'
    })),
    optional: Object.entries(optionalEnvVars).map(([key, value]) => ({
      key,
      present: !!value,
      masked: value ? (value.substring(0, 8)) + '...' : 'NOT_SET'
    }))
  }
}

// Validate environment variables on import in development
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnvironmentVariables()
  } catch (error) {
    console.error('❌ Environment validation failed:', error)
    process.exit(1)
  }
}