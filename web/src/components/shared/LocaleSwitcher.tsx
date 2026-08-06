'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { useT } from '@/lib/i18n/client'
import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/locales'

/**
 * Language switcher.
 *
 * Two locales, so `compact` renders them as a segmented control — a menu that
 * opens to reveal two items is a pointless extra tap. The menu variant exists
 * for the mobile header, where the segmented control doesn't fit.
 *
 * Switching is instant and in-place: no reload, no navigation, so nothing in
 * progress is lost.
 */

export function LocaleSwitcher({
  variant = 'compact',
  className = '',
}: {
  variant?: 'compact' | 'menu'
  className?: string
}) {
  const { locale, setLocale, t } = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

  if (variant === 'compact') {
    return (
      <div
        role="group"
        aria-label={t('locale.switch')}
        className={`inline-flex items-center rounded-full border border-black/10 bg-black/[0.03] p-0.5 dark:border-white/15 dark:bg-white/5 ${className}`}
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
              className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase transition-colors ${
                active
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-white/90 dark:text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {code}
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
        className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase">{locale}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-black/10 bg-white shadow-lg dark:border-white/15 dark:bg-slate-900"
        >
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
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-slate-700 transition-colors hover:bg-black/5 dark:text-slate-200 dark:hover:bg-white/10"
              >
                <span className="flex items-center gap-2">
                  <span aria-hidden>{LOCALE_LABELS[code].flag}</span>
                  {LOCALE_LABELS[code].native}
                </span>
                {active && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LocaleSwitcher
