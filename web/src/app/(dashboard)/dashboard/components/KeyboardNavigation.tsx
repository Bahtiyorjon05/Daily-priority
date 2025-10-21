'use client'

import { useEffect } from 'react'

interface KeyboardNavigationProps {
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void
  onSelect?: () => void
  onEscape?: () => void
}

export default function KeyboardNavigation({
  onNavigate,
  onSelect,
  onEscape
}: KeyboardNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow navigation
      if (e.key === 'ArrowUp' && onNavigate) {
        e.preventDefault()
        onNavigate('up')
      } else if (e.key === 'ArrowDown' && onNavigate) {
        e.preventDefault()
        onNavigate('down')
      } else if (e.key === 'ArrowLeft' && onNavigate) {
        e.preventDefault()
        onNavigate('left')
      } else if (e.key === 'ArrowRight' && onNavigate) {
        e.preventDefault()
        onNavigate('right')
      }
      // Enter to select
      else if (e.key === 'Enter' && onSelect) {
        e.preventDefault()
        onSelect()
      }
      // Escape to close
      else if (e.key === 'Escape' && onEscape) {
        e.preventDefault()
        onEscape()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNavigate, onSelect, onEscape])

  // This component doesn't render anything
  return null
}
