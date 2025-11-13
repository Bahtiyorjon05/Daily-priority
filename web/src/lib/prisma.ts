import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in environment variables')
  console.error('Please check your .env.local file and ensure DATABASE_URL is set')
  throw new Error('DATABASE_URL is required. Please check your .env.local file.')
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Disable query logging in development for better performance
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  // Add connection pooling for better performance
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Test database connection on startup in development
if (process.env.NODE_ENV === 'development' && !globalForPrisma.prisma) {
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connected successfully')
    })
    .catch((error) => {
      console.error('❌ Failed to connect to database:', error.message)
      console.error('Please ensure:')
      console.error('  1. PostgreSQL is running')
      console.error('  2. DATABASE_URL in .env.local is correct')
      console.error('  3. Database exists and is accessible')
    })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
