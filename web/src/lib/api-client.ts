/**
 * API Request/Response Interceptors
 * Centralized handling for authentication, errors, and transformations
 */

import { toast } from 'sonner'

export interface APIConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  retries?: number
  retryDelay?: number
}

export interface Interceptor<T> {
  onFulfilled?: (value: T) => T | Promise<T>
  onRejected?: (error: any) => any
}

class APIClient {
  private config: APIConfig
  private requestInterceptors: Interceptor<RequestInit>[] = []
  private responseInterceptors: Interceptor<Response>[] = []

  constructor(config: APIConfig = {}) {
    this.config = {
      baseURL: '',
      timeout: 30000,
      retries: 0,
      retryDelay: 1000,
      ...config,
    }

    // Add default request interceptor
    this.addRequestInterceptor({
      onFulfilled: async (config) => {
        // Add default headers
        const headers = new Headers(config.headers)
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json')
        }
        return { ...config, headers }
      },
    })

    // Add default response interceptor
    this.addResponseInterceptor({
      onFulfilled: async (response) => {
        // Handle non-OK responses
        if (!response.ok) {
          const error = await this.parseError(response)
          throw error
        }
        return response
      },
      onRejected: async (error) => {
        // Handle network errors
        this.handleError(error)
        throw error
      },
    })
  }

  addRequestInterceptor(interceptor: Interceptor<RequestInit>) {
    this.requestInterceptors.push(interceptor)
  }

  addResponseInterceptor(interceptor: Interceptor<Response>) {
    this.responseInterceptors.push(interceptor)
  }

  private async executeRequestInterceptors(
    config: RequestInit
  ): Promise<RequestInit> {
    let result = config
    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onFulfilled) {
        try {
          result = await interceptor.onFulfilled(result)
        } catch (error) {
          if (interceptor.onRejected) {
            result = await interceptor.onRejected(error)
          } else {
            throw error
          }
        }
      }
    }
    return result
  }

  private async executeResponseInterceptors(
    response: Response
  ): Promise<Response> {
    let result = response
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onFulfilled) {
        try {
          result = await interceptor.onFulfilled(result)
        } catch (error) {
          if (interceptor.onRejected) {
            result = await interceptor.onRejected(error)
          } else {
            throw error
          }
        }
      }
    }
    return result
  }

  private async parseError(response: Response): Promise<Error> {
    let message = 'An error occurred'
    try {
      const data = await response.json()
      message = data.error || data.message || message
    } catch {
      message = response.statusText || message
    }

    const error = new Error(message) as any
    error.status = response.status
    error.response = response
    return error
  }

  private handleError(error: any) {
    if (error.name === 'AbortError') {
      console.warn('Request timeout')
      toast.error('Request timed out. Please try again.')
    } else if (!navigator.onLine) {
      toast.error('No internet connection')
    } else if (error.status === 401) {
      toast.error('Session expired. Please sign in again.')
    } else if (error.status === 403) {
      toast.error('Access denied')
    } else if (error.status === 404) {
      toast.error('Resource not found')
    } else if (error.status === 429) {
      toast.error('Too many requests. Please slow down.')
    } else if (error.status >= 500) {
      toast.error('Server error. Please try again later.')
    }
  }

  private async fetchWithTimeout(
    url: string,
    config: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort('Request timeout'), timeout)

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })
      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  private async fetchWithRetry(
    url: string,
    config: RequestInit,
    retries: number,
    retryDelay: number
  ): Promise<Response> {
    let lastError: any

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await this.fetchWithTimeout(
          url,
          config,
          this.config.timeout!
        )
        return response
      } catch (error) {
        lastError = error
        if (i < retries) {
          // Don't retry on client errors (4xx)
          if ((error as any).status >= 400 && (error as any).status < 500) {
            throw error
          }
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
        }
      }
    }

    throw lastError
  }

  async request(url: string, config: RequestInit = {}): Promise<Response> {
    // Build full URL
    const fullURL = url.startsWith('http')
      ? url
      : `${this.config.baseURL}${url}`

    // Execute request interceptors
    const finalConfig = await this.executeRequestInterceptors(config)

    // Make request with retry logic
    const response = await this.fetchWithRetry(
      fullURL,
      finalConfig,
      this.config.retries!,
      this.config.retryDelay!
    )

    // Execute response interceptors
    return await this.executeResponseInterceptors(response)
  }

  async get(url: string, config: RequestInit = {}) {
    return this.request(url, { ...config, method: 'GET' })
  }

  async post(url: string, data?: any, config: RequestInit = {}) {
    return this.request(url, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put(url: string, data?: any, config: RequestInit = {}) {
    return this.request(url, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch(url: string, data?: any, config: RequestInit = {}) {
    return this.request(url, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete(url: string, config: RequestInit = {}) {
    return this.request(url, { ...config, method: 'DELETE' })
  }
}

// Create default API client instance
export const apiClient = new APIClient({
  timeout: 30000,
  retries: 2,
  retryDelay: 1000,
})

// Export class for custom instances
export { APIClient }
