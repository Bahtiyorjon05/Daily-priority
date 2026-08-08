'use client'

import Image from 'next/image'
import { useT } from '@/lib/i18n/client'

/** Kept in step with the shared Logo and the generated icon set. */
const BRAND_MARK = '/icon-512.png'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className = '', showText = true }: LogoProps) {
  const { t } = useT()
  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {/* Same artwork as the app icon. This used to be its own inline tick —
          a third copy of the logo that could drift from the other two. */}
      <div className="relative group shrink-0">
        <div className="relative w-8 h-8 sm:w-10 sm:h-10 overflow-hidden rounded-lg sm:rounded-2xl shadow-lg shadow-emerald-900/25 ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 group-hover:scale-110">
          <Image src={BRAND_MARK} alt="" fill sizes="40px" priority className="object-cover" />
        </div>
        {/* Glow, keyed off the mark's own green rather than a second gradient. */}
        <div className="absolute inset-0 -z-10 rounded-lg sm:rounded-2xl bg-emerald-500 blur-xl opacity-30 dark:opacity-20"></div>
      </div>

      {/* Text with enhanced gradient */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent leading-tight">
            {t('ui.dailyPriority')}
          </span>
          <span className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-tight">
            {t('ui.islamicProductivity')}
          </span>
        </div>
      )}
    </div>
  )
}