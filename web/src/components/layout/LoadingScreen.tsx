'use client'

import { motion } from 'framer-motion'
import { Target } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-emerald-950/20 dark:to-teal-950/20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
          className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
        >
          <Target className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Daily Priority
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Loading your dashboard...
        </p>
      </motion.div>
    </div>
  )
}
