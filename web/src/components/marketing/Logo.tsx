'use client'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      {/* Checkmark logo - productivity symbol */}
      <div className="relative group">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl shadow-emerald-500/30 dark:shadow-emerald-500/20 ring-2 ring-emerald-400/20 dark:ring-emerald-600/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
          <svg width="20" height="20" viewBox="0 0 100 100" fill="none" className="drop-shadow-md sm:w-[24px] sm:h-[24px]">
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
        {/* Animated glow effect */}
        <div className="absolute inset-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 blur-xl opacity-40 dark:opacity-25 animate-pulse"></div>
      </div>

      {/* Text with enhanced gradient */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent leading-tight">
            Daily Priority
          </span>
          <span className="text-[9px] sm:text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-tight">
            Islamic Productivity
          </span>
        </div>
      )}
    </div>
  )
}