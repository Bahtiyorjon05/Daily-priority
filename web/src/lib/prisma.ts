import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaClient } from '../../generated/prisma/client'

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in environment variables')
  console.error('Please check your environment and ensure DATABASE_URL is set')
  throw new Error('DATABASE_URL is required.')
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const url = process.env.DATABASE_URL

// Prisma Postgres / Accelerate connection strings use the prisma:// or
// prisma+postgres:// scheme and are served over HTTP — they must go through the
// Accelerate extension, NOT the node-postgres (TCP) driver adapter. A plain
// postgres:// URL (e.g. a direct Prisma Postgres or local database) uses PrismaPg.
// This lets the same code run on Vercel (Accelerate) and locally (direct TCP).
const isAccelerate = url.startsWith('prisma://') || url.startsWith('prisma+postgres://')

function createPrismaClient(): PrismaClient {
  if (isAccelerate) {
    // Prisma 7: Accelerate/Prisma Postgres HTTP connections are configured via
    // `accelerateUrl` on the constructor (not a driver adapter). The extension
    // adds cacheStrategy support on top.
    return new PrismaClient({
      accelerateUrl: url,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    }).$extends(withAccelerate()) as unknown as PrismaClient
  }

  const adapter = new PrismaPg({ connectionString: url })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
