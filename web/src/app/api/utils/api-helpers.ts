import { NextResponse } from 'next/server'

// Standardized API response helpers
export const apiResponse = {
  success: (data: any, status = 200) => {
    return NextResponse.json({ success: true, data }, { status })
  },
  
  error: (message: string, status = 500, details?: any) => {
    return NextResponse.json({ 
      success: false, 
      error: message,
      details,
      timestamp: new Date().toISOString()
    }, { status })
  },
  
  notFound: (message = 'Resource not found') => {
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 404 })
  },
  
  unauthorized: (message = 'Unauthorized access') => {
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 401 })
  },
  
  validationError: (errors: Record<string, string>) => {
    return NextResponse.json({ 
      success: false, 
      error: 'Validation failed',
      validationErrors: errors
    }, { status: 400 })
  }
}

// Input validation helpers
export const validate = {
  required: (value: any, fieldName: string) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`
    }
    return null
  },
  
  email: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Invalid email format'
    }
    return null
  },
  
  minLength: (value: string, length: number, fieldName: string) => {
    if (value.length < length) {
      return `${fieldName} must be at least ${length} characters`
    }
    return null
  },
  
  numberRange: (value: number, min: number, max: number, fieldName: string) => {
    if (value < min || value > max) {
      return `${fieldName} must be between ${min} and ${max}`
    }
    return null
  }
}

// Pagination helper
export const paginate = (page: number = 1, limit: number = 20) => {
  // Ensure valid pagination parameters
  const pageNum = Math.max(1, Math.floor(page))
  const limitNum = Math.max(1, Math.min(100, Math.floor(limit)))
  
  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum
  }
}

// Cache helper for API responses
export class APICache {
  private static cache = new Map<string, { data: any; timestamp: number }>()
  private static defaultTTL = 5 * 60 * 1000 // 5 minutes

  static get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > this.defaultTTL) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }

  static set(key: string, data: any, ttl: number = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
    
    // Clean up expired entries periodically
    if (Math.random() < 0.1) { // 10% chance to clean up
      this.cleanup()
    }
  }

  static delete(key: string) {
    this.cache.delete(key)
  }

  private static cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.defaultTTL) {
        this.cache.delete(key)
      }
    }
  }
}