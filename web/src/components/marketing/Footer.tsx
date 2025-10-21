'use client'

import { Heart, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 dark:from-[#0a0a0a] dark:via-[#0a1410] dark:to-[#0a0a0a]">

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
          color: '#10b981'
        }} />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center space-y-8"
        >

          {/* Main message */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                <Heart className="h-6 w-6 text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
              </motion.div>
              <h3 className="text-2xl md:text-3xl font-black text-white">
                Made for the Muslim Ummah
              </h3>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 1 }}
              >
                <Heart className="h-6 w-6 text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
              </motion.div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <p className="text-lg text-emerald-200 dark:text-emerald-300">
                This platform is our <span className="text-amber-300 font-bold">Sadaqah Jariyah</span> for you
              </p>
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
          </div>

          {/* Divider */}
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mx-auto" />

          {/* Copyright */}
          <div className="space-y-2">
            <p className="text-emerald-200 dark:text-emerald-300 text-sm font-medium">
              © {new Date().getFullYear()} Daily Priority • For Muslims Worldwide
            </p>
            <p className="text-emerald-300 dark:text-emerald-400 text-xs">
              100% Free • Always Free • For the Sake of Allah
            </p>
          </div>

        </motion.div>
      </div>

    </footer>
  )
}
