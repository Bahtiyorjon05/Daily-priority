import { motion } from 'framer-motion'

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
  const sizes = sizeClasses[size]

  const LogoIcon = () => (
    <div className={`${sizes.container} rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 dark:shadow-emerald-500/20 ring-2 ring-emerald-400/20 dark:ring-emerald-600/20`}>
      <svg width="24" height="24" viewBox="0 0 100 100" fill="none" className="drop-shadow-md">
        <circle cx="50" cy="50" r="42" fill="white" opacity="0.95"/>
        <path 
          d="M32 50 L42 60 L68 34" 
          stroke="#10b981" 
          strokeWidth="7" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
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
            Islamic Productivity Hub
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
