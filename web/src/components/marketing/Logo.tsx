'use client'

interface LogoProps {
  className?: string
  showText?: boolean
}

export function Logo({ className = '', showText = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Minimalist Icon */}
      <div className="relative">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white"></div>
        </div>
      </div>

      {/* Text */}
      {showText && (
        <span className="text-xl font-bold text-slate-900 dark:text-white">
          Daily Priority
        </span>
      )}
    </div>
  )
}