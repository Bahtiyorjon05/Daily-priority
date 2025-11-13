/**
 * CORS Configuration Utilities
 * For API routes that need to be accessed from external origins
 */

export interface CORSOptions {
  origin?: string | string[] | boolean
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

const DEFAULT_CORS_OPTIONS: CORSOptions = {
  origin: false, // By default, don't allow CORS (internal app only)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Version'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400, // 24 hours
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null, allowedOrigins: string | string[] | boolean): boolean {
  if (!origin) return false
  if (allowedOrigins === true) return true
  if (allowedOrigins === false) return false
  if (typeof allowedOrigins === 'string') return origin === allowedOrigins
  return allowedOrigins.includes(origin)
}

/**
 * Get CORS headers for a request
 */
export function getCORSHeaders(
  request: Request,
  options: CORSOptions = {}
): Headers {
  const headers = new Headers()
  const opts = { ...DEFAULT_CORS_OPTIONS, ...options }

  const origin = request.headers.get('origin')

  // Set Access-Control-Allow-Origin
  if (opts.origin && origin && isOriginAllowed(origin, opts.origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
  } else if (opts.origin === true) {
    headers.set('Access-Control-Allow-Origin', '*')
  }

  // Set other CORS headers
  if (opts.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true')
  }

  if (opts.methods) {
    headers.set('Access-Control-Allow-Methods', opts.methods.join(', '))
  }

  if (opts.allowedHeaders) {
    headers.set('Access-Control-Allow-Headers', opts.allowedHeaders.join(', '))
  }

  if (opts.exposedHeaders) {
    headers.set('Access-Control-Expose-Headers', opts.exposedHeaders.join(', '))
  }

  if (opts.maxAge) {
    headers.set('Access-Control-Max-Age', opts.maxAge.toString())
  }

  return headers
}

/**
 * Handle CORS preflight request
 */
export function handleCORSPreflight(
  request: Request,
  options: CORSOptions = {}
): Response {
  const headers = getCORSHeaders(request, options)
  return new Response(null, {
    status: 204,
    headers,
  })
}

/**
 * Add CORS headers to response
 */
export function withCORS(
  response: Response,
  request: Request,
  options: CORSOptions = {}
): Response {
  const corsHeaders = getCORSHeaders(request, options)
  const newHeaders = new Headers(response.headers)

  corsHeaders.forEach((value, key) => {
    newHeaders.set(key, value)
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}

/**
 * Preset CORS configurations
 */
export const CORSPresets = {
  /**
   * Public API - Allow all origins (use cautiously)
   */
  public: {
    origin: true,
    credentials: false,
  } as CORSOptions,

  /**
   * Development - Allow localhost
   */
  development: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  } as CORSOptions,

  /**
   * Production - Allow only your domains
   */
  production: {
    origin: process.env.NEXT_PUBLIC_APP_URL
      ? [process.env.NEXT_PUBLIC_APP_URL]
      : false,
    credentials: true,
  } as CORSOptions,

  /**
   * No CORS - Internal API only
   */
  none: {
    origin: false,
  } as CORSOptions,
}
