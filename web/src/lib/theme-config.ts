// Theme utility functions for consistent styling across components

export const themeConfig = {
  // Page themes with their associated colors
  themes: {
    home: {
      name: 'Home',
      primary: 'rgb(16 185 129)', // emerald-600
      secondary: 'rgb(20 184 166)', // teal-600
      accent: 'rgb(245 158 11)', // amber-500
      className: 'theme-home'
    },
    dashboard: {
      name: 'Dashboard',
      primary: 'rgb(59 130 246)', // blue-500
      secondary: 'rgb(6 182 212)', // cyan-500
      accent: 'rgb(34 211 238)', // cyan-400
      className: 'theme-dashboard'
    },
    analytics: {
      name: 'Analytics',
      primary: 'rgb(139 92 246)', // violet-500
      secondary: 'rgb(236 72 153)', // pink-500
      accent: 'rgb(217 70 239)', // fuchsia-500
      className: 'theme-analytics'
    },
    goals: {
      name: 'Goals',
      primary: 'rgb(245 158 11)', // amber-500
      secondary: 'rgb(249 115 22)', // orange-500
      accent: 'rgb(234 179 8)', // yellow-500
      className: 'theme-goals'
    },
    journal: {
      name: 'Journal',
      primary: 'rgb(244 63 94)', // rose-500
      secondary: 'rgb(239 68 68)', // red-500
      accent: 'rgb(251 113 133)', // rose-400
      className: 'theme-journal'
    },
    calendar: {
      name: 'Calendar',
      primary: 'rgb(20 184 166)', // teal-600
      secondary: 'rgb(34 197 94)', // green-500
      accent: 'rgb(16 185 129)', // emerald-600
      className: 'theme-calendar'
    },
    prayers: {
      name: 'Prayers',
      primary: 'rgb(16 185 129)', // emerald-600
      secondary: 'rgb(5 150 105)', // emerald-700
      accent: 'rgb(52 211 153)', // emerald-400
      className: 'theme-prayers'
    },
    focus: {
      name: 'Focus',
      primary: 'rgb(37 99 235)', // blue-600
      secondary: 'rgb(59 130 246)', // blue-500
      accent: 'rgb(96 165 250)', // blue-400
      className: 'theme-focus'
    },
    adhkar: {
      name: 'Adhkar',
      primary: 'rgb(34 197 94)', // green-500
      secondary: 'rgb(22 163 74)', // green-600
      accent: 'rgb(74 222 128)', // green-400
      className: 'theme-adhkar'
    },
    quotes: {
      name: 'Quotes',
      primary: 'rgb(147 51 234)', // purple-600
      secondary: 'rgb(168 85 247)', // purple-500
      accent: 'rgb(192 132 252)', // purple-400
      className: 'theme-quotes'
    },
    auth: {
      name: 'Authentication',
      primary: 'rgb(99 102 241)', // indigo-500
      secondary: 'rgb(168 85 247)', // purple-500
      accent: 'rgb(236 72 153)', // pink-500
      className: 'theme-auth'
    }
  },

  // Get theme by route/page
  getThemeByRoute: (pathname: string) => {
    if (pathname === '/') return 'home'
    if (pathname.includes('/auth') || pathname.includes('/signin') || pathname.includes('/signup')) return 'auth'
    if (pathname.includes('/dashboard')) return 'dashboard'
    if (pathname.includes('/analytics')) return 'analytics'
    if (pathname.includes('/goals')) return 'goals'
    if (pathname.includes('/journal')) return 'journal'
    if (pathname.includes('/calendar')) return 'calendar'
    if (pathname.includes('/prayers')) return 'prayers'
    if (pathname.includes('/focus')) return 'focus'
    if (pathname.includes('/adhkar')) return 'adhkar'
    if (pathname.includes('/quotes')) return 'quotes'
    return 'dashboard' // default
  },

  // Animation presets
  animations: {
    pageTransition: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    },
    staggerChildren: {
      animate: { transition: { staggerChildren: 0.1 } }
    },
    slideUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    }
  },

  // Responsive breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // Common gradients
  gradients: {
    primary: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    secondary: 'bg-gradient-to-r from-blue-600 to-purple-600',
    sunset: 'bg-gradient-to-r from-orange-500 to-pink-500',
    ocean: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    forest: 'bg-gradient-to-r from-green-500 to-emerald-500'
  }
}

// Utility functions
export const getThemeClass = (pathname: string) => {
  const theme = themeConfig.getThemeByRoute(pathname)
  return themeConfig.themes[theme as keyof typeof themeConfig.themes]?.className || 'theme-dashboard'
}

export const getThemeColors = (pathname: string) => {
  const theme = themeConfig.getThemeByRoute(pathname)
  return themeConfig.themes[theme as keyof typeof themeConfig.themes] || themeConfig.themes.dashboard
}

// Dark mode utilities
export const isDarkMode = () => {
  if (typeof window !== 'undefined') {
    return document.documentElement.classList.contains('dark')
  }
  return false
}

export const toggleDarkMode = () => {
  if (typeof window !== 'undefined') {
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    
    root.classList.remove('light', 'dark')
    root.classList.add(isDark ? 'light' : 'dark')
    
    localStorage.setItem('theme', isDark ? 'light' : 'dark')
    
    return !isDark
  }
  return false
}

// Apply theme smoothly with transitions
export const applyThemeTransition = (callback: () => void) => {
  if (typeof window !== 'undefined') {
    // Add transition class
    document.body.classList.add('theme-transition')
    
    // Execute theme change
    callback()
    
    // Remove transition class after animation
    setTimeout(() => {
      document.body.classList.remove('theme-transition')
    }, 300)
  }
}

export default themeConfig