'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MessageSquare, Send, Sparkles, Loader2, CheckCircle2, PartyPopper } from 'lucide-react'
import { toast } from 'sonner'


export function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Prevent multiple submissions
    if (isSubmitting || showSuccess) {
      return
    }

    // Trim and validate form data before sending
    const trimmedData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      message: formData.message.trim()
    }

    if (!trimmedData.name || !trimmedData.email || !trimmedData.message) {
      toast.error('Please fill in all fields', {
        description: 'Name, email, and message are required.',
        duration: 3000,
      })
      return
    }

    if (trimmedData.message.length < 5) {
      toast.error('Message too short', {
        description: 'Please write at least 5 characters.',
        duration: 3000,
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedData.email)) {
      toast.error('Invalid email', {
        description: 'Please enter a valid email address.',
        duration: 3000,
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trimmedData),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error('Invalid server response')
      }

      if (response.ok) {
        // Show success animation
        setShowSuccess(true)

        toast.success('🎉 Message sent successfully!', {
          description: 'Thank you for reaching out! We\'ll get back to you within 24-48 hours.',
          duration: 5000,
        })

        // Reset form after successful submission
        setFormData({ name: '', email: '', message: '' })

        // Hide success animation after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000)
      } else {
        const errorMessage = data?.error || data?.details?.[0]?.message || `Server error: ${response.status}`
        console.error('Contact form error:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        })
        toast.error('Failed to send message', {
          description: errorMessage,
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('Contact form error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please check your connection and try again.'
      toast.error('Something went wrong', {
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" className="relative py-10 sm:py-14 md:py-18 lg:py-28 bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-emerald-50/90 via-teal-50/80 to-cyan-50/70 dark:from-[#0a0a0a] dark:via-[#0d2a22] dark:to-[#0a1f18] scroll-mt-16 sm:scroll-mt-20">

      <div className="absolute inset-0 sm:hidden bg-gradient-to-b from-white via-emerald-50/60 to-white dark:from-[#050505] dark:via-[#0c1f19]/90 dark:to-[#050505]" aria-hidden="true" />

      {/* Enhanced animated background elements with additional depth */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block" aria-hidden="true">
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
          className="absolute top-0 left-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-br from-emerald-400/40 to-teal-400/40 dark:from-emerald-500/45 dark:to-teal-500/45 rounded-full blur-3xl shadow-2xl shadow-emerald-500/25 dark:shadow-emerald-900/35"
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
          className="absolute bottom-0 right-1/4 w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-tl from-teal-400/40 to-cyan-400/40 dark:from-teal-500/45 dark:to-cyan-500/45 rounded-full blur-3xl shadow-2xl shadow-teal-500/25 dark:shadow-teal-900/35"
        />
        {/* Additional animated elements for enhanced depth */}
        <motion.div
          animate={{
            scale: [1.1, 0.9, 1.1],
            rotate: [0, 45, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-0 w-56 sm:w-72 h-56 sm:h-72 bg-gradient-to-br from-cyan-400/30 to-emerald-400/30 dark:from-cyan-500/35 dark:to-emerald-500/35 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [0.9, 1.1, 0.9],
            rotate: [0, -45, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-1/3 right-0 w-56 sm:w-72 h-56 sm:h-72 bg-gradient-to-tl from-emerald-400/30 to-cyan-400/30 dark:from-emerald-500/35 dark:to-cyan-500/35 rounded-full blur-3xl"
        />
      </div>

      {/* Enhanced noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay hidden lg:block" aria-hidden="true">
        <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")' }} />
      </div>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-4xl relative z-10 overflow-hidden">

        {/* Header with enhanced glow effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16 space-y-3 sm:space-y-4 md:space-y-5"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100/90 to-teal-100/90 dark:from-emerald-950/60 dark:to-teal-950/60 border border-emerald-300/50 dark:border-emerald-700/60 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-900/25 backdrop-blur-sm"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 dark:from-emerald-600/15 dark:to-teal-600/15 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 relative z-10">Get in Touch</span>
          </motion.div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold leading-tight text-balance">
            <span className="block text-slate-900 dark:text-white mb-1 sm:mb-2">We're Here to Help</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400">
              Reach Out Anytime
            </span>
          </h2>

          <p className="text-xs sm:text-sm md:text-base lg:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed text-pretty px-2">
            Have questions or feedback? We'd love to hear from you
          </p>
        </motion.div>

        {/* Contact Form Card with enhanced glass morphism */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative group">
            {/* Enhanced glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/40 via-teal-500/40 to-cyan-500/40 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

            {/* Card with enhanced glass morphism */}
            <div className="relative bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-2xl border-2 border-emerald-200/50 dark:border-emerald-700/60 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-8 shadow-2xl hover:shadow-3xl transition-all duration-500">

              {/* Decorative elements */}
              <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-emerald-500/30 dark:border-emerald-400/30 rounded-tl-2xl" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-emerald-500/30 dark:border-emerald-400/30 rounded-br-2xl" />

              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                  {/* Name Field with enhanced styling */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 dark:from-emerald-600/5 dark:to-teal-600/5 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="relative w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/90 dark:bg-[#121212]/90 border-2 border-slate-200/60 dark:border-[#404040]/60 rounded-xl sm:rounded-2xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm backdrop-blur-sm"
                      placeholder="Enter your name"
                      required
                    />
                  </motion.div>

                  {/* Email Field with enhanced styling */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="relative"
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 dark:from-emerald-600/5 dark:to-teal-600/5 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="relative w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/90 dark:bg-[#121212]/90 border-2 border-slate-200/60 dark:border-[#404040]/60 rounded-xl sm:rounded-2xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm backdrop-blur-sm"
                      placeholder="your@email.com"
                      required
                    />
                  </motion.div>
                </div>

                {/* Message Field with enhanced styling */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/10 to-teal-400/10 dark:from-emerald-600/5 dark:to-teal-600/5 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 sm:mb-3">
                    Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="relative w-full px-4 sm:px-5 py-3 sm:py-4 bg-white/90 dark:bg-[#121212]/90 border-2 border-slate-200/60 dark:border-[#404040]/60 rounded-xl sm:rounded-2xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm backdrop-blur-sm"
                    placeholder="How can we help you?"
                    required
                  />
                </motion.div>

                {/* Submit Button with enhanced glow effect */}
                <motion.div
                  whileHover={{ scale: (isSubmitting || showSuccess) ? 1 : 1.02 }}
                  whileTap={{ scale: (isSubmitting || showSuccess) ? 1 : 0.98 }}
                  className="relative group"
                >
                  {/* Animated glow effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 animate-pulse transition duration-500" />

                  <button
                    type="submit"
                    disabled={isSubmitting || showSuccess}
                    className="relative w-full h-16 sm:h-16 md:h-20 text-base sm:text-lg md:text-2xl font-black bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-700 hover:from-emerald-800 hover:via-teal-800 hover:to-emerald-800 rounded-2xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 overflow-hidden border-4 border-emerald-800/30 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] text-white"
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

                    {/* Sparkle effects */}
                    <div className="absolute top-2 right-4 w-2 h-2 bg-white rounded-full animate-ping" />
                    <div className="absolute bottom-3 left-6 w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" />
                    <div className="absolute top-1/2 right-8 w-1 h-1 bg-white/60 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />

                    {/* Button content */}
                    <span className="relative flex items-center justify-center gap-3 font-black tracking-wide uppercase text-white">
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={3} />
                          </motion.div>
                          <span className="drop-shadow-lg font-black text-white">Sending...</span>
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          >
                            <Sparkles className="w-5 h-5 text-white fill-current" />
                          </motion.div>
                        </>
                      ) : (
                        <>
                          <motion.div
                            whileHover={{ x: 5 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <Send className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={3} />
                          </motion.div>
                          <span className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)] font-black text-white">
                            Send Message
                          </span>
                          <motion.div
                            animate={{
                              rotate: [0, 15, -15, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-current" />
                          </motion.div>
                        </>
                      )}
                    </span>

                    {/* Bottom glow */}
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  </button>
                </motion.div>

                {/* Success Animation Overlay */}
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -20 }}
                      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                      className="absolute inset-0 flex items-center justify-center bg-white/95 dark:bg-[#1C1C1C]/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border-2 border-emerald-500/50 shadow-2xl"
                    >
                      <div className="text-center space-y-4 p-6">
                        {/* Animated Check Icon */}
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 200 }}
                          className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-xl opacity-60 animate-pulse" />
                          <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full w-full h-full flex items-center justify-center shadow-2xl">
                            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={3} />
                          </div>
                        </motion.div>

                        {/* Confetti/Sparkles Animation */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="flex justify-center gap-2"
                        >
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0, y: 0 }}
                              animate={{
                                opacity: [0, 1, 0],
                                scale: [0, 1.5, 0],
                                y: [-20, -60, -80],
                                x: [(i - 2) * 20, (i - 2) * 30, (i - 2) * 40]
                              }}
                              transition={{
                                delay: 0.5 + i * 0.1,
                                duration: 1.5,
                                ease: "easeOut"
                              }}
                            >
                              <Sparkles className="w-4 h-4 text-emerald-500" />
                            </motion.div>
                          ))}
                        </motion.div>

                        {/* Success Text */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="space-y-2"
                        >
                          <h3 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                            Message Sent! 🎉
                          </h3>
                          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xs mx-auto text-pretty">
                            Thank you for reaching out! We'll get back to you within 24-48 hours.
                          </p>
                        </motion.div>

                        {/* Party Popper Icon */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0, rotate: -45 }}
                          animate={{
                            opacity: 1,
                            scale: [0, 1.2, 1],
                            rotate: [0, 15, -15, 0]
                          }}
                          transition={{ delay: 0.3, duration: 0.8 }}
                        >
                          <PartyPopper className="w-12 h-12 mx-auto text-emerald-500" />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>

              {/* Contact Info with enhanced cards */}
              <div className="mt-8 sm:mt-10 pt-8 sm:pt-10 border-t-2 border-emerald-100/80 dark:border-emerald-800/50">
                <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
                  <motion.a
                    href="mailto:dailypriorityapp@gmail.com"
                    whileHover={{ scale: 1.05, y: -3 }}
                    className="flex items-center gap-3 group cursor-pointer relative"
                  >
                    <div className="absolute -inset-2 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-2xl sm:rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/50 dark:group-hover:shadow-emerald-400/40 transition-all duration-300 border-2 border-emerald-400/50 dark:border-emerald-500/50 backdrop-blur-sm">
                      <Mail className="w-5 h-5 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Email Us</div>
                      <div className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors text-sm sm:text-base">dailypriorityapp@gmail.com</div>
                    </div>
                  </motion.a>

                  <motion.a
                    href="https://t.me/Bahtiyorjon05"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05, y: -3 }}
                    className="flex items-center gap-3 group cursor-pointer relative"
                  >
                    <div className="absolute -inset-2 bg-gradient-to-br from-blue-400/30 to-cyan-400/30 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-2xl sm:rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 dark:group-hover:shadow-blue-400/40 transition-all duration-300 border-2 border-blue-400/50 dark:border-blue-500/50 backdrop-blur-sm">
                      <MessageSquare className="w-5 h-5 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Telegram Support</div>
                      <div className="font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors text-sm sm:text-base">@Bahtiyorjon05</div>
                    </div>
                  </motion.a>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
