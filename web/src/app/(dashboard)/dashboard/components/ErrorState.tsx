'use client'

import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
}

export default function ErrorState({ 
  title = 'Something went wrong', 
  message = 'We encountered an unexpected error. Please try again.',
  onRetry,
  retryLabel = 'Try Again'
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/60 flex items-center justify-center mb-6 ring-1 ring-red-200 dark:ring-red-700/50">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>

      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
        {message}
      </p>
      
      {onRetry && (
        <Button 
          onClick={onRetry}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
        </Button>
      )}
      
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
        If the problem persists, please contact support.
      </p>
    </motion.div>
  )
}