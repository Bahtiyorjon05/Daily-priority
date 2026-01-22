'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Moon, Star, Users, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'

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

// Floating orb component
function FloatingOrb({ delay = 0, duration = 20, className = "" }: { delay?: number; duration?: number; className?: string }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        x: [0, 100, 0],
        y: [0, -100, 0],
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

export function Hero() {
  const [currentQuote, setCurrentQuote] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  // Mouse tracking for 3D tilt effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 100, damping: 30 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 100, damping: 30 })

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % islamicQuotes.length)
    }, 10000) // 10 seconds - slower rotation for better reading
    return () => clearInterval(interval)
  }, [])

  // Handle mouse move for 3D card tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || typeof window !== 'undefined' && window.innerWidth < 1024) return

    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5

    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const quoteCardContent = (
    <div className="flex flex-col justify-between min-h-[220px] sm:min-h-[280px] md:min-h-[360px]">
      {/* Quote content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuote}
          initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
          transition={{ duration: 0.5 }}
          className="space-y-3 sm:space-y-6 md:space-y-7 lg:space-y-8 flex-1 flex flex-col justify-center"
        >
          {/* Arabic with enhanced gradient text and glow */}
          <div className="text-center relative max-w-full overflow-hidden px-1">
            <div className="absolute -inset-2 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 dark:from-emerald-600/10 dark:to-teal-600/10 rounded-2xl blur opacity-50" />
            <motion.p
              className="relative text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 dark:from-emerald-300 dark:via-emerald-200 dark:to-teal-300 bg-clip-text text-transparent font-[family-name:var(--font-amiri)] leading-[1.6] lg:leading-[1.8] break-words max-w-full px-1 py-1"
              dir="rtl"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              {islamicQuotes[currentQuote].arabic}
            </motion.p>
          </div>

          {/* Premium divider with animated star and enhanced glow */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 my-1 sm:my-2">
            <motion.div
              className="h-px w-8 sm:w-14 bg-gradient-to-r from-transparent via-emerald-500 to-emerald-400 dark:via-emerald-600 dark:to-emerald-700"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="flex items-center justify-center rounded-full border border-emerald-500/40 dark:border-emerald-400/40 p-1"
            >
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 fill-emerald-500 dark:text-emerald-400 dark:fill-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
            </motion.div>
            <motion.div
              className="h-px w-8 sm:w-14 bg-gradient-to-l from-transparent via-emerald-500 to-emerald-400 dark:via-emerald-600 dark:to-emerald-700"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
          </div>

          {/* English translation with improved styling and glow */}
          <div className="text-center space-y-2 sm:space-y-5 max-w-full overflow-hidden flex-1 flex flex-col justify-center">
            <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 italic font-medium leading-relaxed text-pretty px-2 break-words max-w-full">
              "{islamicQuotes[currentQuote].english}"
            </p>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-5 sm:py-2.5 rounded-full bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/60 shadow-sm shadow-emerald-500/10 dark:shadow-emerald-900/20 backdrop-blur-sm">
                <p className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {islamicQuotes[currentQuote].reference}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Interactive quote indicators with enhanced hover effects */}
      <div className="flex justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-8 pt-3 sm:pt-6 border-t border-gray-100/50 dark:border-gray-800/50">
        {islamicQuotes.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => setCurrentQuote(index)}
            className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${index === currentQuote
              ? 'w-8 sm:w-10 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 shadow-sm shadow-emerald-500/30'
              : 'w-1.5 sm:w-2 bg-gray-300 dark:bg-gray-700'
              }`}
            whileHover={{ scale: 1.5 }}
            whileTap={{ scale: 0.9 }}
            aria-label={`Go to quote ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )

  return (
    <section className="relative scroll-mt-16 sm:scroll-mt-20 lg:min-h-screen flex items-center bg-gradient-to-b from-white via-emerald-50/40 to-white dark:from-[#050505] dark:via-[#0b1a16] dark:to-[#050505] lg:bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] lg:from-slate-50 lg:via-slate-100 lg:to-emerald-50/30 dark:lg:from-[#0a0a0a] dark:lg:via-[#0f1f1a] dark:lg:to-emerald-950/40 overflow-hidden pt-24 pb-12 sm:py-20 md:py-24 lg:py-32">

      {/* Islamic Pattern Background */}
      <div
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] bg-cover bg-center bg-no-repeat hidden lg:block"
        style={{ backgroundImage: 'url(/islamic-pattern-hero.png)' }}
        aria-hidden="true"
      />


      {/* Enhanced animated gradient orbs background with multi-layered glow effects */}
      <div className="absolute inset-0 hidden lg:block" aria-hidden="true">
        <FloatingOrb
          delay={0}
          duration={25}
          className="w-[700px] h-[700px] -top-64 -right-64 bg-gradient-to-br from-emerald-400/40 to-teal-400/40 dark:from-emerald-600/45 dark:to-teal-600/45 shadow-2xl shadow-emerald-500/30 dark:shadow-emerald-500/30"
        />
        <FloatingOrb
          delay={5}
          duration={30}
          className="w-[600px] h-[600px] -bottom-48 -left-48 bg-gradient-to-tr from-teal-400/40 to-emerald-400/40 dark:from-teal-600/45 dark:to-emerald-600/45 shadow-2xl shadow-teal-500/30 dark:shadow-teal-500/30"
        />
        <FloatingOrb
          delay={10}
          duration={35}
          className="w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-400/35 to-teal-400/35 dark:from-emerald-600/35 dark:to-teal-600/35 shadow-2xl shadow-emerald-400/25 dark:shadow-emerald-400/25"
        />
        <FloatingOrb
          delay={15}
          duration={40}
          className="w-[300px] h-[300px] top-1/4 right-1/4 bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 dark:from-cyan-600/25 dark:to-emerald-600/25"
        />
        <FloatingOrb
          delay={20}
          duration={45}
          className="w-[250px] h-[250px] bottom-1/3 left-1/3 bg-gradient-to-tr from-teal-400/20 to-cyan-400/20 dark:from-teal-600/25 dark:to-cyan-600/25"
        />
      </div>

      {/* Enhanced noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay hidden lg:block" aria-hidden="true">
        <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")' }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full max-w-full">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center max-w-7xl mx-auto w-full box-border">

          {/* LEFT: Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 sm:space-y-6 md:space-y-8 lg:space-y-10 text-center lg:text-left max-w-xl mx-auto lg:mx-0"
          >
            {/* Badge with enhanced glow effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative flex justify-center lg:justify-start max-w-full"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 dark:from-emerald-600/15 dark:to-teal-600/15 rounded-full blur-xl opacity-70" />
              <span className="relative inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-emerald-50/90 to-teal-50/90 dark:from-emerald-950/60 dark:to-teal-950/60 border border-emerald-200/50 dark:border-emerald-800/60 shadow-lg backdrop-blur-sm max-w-[calc(100vw-2rem)]">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="flex items-center justify-center"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
                <span className="text-sm sm:text-base font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap sm:whitespace-normal">
                  Islamic Productivity Platform
                </span>
              </span>
            </motion.div>

            {/* Heading with stagger animation and enhanced effects */}
            <div className="space-y-3 sm:space-y-4 px-0 max-w-full">
              <motion.h1
                className="text-4xl leading-[1.15] sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-balance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <span className="block text-gray-900 dark:text-white mb-1 sm:mb-2">
                  Daily Priority
                </span>
                <span className="block relative max-w-full">
                  <span className="relative inline-block bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-400 bg-clip-text text-transparent bg-[length:200%_auto] sm:animate-gradient pb-2">
                    For Muslims
                  </span>
                  <motion.span
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-400 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  />
                </span>
              </motion.h1>

              <motion.p
                className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-full lg:max-w-2xl leading-relaxed text-balance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Organize your life around{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 relative inline-block">
                  prayer times
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-600/40 dark:bg-emerald-400/40"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  />
                </span>
                , achieve goals with{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 relative inline-block">
                  Islamic principles
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-600/40 dark:bg-emerald-400/40"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 1 }}
                  />
                </span>
                , and grow spiritually every day.
              </motion.p>
            </div>

            {/* Premium trust indicators with enhanced hover effects */}
            <motion.div
              className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start px-0 max-w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {[
                { icon: CheckCircle2, text: 'Free', longText: 'Always Available', color: 'emerald' },
                { icon: Users, text: 'Muslims', longText: 'For Muslims', color: 'teal' },
                { icon: Moon, text: 'Prayer', longText: 'Prayer First', color: 'emerald' }
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  className="flex items-center gap-2 group"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="relative w-8 h-8 sm:w-10 lg:w-8 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/15 dark:from-emerald-400/15 dark:to-emerald-500/15 flex items-center justify-center border border-emerald-500/30 dark:border-emerald-500/40 shadow-md shadow-emerald-500/10 dark:shadow-emerald-900/20 backdrop-blur-sm transition-all duration-300 group-hover:shadow-lg group-hover:shadow-emerald-500/20 dark:group-hover:shadow-emerald-900/30">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-emerald-500/10 rounded-lg sm:rounded-xl blur-sm opacity-50 transition-opacity duration-300 group-hover:opacity-70" />
                    <item.icon className="w-4 h-4 sm:w-5 lg:w-4 text-emerald-600 dark:text-emerald-400 relative z-10 transition-colors duration-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300" />
                  </div>
                  <span className="text-sm sm:text-base lg:text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    <span className="sm:hidden">{item.text}</span>
                    <span className="hidden sm:inline">{item.longText}</span>
                  </span>
                </motion.div>
              ))}
            </motion.div>


            {/* CTAs with enhanced magnetic hover effect */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 w-full max-w-sm sm:max-w-full mx-auto sm:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link href="/signup" className="group relative w-full sm:w-auto">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 dark:from-emerald-600/25 dark:to-teal-600/25 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button
                    size="lg"
                    className="relative w-full sm:w-auto h-12 sm:h-12 px-6 sm:px-6 text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 rounded-xl"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.4 }}
                    />
                    <Moon className="w-5 h-5 mr-2 relative z-10" />
                    <span className="relative z-10">Get Started</span>
                    <ArrowRight className="w-5 h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </motion.div>
              </Link>

              <Link href="#features" className="w-full sm:w-auto">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-gray-400/20 to-gray-500/20 dark:from-gray-600/20 dark:to-gray-700/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button
                    size="lg"
                    variant="outline"
                    className="relative w-full sm:w-auto h-12 sm:h-12 px-6 sm:px-6 text-base font-semibold border-2 hover:border-emerald-500 transition-all duration-300 rounded-xl"
                  >
                    <Sparkles className="w-5 h-5 mr-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200" />
                    <span className="relative z-10">View Features</span>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* RIGHT: Enhanced Visual Card with Illustration */}
          <div className="lg:hidden rounded-2xl sm:rounded-3xl border-2 border-emerald-100/80 dark:border-emerald-900/50 bg-white/90 dark:bg-[#0b1a16]/90 shadow-xl shadow-emerald-100/60 dark:shadow-black/50 p-4 sm:p-6 md:p-8 mt-4 sm:mt-10 max-w-full overflow-hidden relative">
            {/* Decorative Islamic Ornament */}
            <div className="absolute top-2 right-2 w-12 h-12 sm:w-16 sm:h-16 opacity-20 dark:opacity-10">
              <img src="/islamic-ornament.png" alt="" className="w-full h-full object-contain" />
            </div>
            {quoteCardContent}
          </div>

          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block relative perspective-1000 max-w-2xl w-full mx-auto lg:mx-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              style={{ rotateX, rotateY }}
              className="relative"
            >
              {/* Prayer Illustration Background */}
              <div className="absolute -right-12 -top-12 w-64 h-64 opacity-15 dark:opacity-10 pointer-events-none">
                <img src="/prayer-illustration.png" alt="" className="w-full h-full object-contain" />
              </div>

              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/40 to-teal-500/40 rounded-[2rem] opacity-40 blur-2xl dark:opacity-30" />

              <div className="relative rounded-3xl p-[2px] bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-500 shadow-2xl">
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-400 opacity-0"
                  whileHover={{ opacity: 0.6 }}
                  transition={{ duration: 0.3 }}
                />

                <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-[calc(1.5rem-2px)] sm:rounded-[calc(1.5rem-3px)] p-6 lg:p-10 border border-white/50 dark:border-gray-700/50 shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-900/20">
                  <div className="absolute top-4 left-4 sm:top-4 sm:left-4 w-10 h-10 sm:w-12 sm:h-12 border-l-2 border-t-2 border-emerald-500/40 dark:border-emerald-400/40 rounded-tl-xl sm:rounded-tl-2xl shadow-sm shadow-emerald-500/20 dark:shadow-emerald-900/20" />
                  <div className="absolute bottom-4 right-4 sm:bottom-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 border-r-2 border-b-2 border-emerald-500/40 dark:border-emerald-400/40 rounded-br-xl sm:rounded-br-2xl shadow-sm shadow-emerald-500/20 dark:shadow-emerald-900/20" />
                  {quoteCardContent}
                </div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
