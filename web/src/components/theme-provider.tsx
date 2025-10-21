'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  systemTheme: 'light' | 'dark'
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  systemTheme: 'light',
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
      // If theme is set to system, update the actual theme
      if (theme === 'system') {
        applyTheme(e.matches ? 'dark' : 'light')
      }
    }
    
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem(storageKey) as Theme | null
    
    // Default to system theme if no saved preference
    const initialTheme = savedTheme || defaultTheme
    setTheme(initialTheme)
    
    // Apply theme immediately
    const actualTheme = initialTheme === 'system' ? systemTheme : initialTheme
    applyTheme(actualTheme)
    
    // Remove preload class to enable transitions
    setTimeout(() => {
      document.body.classList.remove('preload')
    }, 100)
  }, [defaultTheme, storageKey, systemTheme])

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement
    
    // Add transition class for smooth theme switching
    root.classList.add('theme-transition')
    
    // Remove both classes first
    root.classList.remove('light', 'dark')
    
    // Add the new theme class
    root.classList.add(newTheme)
    
    // Apply CSS variables for the theme with smooth transitions
    root.style.setProperty('--theme-transition-duration', '0.3s')
    
    if (newTheme === 'dark') {
      // 2025 Best Practices: Soft black (#121212) instead of pure black
      root.style.setProperty('--background', '18 18 18')      // #121212
      root.style.setProperty('--foreground', '229 229 229')   // #E5E5E5 off-white
      root.style.setProperty('--card', '28 28 28')            // #1C1C1C elevated
      root.style.setProperty('--card-foreground', '229 229 229')
      root.style.setProperty('--popover', '28 28 28')
      root.style.setProperty('--popover-foreground', '229 229 229')
      root.style.setProperty('--primary', '52 211 153')       // Emerald-400
      root.style.setProperty('--primary-foreground', '18 18 18')
      root.style.setProperty('--secondary', '38 38 38')       // #262626
      root.style.setProperty('--secondary-foreground', '212 212 212')
      root.style.setProperty('--muted', '38 38 38')
      root.style.setProperty('--muted-foreground', '163 163 163') // #A3A3A3
      root.style.setProperty('--accent', '38 38 38')
      root.style.setProperty('--accent-foreground', '110 231 183')
      root.style.setProperty('--destructive', '248 113 113')
      root.style.setProperty('--destructive-foreground', '229 229 229')
      root.style.setProperty('--border', '64 64 64')          // #404040 soft borders
      root.style.setProperty('--input', '38 38 38')
      root.style.setProperty('--ring', '52 211 153')
    } else {
      // Light mode - Clean and professional
      root.style.setProperty('--background', '250 251 252')   // Soft white
      root.style.setProperty('--foreground', '15 23 42')      // Deep slate
      root.style.setProperty('--card', '255 255 255')         // Pure white cards
      root.style.setProperty('--card-foreground', '15 23 42')
      root.style.setProperty('--popover', '255 255 255')
      root.style.setProperty('--popover-foreground', '15 23 42')
      root.style.setProperty('--primary', '16 185 129')       // Emerald-600
      root.style.setProperty('--primary-foreground', '255 255 255')
      root.style.setProperty('--secondary', '241 245 249')    // Slate-100
      root.style.setProperty('--secondary-foreground', '51 65 85')
      root.style.setProperty('--muted', '248 250 252')        // Slate-50
      root.style.setProperty('--muted-foreground', '100 116 139')
      root.style.setProperty('--accent', '236 254 243')       // Emerald-50
      root.style.setProperty('--accent-foreground', '5 150 105')
      root.style.setProperty('--destructive', '239 68 68')
      root.style.setProperty('--destructive-foreground', '255 255 255')
      root.style.setProperty('--border', '226 232 240')       // Slate-200
      root.style.setProperty('--input', '255 255 255')
      root.style.setProperty('--ring', '16 185 129')
    }
    
    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove('theme-transition')
    }, 300)
  }
  
  const value = {
    theme,
    systemTheme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme)
      localStorage.setItem(storageKey, newTheme)
      const actualTheme = newTheme === 'system' ? systemTheme : newTheme
      applyTheme(actualTheme)
    },
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}