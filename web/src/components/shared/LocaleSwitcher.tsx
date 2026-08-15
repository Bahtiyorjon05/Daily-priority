'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Languages } from 'lucide-react'
import { useT } from '@/lib/i18n/client'
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/locales'

/**
 * Language switcher.
 *
 * The header is a row of 44×44 rounded-2xl controls (notifications, phase,
 * Telegram, theme), and this matches them, with the active code on its face so
 * the current language is legible without opening anything.
 *
 * With two languages the icon variant is a straight TOGGLE: one tap swaps to the
 * other and the page is already in it. A menu to choose between two options —
 * where one of them is the one you are looking at — is a dialog to dismiss in
 * exchange for nothing.
 *
 * If a third language is ever added (Russian and Turkish are on the roadmap) a
 * toggle stops being able to express the choice, so it falls back to the menu
 * automatically rather than silently cycling through languages one tap at a
 * time. Nobody has to remember to change this.
 *
 * `inline` stays for the marketing navbar, where there is horizontal room and a
 * segmented control shows both at once.
 */

export function LocaleSwitcher({
  variant = 'icon',
  className = '',
}: {
  variant?: 'icon' | 'inline'
  className?: string
}) {
  const { locale, setLocale, t } = useT()
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)

  // Segmented — marketing navbar only.
  if (variant === 'inline') {
    return (
      <div
        role="group"
        aria-label={t('locale.switch')}
        className={`inline-flex items-center gap-0.5 rounded-full border border-black/[0.08] bg-black/[0.03] p-1 dark:border-white/10 dark:bg-white/[0.06] ${className}`}
      >
        {LOCALES.map(code => {
          const active = code === locale
          return (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              aria-pressed={active}
              aria-label={t('locale.switchTo', { language: LOCALE_LABELS[code].english })}
              className={`relative rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                active
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="locale-pill"
                  className="absolute inset-0 rounded-full bg-emerald-600 shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">{code}</span>
            </button>
          )
        })}
      </div>
    )
  }

  const tile =
    'relative flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-2xl bg-gray-100 shadow-sm transition-all duration-200 hover:scale-105 hover:bg-gray-200 hover:shadow-md dark:bg-gray-800 dark:hover:bg-gray-700'

  const badge = (code: Locale) => (
    <span className="absolute -bottom-0.5 -right-0.5 rounded-md bg-[rgb(var(--phase-accent))] px-1 py-px text-[9px] font-bold uppercase leading-tight text-white shadow-sm ring-2 ring-gray-100 dark:ring-gray-800">
      {code}
    </span>
  )

  // --- Two languages: tap to switch, no menu. ---
  if (LOCALES.length === 2) {
    const next = (LOCALES.find(code => code !== locale) ?? locale) as Locale

    return (
      <button
        type="button"
        onClick={() => setLocale(next)}
        // Names the destination, not the current state: the control's job is
        // "switch to Uzbek", and a screen reader announcing the language you are
        // already reading in tells you nothing.
        aria-label={t('locale.switchTo', { language: LOCALE_LABELS[next].english })}
        title={t('locale.switchTo', { language: LOCALE_LABELS[next].native })}
        className={`${tile} ${className}`}
      >
        <Languages className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" />
        {/*
          The badge swaps with the language. Keyed on the locale so it animates
          on change — the page text also changes underneath, and without some
          movement here the tap can read as having done nothing.
        */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={locale}
            initial={reduceMotion ? false : { opacity: 0, y: -3, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 3, scale: 0.8 }}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            className="absolute -bottom-0.5 -right-0.5 rounded-md bg-[rgb(var(--phase-accent))] px-1 py-px text-[9px] font-bold uppercase leading-tight text-white shadow-sm ring-2 ring-gray-100 dark:ring-gray-800"
          >
            {locale}
          </motion.span>
        </AnimatePresence>
      </button>
    )
  }

  // --- Three or more: a toggle can no longer express the choice. ---
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('locale.current', { language: LOCALE_LABELS[locale].native })}
        className={tile}
      >
        <Languages className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" />
        {badge(locale)}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[65] bg-black/40 backdrop-blur-[2px] sm:hidden"
              aria-hidden="true"
            />
            <motion.div
              role="menu"
              initial={{ opacity: 0, y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 0.96 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="fixed left-3 right-3 top-[4.5rem] z-[70] mx-auto max-w-xs overflow-hidden rounded-2xl border border-black/[0.07] bg-white/95 p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/40 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mx-0 sm:mt-2 sm:w-52 sm:max-w-none sm:origin-top-right"
            >
              {LOCALES.map(code => (
                <button
                  key={code}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setLocale(code)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm transition-colors ${
                    code === locale
                      ? 'bg-emerald-600 font-semibold text-white'
                      : 'text-slate-700 hover:bg-black/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <span aria-hidden className="text-base leading-none">
                    {LOCALE_LABELS[code].flag}
                  </span>
                  <span className="flex-1 text-left">{LOCALE_LABELS[code].native}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LocaleSwitcher
