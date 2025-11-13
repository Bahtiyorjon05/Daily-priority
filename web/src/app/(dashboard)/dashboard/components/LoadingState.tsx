'use client'

import { motion } from 'framer-motion'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingState({ 
  message = 'Loading...', 
  size = 'md' 
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  
  const borderClasses = {
    sm: 'border-2',
    md: 'border-4',
    lg: 'border-4'
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className={(sizeClasses[size]) + ' ' + (borderClasses[size]) + ' border-emerald-200 border-t-emerald-600 dark:border-emerald-700/60 dark:border-t-emerald-400 rounded-full'}
      />
      {message && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 text-gray-600 dark:text-gray-400 text-center"
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}