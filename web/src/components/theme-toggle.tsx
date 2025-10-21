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
      className="relative overflow-hidden group hover:scale-110 border border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md dark:hover:shadow-lg backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 transition-all duration-300 rounded-full"
      aria-label={`Switch to ${nextThemeLabel} mode`}
      title={`Switch to ${nextThemeLabel} mode`}
    >
      <div className="relative w-5 h-5">
        <Sun className={`h-5 w-5 text-yellow-500 absolute transition-all duration-300 ${effectiveTheme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
        <Moon className={`h-5 w-5 text-indigo-400 absolute transition-all duration-300 ${effectiveTheme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
        <Monitor className={`h-5 w-5 text-gray-500 absolute transition-all duration-300 ${theme === 'system' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
      </div>
    </Button>
  )
}
