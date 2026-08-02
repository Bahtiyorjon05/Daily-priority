'use client'

import { useCallback, useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Standard modal behaviour that every dialog should have:
 *  - Escape closes it
 *  - background page can't scroll while it's open (prevents the "jumped to a
 *    random scroll position" effect after closing, worst on mobile)
 *  - focus moves into the dialog on open, is trapped inside while it's open,
 *    and returns to the trigger on close (keyboard + screen-reader users)
 *
 * Usage:
 *   const modal = useModalBehavior(isOpen, close)
 *   <div ref={modal.ref} {...modal.dialogProps}> … </div>
 */
export function useModalBehavior(isOpen: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  // Keep the latest onClose without re-running the effect on every render.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const getFocusable = () =>
      Array.from(containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      )

    // Move focus into the dialog (first field, else the dialog itself).
    const focusTimer = window.setTimeout(() => {
      const items = getFocusable()
      if (items.length > 0) items[0].focus()
      else containerRef.current?.focus()
    }, 0)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return

      const items = getFocusable()
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null

      // Wrap around instead of escaping to the page behind the modal.
      if (e.shiftKey && (active === first || !containerRef.current?.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
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

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKeyDown, true)
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPaddingRight
      // Restore focus to whatever opened the dialog.
      previouslyFocused.current?.focus?.()
    }
  }, [isOpen])

  const setRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
  }, [])

  return {
    ref: setRef,
    /** Spread onto the dialog container for correct semantics. */
    dialogProps: {
      role: 'dialog' as const,
      'aria-modal': true,
      tabIndex: -1,
    },
  }
}
