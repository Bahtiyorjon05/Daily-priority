'use client'

import { Moon, CheckSquare, BarChart3, Target, Calendar, Heart, Sparkles, ArrowUpRight } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const features = [
  {
    icon: Moon,
    title: 'Prayer Times First',
    description: 'Never miss Salah with intelligent prayer time notifications. Your day organized around the five daily prayers.',
    gradient: 'from-emerald-500 to-teal-500',
    shadowColor: 'emerald'
  },
  {
    icon: Target,
    title: 'Dunya & Akhirah Goals',
    description: 'Set and track both worldly and spiritual goals. Balance success in this life and the hereafter.',
    gradient: 'from-teal-500 to-cyan-500',
    shadowColor: 'teal'
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'Beautiful insights into your productivity journey with comprehensive charts and tracking.',
    gradient: 'from-cyan-500 to-blue-500',
    shadowColor: 'cyan'
  },
  {
    icon: CheckSquare,
    title: 'Smart Task Management',
    description: 'Prioritize tasks with energy levels, deadlines, and Islamic productivity principles.',
    gradient: 'from-blue-500 to-indigo-500',
    shadowColor: 'blue'
  },
  {
    icon: Calendar,
    title: 'Islamic Calendar',
    description: 'Stay connected with Hijri dates, Islamic events, and important religious occasions.',
    gradient: 'from-violet-500 to-purple-500',
    shadowColor: 'violet'
  },
  {
    icon: Heart,
    title: 'Gratitude Journal',
    description: 'Daily reflection and gratitude practice to strengthen your connection with Allah.',
    gradient: 'from-pink-500 to-rose-500',
    shadowColor: 'pink'
  }
]

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-emerald-50/40 dark:from-[#0a0a0a] dark:via-[#0f1f1a] dark:to-emerald-950/60 overflow-hidden">

      {/* Enhanced gradient background with subtle animation */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-50 via-slate-100 to-emerald-50/40 dark:from-[#0a0a0a] dark:via-[#0f1f1a] dark:to-emerald-950/60" />

      {/* Floating orbs for background effect with enhanced depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 dark:from-emerald-600/25 dark:to-teal-600/25 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-gradient-to-tr from-teal-400/20 to-cyan-400/20 dark:from-teal-600/25 dark:to-cyan-600/25 rounded-full blur-3xl animate-float-slower" />
        {/* Additional orbs for enhanced depth */}
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-cyan-400/15 to-emerald-400/15 dark:from-cyan-600/20 dark:to-emerald-600/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-tr from-emerald-400/15 to-teal-400/15 dark:from-emerald-600/20 dark:to-teal-600/20 rounded-full blur-3xl animate-pulse-medium" />
      </div>

      {/* Enhanced noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay">
        <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")' }} />
      </div>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-7xl relative z-10">

        {/* Header with enhanced glow effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 md:mb-16 lg:mb-20 space-y-3 sm:space-y-4 md:space-y-5"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-50/90 to-teal-50/90 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/60 shadow-lg shadow-emerald-500/15 dark:shadow-emerald-900/20 backdrop-blur-sm"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/15 to-teal-400/15 dark:from-emerald-600/10 dark:to-teal-600/10 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 relative z-10">Features</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tighter">
            <span className="block text-slate-900 dark:text-white mb-2">Everything You Need</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400">
              To Be Productive
            </span>
          </h2>

          <p className="text-lg sm:text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
            Built with Islamic principles at the core
          </p>
        </motion.div>

        {/* Features Grid with enhanced hover effects */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
              >
                <motion.div
                  whileHover={{ y: -12, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative h-full"
                >
                  {/* Enhanced glow effect on hover */}
                  <div className={`absolute -inset-2 bg-gradient-to-br ${feature.gradient} rounded-3xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />

                  {/* Card with enhanced glass morphism */}
                  <div className="relative h-full p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#1C1C1C]/80 border border-slate-200/60 dark:border-[#2a2a2a]/60 hover:border-slate-300 dark:hover:border-[#404040]/60 transition-all duration-500 shadow-xl hover:shadow-2xl overflow-hidden backdrop-blur-sm">

                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl sm:rounded-3xl`} />

                    {/* Icon with enhanced glow and animation */}
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                      className="relative mb-5"
                    >
                      <div className={`relative inline-flex p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg shadow-${feature.shadowColor}-500/30 dark:shadow-${feature.shadowColor}-900/30`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} blur opacity-50 rounded-xl sm:rounded-2xl`} />
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white relative z-10" />
                      </div>

                      {/* Glow effect on icon */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-xl sm:rounded-2xl`} />
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                      {feature.title}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-5 text-sm sm:text-base">
                      {feature.description}
                    </p>

                    {/* Enhanced Learn More button with redirect to signup */}
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      whileHover={{ x: 0, opacity: 1 }}
                      className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm cursor-pointer group/btn"
                      onClick={() => window.location.href = '/signup'}
                    >
                      <span className="group-hover/btn:text-emerald-700 dark:group-hover/btn:text-emerald-300 transition-colors duration-300">Learn more</span>
                      <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                    </motion.div>

                    {/* Enhanced shine effect */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-2xl sm:rounded-3xl pointer-events-none">
                      <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:left-full transition-all duration-1000 skew-x-12" />
                    </div>

                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Bottom CTA with enhanced glow effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 sm:mt-20 text-center"
        >
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-5 sm:mb-6">
            And many more features to help you be your best self
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block relative"
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 dark:from-emerald-600/25 dark:to-teal-600/25 rounded-2xl sm:rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <a
              href="/signup"
              className="relative inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-900 dark:text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-200 text-sm sm:text-base transform hover:-translate-y-1 hover:scale-105 group overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10">Get Started</span>
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
            </a>
          </motion.div>
        </motion.div>

      </div>
    </section>
  )
}