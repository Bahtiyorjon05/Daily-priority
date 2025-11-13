import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Health check endpoint
 * Returns system health status
 * GET /api/health
 */
export async function GET() {
  const startTime = Date.now()
  const checks: Record<string, any> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {},
  }

  try {
    // Database health check
    const dbStart = Date.now()
    try {
      await prisma.$queryRaw`SELECT 1`
      checks.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart,
      }
    } catch (error) {
      checks.checks.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Database connection failed',
        responseTime: Date.now() - dbStart,
      }
      checks.status = 'degraded'
    }

    // Memory usage check
    const memUsage = process.memoryUsage()
    checks.checks.memory = {
      status: 'healthy',
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
    }

    // Check if memory usage is high (> 90% of heap)
    if (memUsage.heapUsed / memUsage.heapTotal > 0.9) {
      checks.checks.memory.status = 'warning'
      if (checks.status === 'healthy') {
        checks.status = 'degraded'
      }
    }

    // Overall response time
    checks.responseTime = Date.now() - startTime

    // Determine HTTP status code
    const httpStatus = checks.status === 'healthy' ? 200 : checks.status === 'degraded' ? 207 : 503

    return NextResponse.json(checks, { status: httpStatus })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
        responseTime: Date.now() - startTime,
      },
      { status: 503 }
    )
  }
}
