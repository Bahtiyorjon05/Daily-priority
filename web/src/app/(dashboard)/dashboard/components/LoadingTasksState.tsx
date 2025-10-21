'use client'

import { motion } from 'framer-motion'

const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 animate-pulse"
  >
    <div className="flex items-start gap-4">
      <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4"></div>
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-16"></div>
          <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-20"></div>
        </div>
      </div>
    </div>
  </motion.div>
)

export default function LoadingTasksState() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-48 animate-pulse"></div>
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-32 animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Loading skeleton cards */}
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard key={index} delay={index * 0.1} />
        ))}
      </div>
    </div>
  )
}
