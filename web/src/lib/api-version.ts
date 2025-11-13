/**
 * API Versioning Utilities
 * Provides version checking and migration support for API routes
 */

export const API_VERSION = 'v1'
export const SUPPORTED_VERSIONS = ['v1']

/**
 * Extract API version from request headers or URL
 */
export function getAPIVersion(request: Request): string {
  // Check version in header first
  const headerVersion = request.headers.get('X-API-Version') || request.headers.get('API-Version')
  if (headerVersion && SUPPORTED_VERSIONS.includes(headerVersion)) {
    return headerVersion
  }

  // Check version in URL path
  const url = new URL(request.url)
  const pathMatch = url.pathname.match(/\/api\/(v\d+)\//)
  if (pathMatch && SUPPORTED_VERSIONS.includes(pathMatch[1])) {
    return pathMatch[1]
  }

  // Default to current version
  return API_VERSION
}

/**
 * Check if API version is supported
 */
export function isVersionSupported(version: string): boolean {
  return SUPPORTED_VERSIONS.includes(version)
}

/**
 * Get version-specific response headers
 */
export function getVersionHeaders(version: string = API_VERSION): Headers {
  const headers = new Headers()
  headers.set('X-API-Version', version)
  headers.set('X-Supported-Versions', SUPPORTED_VERSIONS.join(', '))
  return headers
}

/**
 * Version deprecation warning
 */
export function getDeprecationWarning(version: string): string | null {
  // Add deprecation warnings for old versions here
  // Example: if (version === 'v0') return 'API v0 will be deprecated on 2024-12-31'
  return null
}

/**
 * Middleware to add version headers to all API responses
 */
export function withVersionHeaders(response: Response, version?: string): Response {
  const versionToUse = version || API_VERSION
  const headers = new Headers(response.headers)
  headers.set('X-API-Version', versionToUse)
  headers.set('X-Supported-Versions', SUPPORTED_VERSIONS.join(', '))

  const deprecationWarning = getDeprecationWarning(versionToUse)
  if (deprecationWarning) {
    headers.set('X-API-Deprecation-Warning', deprecationWarning)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
