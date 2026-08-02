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

const isAccelerateUrl = (u?: string | null): u is string =>
  !!u && (u.startsWith('prisma://') || u.startsWith('prisma+postgres://'))

/**
 * Pick the connection to use at runtime.
 *
 * Serverless functions must NOT open direct TCP connections to Prisma Postgres:
 * each invocation grabs its own connection and the instance's limit is quickly
 * exhausted, which surfaces as "Failed to connect to upstream database". So an
 * Accelerate (HTTP, pooled) URL always wins when one is configured, regardless
 * of which env var happens to hold it — some Vercel setups put the direct URL
 * in DATABASE_URL and the pooled one in DATABASE_PRISMA_DATABASE_URL.
 *
 * Migrations still use DATABASE_URL directly (see prisma.config.ts), which is
 * correct: Accelerate can't run them.
 */
const url =
  [process.env.DATABASE_URL, process.env.DATABASE_PRISMA_DATABASE_URL].find(isAccelerateUrl) ??
  process.env.DATABASE_URL

const isAccelerate = isAccelerateUrl(url)

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

// Cache in production too: a warm serverless instance then reuses one client
// instead of constructing (and, on the TCP path, re-connecting) per request.
globalForPrisma.prisma = prisma
