'use client'

import { useT } from '@/lib/i18n/client'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Moon } from 'lucide-react'
import { useState } from 'react'

/** Floating install banner — shows on ALL devices (mobile + desktop) */
export function InstallPrompt() {
  const { t } = useT()
  const { canShow, isIOS, isAndroid, hasNativePrompt, promptInstall, dismiss } = useInstallPrompt()
  const [showTip, setShowTip] = useState(false)

  if (!canShow) return null

  const handleInstall = async () => {
    if (hasNativePrompt) {
      await promptInstall()
    } else {
      setShowTip(true)
      setTimeout(() => setShowTip(false), 4000)
    }
  }

  return (
    <AnimatePresence>
      {canShow && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-3 right-3 z-[100] sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-xs"
        >
          <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-200/60 dark:border-emerald-700/50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-emerald-500/20 dark:shadow-emerald-900/40">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />

            <div className="p-3 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0">
                <Moon className="h-5 w-5 text-white" />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleInstall}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-md shadow-emerald-500/30 transition-all duration-200 min-h-0"
              >
                <Download className="h-4 w-4" />
                {t('ui.installApp')}
              </motion.button>

              <button
                onClick={dismiss}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-0 min-w-0 shrink-0"
                aria-label={t('ui.dismiss')}
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <AnimatePresence>
              {showTip && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 px-3 pb-2.5">
                    {isIOS
                      ? 'Tap Share ↗ then "Add to Home Screen"'
                      : isAndroid
                        ? 'Tap ⋮ menu then "Install app"'
                        : 'Use your browser menu to install'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Install section for landing page — shows on ALL devices */
export function InstallSection() {
  const { t } = useT()
  const { canShow, isIOS, isAndroid, hasNativePrompt, promptInstall } = useInstallPrompt()
  const [showTip, setShowTip] = useState(false)

  if (!canShow) return null

  const handleInstall = async () => {
    if (hasNativePrompt) {
      await promptInstall()
    } else {
      setShowTip(true)
      setTimeout(() => setShowTip(false), 5000)
    }
  }

  return (
    <section className="py-10 sm:py-14 px-4" id="install">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto"
      >
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-200/70 dark:border-emerald-700/50 bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/40 dark:from-gray-900 dark:via-emerald-950/20 dark:to-teal-950/30 shadow-xl shadow-emerald-500/10 dark:shadow-emerald-900/30">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]" style={{
            backgroundImage: 'url(/islamic-pattern.svg)',
            backgroundSize: '100px 100px'
          }} />

          <div className="relative p-6 sm:p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 mb-4">
              <Moon className="h-8 w-8 text-white" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1.5">
              {t('ui.getTheApp')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
{t('ui.freeNoAppStoreNeededWorksOffline')}
</p>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleInstall}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-base font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 min-h-0"
            >
              <Download className="h-5 w-5" />
              {t('install.title')}
            </motion.button>

            <AnimatePresence>
              {showTip && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-gray-500 dark:text-gray-400 mt-3"
                >
                  {isIOS
                    ? 'Tap Share ↗ in Safari, then "Add to Home Screen"'
                    : isAndroid
                      ? 'Tap ⋮ in Chrome, then "Install app"'
                      : 'Use your browser menu to install this app'}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
