'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className="relative group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-2xl shadow-black/30 dark:shadow-emerald-500/40 hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] dark:hover:shadow-emerald-500/60 transition-all duration-300 hover:from-emerald-700 hover:to-teal-700 hover:scale-110 ring-4 ring-white/80 dark:ring-emerald-400/30 focus:outline-none focus:ring-4 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
          >
            <div className="absolute -inset-3 bg-gradient-to-br from-emerald-600/60 to-teal-600/60 dark:from-emerald-500/40 dark:to-teal-500/40 rounded-full blur-lg opacity-70 group-hover:opacity-100 transition-opacity duration-300" />
            <ArrowUp className="w-6 h-6 relative z-10 drop-shadow-lg stroke-[2.5]" />
          </button>
        </motion.div>
      )}
    </>
  )
}