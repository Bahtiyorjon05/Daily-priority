'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Moon, Star, Zap, Users, CheckCircle2 } from 'lucide-react'
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
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
    if (!cardRef.current) return

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

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-emerald-50/30 dark:from-[#0a0a0a] dark:via-[#0f1f1a] dark:to-emerald-950/40">

      {/* Enhanced animated gradient orbs background with multi-layered glow effects */}
      <div className="absolute inset-0 overflow-hidden">
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
        {/* Additional subtle orbs for depth */}
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
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay">
        <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")' }} />
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-12 sm:py-16 md:py-20 lg:py-28 relative z-10">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 items-center max-w-[1400px] mx-auto">

          {/* LEFT: Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-5 sm:space-y-7 md:space-y-8 lg:space-y-10"
          >
            {/* Badge with enhanced glow effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 dark:from-emerald-600/15 dark:to-teal-600/15 rounded-full blur-xl opacity-70" />
                <span className="relative inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-emerald-50/90 to-teal-50/90 dark:from-emerald-950/60 dark:to-teal-950/60 border border-emerald-200/50 dark:border-emerald-800/60 shadow-lg shadow-emerald-500/15 dark:shadow-emerald-900/20 backdrop-blur-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Islamic Productivity Platform</span>
              </span>
            </motion.div>

            {/* Heading with stagger animation and enhanced effects */}
            <div className="space-y-5">
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.1] tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <span className="block text-gray-900 dark:text-white mb-2">
                  Daily Priority
                </span>
                <span className="block relative">
                  <span className="relative inline-block bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                    For Muslims
                  </span>
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 dark:from-emerald-400 dark:via-teal-400 dark:to-emerald-400 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  />
                </span>
              </motion.h1>

              <motion.p
                className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed font-medium"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Organize your life around{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400 relative inline-block">
                  prayer times
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-emerald-600/40 dark:bg-emerald-400/40"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  />
                </span>
                , achieve goals with{' '}
                <span className="font-bold text-emerald-600 dark:text-emerald-400 relative inline-block">
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
              className="flex flex-wrap gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {[
                { icon: CheckCircle2, text: 'Always Available', color: 'emerald' },
                { icon: Users, text: 'For Muslims', color: 'teal' },
                { icon: Moon, text: 'Prayer First', color: 'emerald' }
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  className="flex items-center gap-2 group"
                  whileHover={{ scale: 1.05, y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className={`relative w-8 h-8 rounded-lg bg-gradient-to-br from-${item.color}-500/15 to-${item.color}-600/15 dark:from-${item.color}-400/15 dark:to-${item.color}-500/15 flex items-center justify-center border border-${item.color}-500/30 dark:border-${item.color}-500/40 shadow-md shadow-${item.color}-500/10 dark:shadow-${item.color}-900/20 backdrop-blur-sm transition-all duration-300 group-hover:shadow-lg group-hover:shadow-${item.color}-500/20 dark:group-hover:shadow-${item.color}-900/30`}>
                    <div className={`absolute inset-0 bg-gradient-to-br from-${item.color}-400/10 to-${item.color}-500/10 rounded-lg blur-sm opacity-50 transition-opacity duration-300 group-hover:opacity-70`} />
                    <item.icon className={`w-4 h-4 text-${item.color}-600 dark:text-${item.color}-400 relative z-10 transition-colors duration-300 group-hover:text-${item.color}-700 dark:group-hover:text-${item.color}-300`} />
                  </div>
                  <span className={`text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300 group-hover:text-${item.color}-600 dark:group-hover:text-${item.color}-400`}>{item.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTAs with enhanced magnetic hover effect */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link href="/signup" className="group relative">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 dark:from-emerald-600/25 dark:to-teal-600/25 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Button
                    size="lg"
                    className="relative w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base font-bold bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:via-emerald-600 hover:to-teal-700 text-slate-900 dark:text-white shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all duration-200 overflow-hidden group rounded-xl transform hover:-translate-y-1 hover:scale-105"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.4 }}
                    />
                    <Moon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 relative z-10" />
                    <span className="relative z-10">Get Started</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </motion.div>
              </Link>

              <Link href="#features">
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
                    className="relative w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base font-bold border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-200 group rounded-xl transform hover:-translate-y-1 hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200" />
                    <span className="relative z-10">View Features</span>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>

          {/* RIGHT: Quote Card with enhanced 3D tilt and glow effects */}
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative perspective-1000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              style={{ rotateX, rotateY }}
              className="relative"
            >
              {/* Enhanced glow effect behind card */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/40 to-teal-500/40 rounded-[2rem] opacity-40 blur-2xl dark:opacity-30" />

              {/* Glass morphism card with animated gradient border */}
              <div className="relative rounded-3xl p-[2px] sm:p-[3px] bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-500 shadow-2xl">
                <motion.div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-400 opacity-0"
                  whileHover={{ opacity: 0.6 }}
                  transition={{ duration: 0.3 }}
                />

                <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-[calc(1.5rem-2px)] sm:rounded-[calc(1.5rem-3px)] p-4 sm:p-6 md:p-8 lg:p-10 border border-white/50 dark:border-gray-700/50 shadow-2xl shadow-emerald-500/10 dark:shadow-emerald-900/20">
                  {/* Decorative corner accents with enhanced glow */}
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 w-10 sm:w-12 h-10 sm:h-12 border-l-2 border-t-2 border-emerald-500/40 dark:border-emerald-400/40 rounded-tl-xl sm:rounded-tl-2xl shadow-sm shadow-emerald-500/20 dark:shadow-emerald-900/20" />
                  <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-10 sm:w-12 h-10 sm:h-12 border-r-2 border-b-2 border-emerald-500/40 dark:border-emerald-400/40 rounded-br-xl sm:rounded-br-2xl shadow-sm shadow-emerald-500/20 dark:shadow-emerald-900/20" />

                  {/* Quote content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuote}
                      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                      transition={{ duration: 0.5 }}
                      className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8"
                    >
                      {/* Arabic with enhanced gradient text and glow */}
                      <div className="text-center relative">
                        <div className="absolute -inset-2 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 dark:from-emerald-600/10 dark:to-teal-600/10 rounded-2xl blur opacity-50" />
                        <motion.p
                          className="relative text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 dark:from-emerald-300 dark:via-emerald-200 dark:to-teal-300 bg-clip-text text-transparent font-[family-name:var(--font-amiri)] leading-[1.8]"
                          dir="rtl"
                          initial={{ scale: 0.95 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          {islamicQuotes[currentQuote].arabic}
                        </motion.p>
                      </div>

                      {/* Premium divider with animated star and enhanced glow */}
                      <div className="flex items-center justify-center gap-2 sm:gap-3">
                        <motion.div
                          className="h-px w-10 sm:w-14 bg-gradient-to-r from-transparent via-emerald-500 to-emerald-400 dark:via-emerald-600 dark:to-emerald-700"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 fill-emerald-500 dark:text-emerald-400 dark:fill-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                        </motion.div>
                        <motion.div
                          className="h-px w-10 sm:w-14 bg-gradient-to-l from-transparent via-emerald-500 to-emerald-400 dark:via-emerald-600 dark:to-emerald-700"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        />
                      </div>

                      {/* English translation with improved styling and glow */}
                      <div className="text-center space-y-3 sm:space-y-4">
                        <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 italic font-medium leading-relaxed">
                          "{islamicQuotes[currentQuote].english}"
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/60 shadow-sm shadow-emerald-500/10 dark:shadow-emerald-900/20 backdrop-blur-sm">
                          <p className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            {islamicQuotes[currentQuote].reference}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Interactive quote indicators with enhanced hover effects */}
                  <div className="flex justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-100/50 dark:border-gray-800/50">
                    {islamicQuotes.map((_, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setCurrentQuote(index)}
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                          index === currentQuote
                            ? 'w-8 sm:w-10 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 shadow-sm shadow-emerald-500/30'
                            : 'w-1.5 sm:w-2 bg-gray-300 dark:bg-gray-700'
                        }`}
                        whileHover={{ scale: 1.5 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 5s ease infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>

    </section>
  )
}