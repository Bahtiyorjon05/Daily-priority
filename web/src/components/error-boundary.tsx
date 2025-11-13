'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SUPPORT_EMAIL } from '@/constants/defaults'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error, errorInfo)
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    this.setState({
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
          <Card className="max-w-2xl w-full p-8 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-red-200/50 dark:border-red-700/50 rounded-2xl shadow-2xl">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-xl opacity-30 rounded-full"></div>
                <div className="relative p-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-full">
                  <AlertCircle className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                  Error Details (Development Only):
                </h3>
                <pre className="text-xs text-red-700 dark:text-red-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <div className="mt-2">
                      <div className="font-semibold">Component Stack:</div>
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={this.handleReset}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Try Again
              </Button>

              <Button
                onClick={this.handleRefresh}
                variant="outline"
                className="w-full sm:w-auto border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Reload Page
              </Button>

              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Home className="mr-2 h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>

            {/* Support Message */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If this problem persists, please{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  contact support
                </a>
                .
              </p>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional component wrapper for easier usage
export function ErrorBoundaryWrapper({ children, ...props }: ErrorBoundaryProps) {
  return <ErrorBoundary {...props}>{children}</ErrorBoundary>
}
