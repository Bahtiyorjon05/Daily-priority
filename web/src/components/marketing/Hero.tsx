'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Moon, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

const islamicQuotes = [
  {
    arabic: "إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    english: "Indeed, with hardship comes ease",
    reference: "Quran 94:6"
  },
  {
    arabic: "فَٱذْكُرُونِىٓ أَذْكُرْكُمْ",
    english: "Remember Me, I will remember you",
    reference: "Quran 2:152"
  },
  {
    arabic: "لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    english: "Allah does not burden a soul beyond it can bear",
    reference: "Quran 2:286"
  },
  {
    arabic: "أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ",
    english: "In the remembrance of Allah hearts find peace",
    reference: "Quran 13:28"
  },
  {
    arabic: "وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًا",
    english: "Whoever fears Allah, He will make a way out for them",
    reference: "Quran 65:2"
  },
  {
    arabic: "إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ",
    english: "Indeed, Allah is with the patient",
    reference: "Quran 2:153"
  },
  {
    arabic: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    english: "For indeed, with hardship will be ease",
    reference: "Quran 94:5"
  },
  {
    arabic: "وَٱللَّهُ خَيْرٌ حَـٰفِظًا",
    english: "And Allah is the best guardian",
    reference: "Quran 12:64"
  },
  {
    arabic: "حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ",
    english: "Allah is sufficient for us",
    reference: "Quran 3:173"
  },
  {
    arabic: "وَٱصْبِرْ فَإِنَّ ٱللَّهَ لَا يُضِيعُ أَجْرَ ٱلْمُحْسِنِينَ",
    english: "Be patient! Allah does not waste the reward of the good-doers",
    reference: "Quran 11:115"
  }
]

export function Hero() {
  const [currentQuote, setCurrentQuote] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % islamicQuotes.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-white dark:bg-black">

      {/* Premium gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent dark:from-emerald-900/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-100/40 via-transparent to-transparent dark:from-teal-900/20" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-[1400px] mx-auto">

          {/* LEFT: Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Badge */}
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                <Star className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Islamic Productivity Platform</span>
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-none tracking-tight">
                <span className="block text-gray-900 dark:text-white mb-2">Daily Priority</span>
                <span className="block bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-400 bg-clip-text text-transparent">
                  For Muslims
                </span>
              </h1>

              <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl">
                Organize your life around <span className="font-semibold text-emerald-600 dark:text-emerald-400">prayer times</span>, achieve goals with <span className="font-semibold text-emerald-600 dark:text-emerald-400">Islamic principles</span>, and grow spiritually every day.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200">
                  <Moon className="w-5 h-5 mr-2" />
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 border-2 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Sparkles className="w-5 h-5 mr-2" />
                  View Features
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* RIGHT: Quote Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Card with gradient border effect */}
            <div className="relative rounded-3xl p-[2px] bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-500 shadow-2xl">
              <div className="relative bg-white dark:bg-gray-900 rounded-[calc(1.5rem-2px)] p-8 sm:p-10">

                {/* Quote content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuote}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                    {/* Arabic */}
                    <div className="text-center">
                      <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-600 dark:text-emerald-400 font-[family-name:var(--font-amiri)] leading-[1.9]" dir="rtl">
                        {islamicQuotes[currentQuote].arabic}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-300 dark:to-emerald-700" />
                      <Star className="w-3 h-3 text-emerald-500 fill-emerald-500" />
                      <div className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-300 dark:to-emerald-700" />
                    </div>

                    {/* English */}
                    <div className="text-center space-y-3">
                      <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 italic">
                        "{islamicQuotes[currentQuote].english}"
                      </p>
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {islamicQuotes[currentQuote].reference}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Quote indicators */}
                <div className="flex justify-center gap-1.5 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                  {islamicQuotes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentQuote(index)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === currentQuote
                          ? 'w-8 bg-gradient-to-r from-emerald-600 to-teal-600'
                          : 'w-1.5 bg-gray-300 dark:bg-gray-700 hover:bg-emerald-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

    </section>
  )
}
