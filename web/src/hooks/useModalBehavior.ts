'use client'

import { useEffect } from 'react'

/**
 * Standard modal behaviour that every dialog should have:
 *  - Escape closes it
 *  - background page can't scroll while it's open (prevents the "scrolled to a
 *    random place after closing" jump, which is worst on mobile)
 *
 * Usage: useModalBehavior(isOpen, () => setIsOpen(false))
 */
export function useModalBehavior(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }

    // Lock background scroll, compensating for the scrollbar so the page
    // doesn't shift horizontally when it disappears.
    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPaddingRight = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight
    }
  }, [isOpen, onClose])
}
