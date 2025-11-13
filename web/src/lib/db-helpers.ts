/**
 * Database Transaction Utilities
 * Helper functions for safe database operations
 */

import { prisma } from './prisma'
import { Prisma } from '@prisma/client'

/**
 * Execute multiple operations in a transaction
 * Automatically rolls back on error
 */
export async function executeTransaction<T>(
  operations: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(operations, {
    maxWait: 5000, // Maximum time to wait for a transaction to start (ms)
    timeout: 10000, // Maximum time a transaction can run (ms)
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  })
}

/**
 * Safe create operation with error handling
 */
export async function safeCreate<T>(
  model: any,
  data: any,
  errorMessage: string = 'Failed to create record'
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const result = await model.create({ data })
    return { success: true, data: result }
  } catch (error) {
    console.error(`${errorMessage}:`, error)
    
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return { success: false, error: 'A record with this data already exists' }
      }
      if (error.code === 'P2003') {
        return { success: false, error: 'Related record not found' }
      }
      if (error.code === 'P2025') {
        return { success: false, error: 'Record not found' }
      }
    }
    
    return { success: false, error: errorMessage }
  }
}

/**
 * Safe update operation with error handling
 */
export async function safeUpdate<T>(
  model: any,
  where: any,
  data: any,
  errorMessage: string = 'Failed to update record'
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const result = await model.update({ where, data })
    return { success: true, data: result }
  } catch (error) {
    console.error(`${errorMessage}:`, error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'Record not found' }
      }
      if (error.code === 'P2002') {
        return { success: false, error: 'A record with this data already exists' }
      }
    }
    
    return { success: false, error: errorMessage }
  }
}

/**
 * Safe delete operation with error handling
 */
export async function safeDelete(
  model: any,
  where: any,
  errorMessage: string = 'Failed to delete record'
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await model.delete({ where })
    return { success: true }
  } catch (error) {
    console.error(`${errorMessage}:`, error)
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { success: false, error: 'Record not found' }
      }
      if (error.code === 'P2003') {
        return { success: false, error: 'Cannot delete: record is referenced by other data' }
      }
    }
    
    return { success: false, error: errorMessage }
  }
}

/**
 * Upsert with transaction support
 */
export async function safeUpsert<T>(
  model: any,
  where: any,
  create: any,
  update: any,
  errorMessage: string = 'Failed to upsert record'
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const result = await model.upsert({ where, create, update })
    return { success: true, data: result }
  } catch (error) {
    console.error(`${errorMessage}:`, error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Batch create with transaction
 */
export async function batchCreate<T>(
  model: any,
  data: any[],
  errorMessage: string = 'Failed to create records'
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  try {
    const result = await model.createMany({
      data,
      skipDuplicates: true,
    })
    return { success: true, count: result.count }
  } catch (error) {
    console.error(`${errorMessage}:`, error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Conditional update - only update if condition is met
 */
export async function conditionalUpdate<T>(
  model: any,
  where: any,
  condition: (record: any) => boolean,
  data: any,
  errorMessage: string = 'Failed to update record'
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    return await executeTransaction(async (tx) => {
      // Find the record
      const record = await (tx as any)[model.name].findUnique({ where })
      
      if (!record) {
        return { success: false, error: 'Record not found' }
      }
      
      // Check condition
      if (!condition(record)) {
        return { success: false, error: 'Condition not met for update' }
      }
      
      // Perform update
      const updated = await (tx as any)[model.name].update({ where, data })
      return { success: true, data: updated }
    })
  } catch (error) {
    console.error(`${errorMessage}:`, error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Paginated query with total count
 */
export async function paginatedQuery<T>(
  model: any,
  where: any,
  page: number = 1,
  limit: number = 20,
  orderBy?: any,
  select?: any
): Promise<{
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}> {
  const skip = (page - 1) * limit
  
  const [data, total] = await Promise.all([
    model.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select,
    }),
    model.count({ where }),
  ])
  
  const totalPages = Math.ceil(total / limit)
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

/**
 * Check if record exists
 */
export async function recordExists(
  model: any,
  where: any
): Promise<boolean> {
  const count = await model.count({ where })
  return count > 0
}
