'use client'

import { Heart, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-emerald-50/60 to-teal-50/50 dark:from-gray-950 dark:via-emerald-950/30 dark:to-gray-950">

      {/* Enhanced background pattern with multiple layers */}
      <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.04]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          color: '#10b981'
        }} />
      </div>
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 10px 10px, currentColor 0.5px, transparent 0)`,
          backgroundSize: '30px 30px',
          color: '#14b8a6'
        }} />
      </div>

      {/* Gradient overlay for better contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-transparent dark:from-gray-900/40" />

      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8"
        >

          {/* Main message */}
          <div className="space-y-5">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse" }}
              >
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] dark:drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-700 dark:from-emerald-300 dark:via-teal-300 dark:to-emerald-300 bg-clip-text text-transparent">
                Made for the Muslim Ummah
              </h3>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", delay: 1.25 }}
              >
                <Heart className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] dark:drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
              </motion.div>
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-base sm:text-lg md:text-xl font-semibold text-emerald-800 dark:text-emerald-200">
                This platform is our <span className="text-emerald-700 dark:text-emerald-300 font-black">Sadaqah Jariyah</span> for you
              </p>
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>

          {/* Decorative divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-32 sm:w-40 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/60 dark:via-emerald-400/50 to-transparent" />
            <div className="absolute w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/50" />
          </div>

          {/* Copyright */}
          <div className="space-y-3">
            <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base md:text-lg font-bold">
              © {new Date().getFullYear()} Daily Priority • For Muslims Worldwide
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium">
              May Allah accept this work and benefit the Ummah
            </p>
          </div>

        </motion.div>
      </div>

    </footer>
  )
}