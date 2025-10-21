/**
 * Mobile utilities for touch device detection and mobile-optimized interactions
 */

import { useEffect, useState } from 'react'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const hasTouchScreen = 'ontouchstart' in window
      const hasSmallScreen = window.innerWidth < 768
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      
      setIsMobile(hasTouchScreen || hasSmallScreen || isMobileUserAgent)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return isMobile
}

export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  return isTouchDevice
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isSmall: typeof window !== 'undefined' ? window.innerWidth < 640 : false,
    isMedium: typeof window !== 'undefined' ? window.innerWidth >= 640 && window.innerWidth < 1024 : false,
    isLarge: typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
  })

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setScreenSize({
        width,
        height,
        isSmall: width < 640,
        isMedium: width >= 640 && width < 1024,
        isLarge: width >= 1024,
      })
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  return screenSize
}

export const mobileBreakpoints = {
  xs: '(max-width: 475px)',
  sm: '(max-width: 640px)',
  md: '(max-width: 768px)',
  lg: '(max-width: 1024px)',
  xl: '(max-width: 1280px)',
} as const

/**
 * Mobile-optimized touch utilities
 */
export const touchUtils = {
  // Prevent zoom on double tap for form inputs
  preventZoom: {
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    },
  },
  
  // Enhanced touch targets (minimum 44px)
  touchTarget: 'min-h-[44px] min-w-[44px]',
  
  // Touch-friendly spacing
  spacing: {
    tight: 'p-2 gap-2',
    normal: 'p-3 gap-3',
    loose: 'p-4 gap-4',
  },
  
  // Mobile-optimized animations
  animations: {
    fast: 'transition-all duration-150 ease-out',
    normal: 'transition-all duration-200 ease-out',
    slow: 'transition-all duration-300 ease-out',
  },
}