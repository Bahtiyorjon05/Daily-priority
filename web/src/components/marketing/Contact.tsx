'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageSquare, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  return (
    <section id="contact" className="relative py-32 overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-[#0a0a0a] dark:via-[#0d1f1a] dark:to-[#0a0a0a]">

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-teal-400/20 to-cyan-400/20 dark:from-teal-500/10 dark:to-cyan-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 max-w-4xl relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 border border-emerald-300/50 dark:border-emerald-700/50"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Get in Touch</span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
            <span className="block text-slate-900 dark:text-white mb-2">We're Here to Help</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400">
              Reach Out Anytime
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Have questions or feedback? We'd love to hear from you
          </p>
        </motion.div>

        {/* Contact Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-cyan-500/30 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />

            {/* Card */}
            <div className="relative bg-white/90 dark:bg-[#1C1C1C]/90 backdrop-blur-2xl border-2 border-emerald-200/50 dark:border-emerald-700/50 rounded-3xl p-8 md:p-12 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-5 py-4 bg-white dark:bg-[#121212] border-2 border-slate-200 dark:border-[#404040] rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                      placeholder="Enter your name"
                      required
                    />
                  </motion.div>

                  {/* Email Field */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-5 py-4 bg-white dark:bg-[#121212] border-2 border-slate-200 dark:border-[#404040] rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                      placeholder="your@email.com"
                      required
                    />
                  </motion.div>
                </div>

                {/* Message Field */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className="w-full px-5 py-4 bg-white dark:bg-[#121212] border-2 border-slate-200 dark:border-[#404040] rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                    placeholder="How can we help you?"
                    required
                  />
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="group w-full h-16 text-lg font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-500 text-white rounded-xl shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/70 transition-all duration-500 relative overflow-hidden"
                  >
                    <span className="absolute inset-0 w-full h-full">
                      <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    </span>
                    <span className="relative flex items-center justify-center gap-2">
                      Send Message
                      <Send className="w-5 h-5" />
                    </span>
                  </Button>
                </motion.div>
              </form>

              {/* Contact Info */}
              <div className="mt-10 pt-10 border-t border-slate-200 dark:border-[#404040]">
                <div className="flex flex-wrap justify-center gap-8">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-3 group cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-300">
                      <Mail className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Email</div>
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">contact@dailypriority.com</div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="flex items-center gap-3 group cursor-pointer"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-teal-500/30 transition-all duration-300">
                      <MessageSquare className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Support</div>
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Available 24/7</div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
