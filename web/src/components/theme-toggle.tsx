'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from './ui/button'
import { useTheme } from './theme-provider'

export function ThemeToggle() {
  const { theme, systemTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    const effectiveTheme = theme === 'system' ? systemTheme : theme
    const nextTheme = effectiveTheme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
  }

  const effectiveTheme = theme === 'system' ? systemTheme : theme
  const nextThemeLabel = effectiveTheme === 'light' ? 'dark' : 'light'

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative overflow-hidden group hover:scale-110 border-2 border-emerald-300 dark:border-emerald-600 shadow-md hover:shadow-xl dark:hover:shadow-2xl backdrop-blur-sm bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all duration-300 rounded-full h-11 w-11 min-h-[44px] min-w-[44px] shrink-0"
      aria-label={`Switch to ${nextThemeLabel} mode`}
      title={`Switch to ${nextThemeLabel} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun className={`h-5 w-5 text-amber-600 dark:text-yellow-400 absolute transition-all duration-300 ${effectiveTheme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
        <Moon className={`h-5 w-5 text-indigo-600 dark:text-indigo-400 absolute transition-all duration-300 ${effectiveTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
        <Monitor className={`h-5 w-5 text-gray-600 dark:text-gray-400 absolute transition-all duration-300 ${theme === 'system' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
      </div>
    </Button>
  )
}
