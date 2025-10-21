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
    <section id="features" className="relative py-32 bg-white dark:from-[#0a0a0a] dark:to-[#0a0a0a] overflow-hidden">

      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#0a0a0a]" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Features</span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tighter">
            <span className="block text-slate-900 dark:text-white mb-2">Everything You Need</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400">
              To Be Productive
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto font-medium">
            Built with Islamic principles at the core
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative h-full"
                >
                  {/* Card */}
                  <div className="relative h-full p-8 rounded-3xl bg-white dark:bg-[#1C1C1C] border border-slate-200 dark:border-[#2a2a2a] hover:border-slate-300 dark:hover:border-[#404040] transition-all duration-500 shadow-lg hover:shadow-2xl overflow-hidden">

                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                    {/* Icon */}
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                      className="relative mb-6"
                    >
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Glow effect on icon */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-2xl`} />
                    </motion.div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                      {feature.title}
                    </h3>

                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                      {feature.description}
                    </p>

                    {/* Arrow indicator */}
                    <motion.div
                      initial={{ x: -10, opacity: 0 }}
                      whileHover={{ x: 0, opacity: 1 }}
                      className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm"
                    >
                      <span>Learn more</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </motion.div>

                    {/* Shine effect */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl pointer-events-none">
                      <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:left-full transition-all duration-1000 skew-x-12" />
                    </div>

                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-20 text-center"
        >
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-6">
            And many more features to help you be your best self
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block"
          >
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300"
            >
              Get Started Free
              <ArrowUpRight className="w-5 h-5" />
            </a>
          </motion.div>
        </motion.div>

      </div>
    </section>
  )
}
