'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Languages } from 'lucide-react'
import { useT } from '@/lib/i18n/client'
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/locales'

/**
 * Language switcher.
 *
 * The header is a row of 44×44 rounded-2xl controls (notifications, phase,
 * theme). The previous version put a segmented EN|UZ pill in that row — a
 * different shape at a different height — and rendered *twice* with a
 * breakpoint swap, so the control changed form mid-resize. It read as bolted
 * on, which is what it was.
 *
 * One control now, matching its neighbours, with the current code on its face
 * so the active language is legible without opening anything.
 *
 * `inline` stays for the marketing navbar, where there is horizontal room and a
 * segmented control genuinely is one tap fewer.
 */

export function LocaleSwitcher({
  variant = 'icon',
  className = '',
}: {
  variant?: 'icon' | 'inline'
  className?: string
}) {
  const { locale, setLocale, t } = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

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

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('locale.current', { language: LOCALE_LABELS[locale].native })}
        /* Matches the theme toggle and notification bell exactly: same box, same
           radius, same hover. 44px is the minimum comfortable touch target. */
        className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-2xl bg-gray-100 shadow-sm transition-all duration-200 hover:scale-105 hover:bg-gray-200 hover:shadow-md dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <Languages className="h-[18px] w-[18px] text-slate-600 dark:text-slate-300" />
        {/* The active code on the face, so the current language is readable
            without opening the menu. */}
        <span className="absolute -bottom-0.5 -right-0.5 rounded-md bg-[rgb(var(--phase-accent))] px-1 py-px text-[9px] font-bold uppercase leading-tight text-white shadow-sm ring-2 ring-gray-100 dark:ring-gray-800">
          {locale}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 0.96 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 z-50 mt-2 w-52 origin-top-right overflow-hidden rounded-2xl border border-black/[0.07] bg-white/95 p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/40"
          >
            <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              {t('locale.switch')}
            </p>
            {LOCALES.map(code => {
              const active = code === locale
              return (
                <button
                  key={code}
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setLocale(code as Locale)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm transition-colors ${
                    active
                      ? 'bg-[rgb(var(--phase-accent)/0.12)] font-semibold text-[rgb(var(--phase-ink-on-surface))]'
                      : 'text-slate-700 hover:bg-black/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <span aria-hidden className="text-base leading-none">
                    {LOCALE_LABELS[code].flag}
                  </span>
                  <span className="flex-1 text-left">{LOCALE_LABELS[code].native}</span>
                  {active && <Check className="h-4 w-4 shrink-0" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LocaleSwitcher
