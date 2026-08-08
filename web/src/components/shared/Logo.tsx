'use client'

import { useT } from '@/lib/i18n/client'
import Image from 'next/image'
import { motion } from 'framer-motion'

/**
 * Single source for the in-app mark. `scripts/generate-icons.mjs` writes this
 * file along with every PWA and store size, so there is one artwork to change.
 */
const BRAND_MARK = '/icon-512.png'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  showSubtext?: boolean
  animate?: boolean
  className?: string
}

const sizeClasses = {
  sm: {
    container: 'w-8 h-8',
    icon: 'h-4 w-4',
    text: 'text-base',
    subtext: 'text-[10px]'
  },
  md: {
    container: 'w-10 h-10',
    icon: 'h-5 w-5',
    text: 'text-lg',
    subtext: 'text-xs'
  },
  lg: {
    container: 'w-12 h-12',
    icon: 'h-6 w-6',
    text: 'text-xl',
    subtext: 'text-xs'
  },
  xl: {
    container: 'w-16 h-16',
    icon: 'h-8 w-8',
    text: 'text-2xl',
    subtext: 'text-sm'
  }
}

export default function Logo({ 
  size = 'lg', 
  showText = true, 
  showSubtext = true,
  animate = true,
  className = ''
}: LogoProps) {
  const { t } = useT()
  const sizes = sizeClasses[size]

  /**
   * The brand mark, from the same file the PWA and Play Store icons come from.
   *
   * Was an inline SVG tick — a second, divergent logo that had to be edited
   * separately from the icon set, so the app and its home-screen icon could
   * disagree. Pointing at the file means replacing one image updates every
   * surface that renders this component.
   *
   * No gradient tile behind it: the artwork carries its own background, and
   * wrapping it in another rounded square produced a border inside a border.
   */
  const LogoIcon = () => (
    <div className={`${sizes.container} relative shrink-0 overflow-hidden rounded-2xl shadow-lg shadow-emerald-900/20 ring-1 ring-black/5 dark:ring-white/10`}>
      <Image
        src={BRAND_MARK}
        alt=""
        fill
        sizes="64px"
        priority
        className="object-cover"
      />
    </div>
  )

  if (!showText) {
    return animate ? (
      <motion.div
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className={className}
      >
        <LogoIcon />
      </motion.div>
    ) : (
      <div className={className}>
        <LogoIcon />
      </div>
    )
  }

  const LogoContent = () => (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoIcon />
      <div className="flex flex-col">
        <h1 className={`${sizes.text} font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent leading-tight`}>
          Daily Priority
        </h1>
        {showSubtext && (
          <p className={`${sizes.subtext} text-muted-foreground font-medium leading-tight`}>
            {t('ui.islamicProductivityHub')}
          </p>
        )}
      </div>
    </div>
  )

  return animate ? (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <LogoContent />
    </motion.div>
  ) : (
    <LogoContent />
  )
}
